import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractBase64(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "string") {
    const value = payload.trim();
    if (!value) return null;
    if (value.includes("base64,")) {
      const part = value.split("base64,").pop();
      if (part) return part;
    }
    const normalized = value.replace(/\s/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(normalized) && normalized.length > 300) return normalized;
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = extractBase64(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["base64", "data", "media", "file", "buffer"]) {
      if (key in record) {
        const found = extractBase64(record[key]);
        if (found) return found;
      }
    }
    for (const value of Object.values(record)) {
      const found = extractBase64(value);
      if (found) return found;
    }
  }

  return null;
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

interface MediaResult {
  bytes: Uint8Array;
  contentType: string | null;
}

async function fetchDecryptedMedia(
  evoUrl: string,
  evoInstance: string,
  evoToken: string,
  messageId: string,
  tipo: string,
): Promise<MediaResult | null> {
  try {
    const response = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${evoInstance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoToken },
      body: JSON.stringify({
        message: { key: { id: messageId } },
        convertToMp4: tipo === "VIDEO",
      }),
    });

    if (!response.ok) {
      await response.text();
      return null;
    }

    const ct = (response.headers.get("content-type") || "").toLowerCase();

    if (ct.startsWith("audio/") || ct.startsWith("video/") || ct.startsWith("image/")) {
      return { bytes: new Uint8Array(await response.arrayBuffer()), contentType: ct };
    }

    if (ct.includes("application/json")) {
      const payload = await response.json();
      const b64 = extractBase64(payload);
      if (!b64) return null;
      return { bytes: decodeBase64ToBytes(b64), contentType: null };
    }

    const textBody = await response.text();
    const b64 = extractBase64(textBody);
    if (!b64) return null;
    return { bytes: decodeBase64ToBytes(b64), contentType: null };
  } catch {
    return null;
  }
}

function resolveContentType(tipo: string): string {
  if (tipo === "AUDIO") return "audio/ogg";
  if (tipo === "IMAGE") return "image/jpeg";
  if (tipo === "VIDEO") return "video/mp4";
  return "application/octet-stream";
}

function resolveExt(tipo: string): string {
  if (tipo === "AUDIO") return "ogg";
  if (tipo === "IMAGE") return "jpg";
  if (tipo === "VIDEO") return "mp4";
  return "bin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get Evolution API config
    const { data: settings } = await supabase
      .from("company_settings")
      .select("atendimento_api_url, atendimento_api_instance, atendimento_api_token")
      .eq("user_id", userId)
      .single();

    const evoUrl = settings?.atendimento_api_url?.replace(/\/+$/, "");
    const evoInstance = settings?.atendimento_api_instance;
    const evoToken = settings?.atendimento_api_token;

    if (!evoUrl || !evoInstance || !evoToken) {
      return new Response(JSON.stringify({ error: "Instância WhatsApp não configurada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find media messages from user's tickets that are stored in our bucket
    const bucketUrlPrefix = `${supabaseUrl}/storage/v1/object/public/chat-media/`;

    const { data: mediaMessages, error: queryError } = await supabase
      .from("mensagens")
      .select("id, tipo, midia_url, evolution_id, ticket_id")
      .in("tipo", ["AUDIO", "IMAGE", "VIDEO"])
      .not("midia_url", "is", null)
      .not("evolution_id", "is", null)
      .like("midia_url", `${bucketUrlPrefix}%`)
      .order("created_at", { ascending: false })
      .limit(500);

    if (queryError) {
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!mediaMessages || mediaMessages.length === 0) {
      return new Response(JSON.stringify({ success: true, reprocessed: 0, failed: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter only messages whose storage objects have invalid mimetypes
    const toReprocess: typeof mediaMessages = [];

    for (const msg of mediaMessages) {
      const storagePath = msg.midia_url!.replace(bucketUrlPrefix, "");
      const { data: objects } = await supabase.storage.from("chat-media").list(
        storagePath.split("/").slice(0, -1).join("/"),
        { limit: 100 }
      );

      const fileName = storagePath.split("/").pop();
      const obj = objects?.find((o: any) => o.name === fileName);

      if (obj) {
        const mimetype = (obj as any).metadata?.mimetype || "";
        if (
          mimetype === "application/octet-stream" ||
          mimetype === "" ||
          (msg.tipo === "AUDIO" && !mimetype.startsWith("audio/")) ||
          (msg.tipo === "IMAGE" && !mimetype.startsWith("image/")) ||
          (msg.tipo === "VIDEO" && !mimetype.startsWith("video/"))
        ) {
          toReprocess.push(msg);
        }
      }
    }

    console.log(`Found ${toReprocess.length} media files to reprocess out of ${mediaMessages.length}`);

    let reprocessed = 0;
    let failed = 0;

    for (const msg of toReprocess) {
      try {
        const result = await fetchDecryptedMedia(evoUrl, evoInstance, evoToken, msg.evolution_id!, msg.tipo);

        if (!result || result.bytes.byteLength === 0) {
          console.warn(`No decrypted media for message ${msg.id}`);
          failed++;
          continue;
        }

        const contentType = resolveContentType(msg.tipo);
        const ext = resolveExt(msg.tipo);
        const newPath = `${msg.ticket_id}/${Date.now()}_reprocessed_${Math.random().toString(36).slice(2, 6)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-media")
          .upload(newPath, result.bytes, { contentType, upsert: false });

        if (uploadError) {
          console.error(`Upload failed for message ${msg.id}:`, uploadError);
          failed++;
          continue;
        }

        const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(newPath);

        await supabase
          .from("mensagens")
          .update({ midia_url: urlData.publicUrl })
          .eq("id", msg.id);

        // Delete old file
        const oldPath = msg.midia_url!.replace(bucketUrlPrefix, "");
        await supabase.storage.from("chat-media").remove([oldPath]);

        reprocessed++;
      } catch (err) {
        console.error(`Error reprocessing message ${msg.id}:`, err);
        failed++;
      }
    }

    console.log(`Reprocess complete: ${reprocessed} fixed, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      reprocessed,
      failed,
      total: toReprocess.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Reprocess error:", err);
    return new Response(JSON.stringify({ error: "Internal error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
