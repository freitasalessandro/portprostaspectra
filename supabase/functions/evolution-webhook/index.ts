import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractMessageContent(msg: any): { tipo: string; conteudo: string; midiaUrl: string | null; isSticker?: boolean } {
  const message = msg.message;
  if (!message) return { tipo: "TEXT", conteudo: "", midiaUrl: null };

  // Text messages
  if (message.conversation) return { tipo: "TEXT", conteudo: message.conversation, midiaUrl: null };
  if (message.extendedTextMessage?.text) return { tipo: "TEXT", conteudo: message.extendedTextMessage.text, midiaUrl: null };

  // Image
  if (message.imageMessage) {
    const caption = message.imageMessage.caption || "";
    const url = message.imageMessage.url || msg.mediaUrl || null;
    return { tipo: "IMAGE", conteudo: caption, midiaUrl: url };
  }

  // Video
  if (message.videoMessage) {
    const caption = message.videoMessage.caption || "";
    const url = message.videoMessage.url || msg.mediaUrl || null;
    return { tipo: "VIDEO", conteudo: caption, midiaUrl: url };
  }

  // Audio / PTT (voice note)
  if (message.audioMessage) {
    const url = message.audioMessage.url || msg.mediaUrl || null;
    return { tipo: "AUDIO", conteudo: "", midiaUrl: url };
  }

  // Document
  if (message.documentMessage) {
    const fileName = message.documentMessage.fileName || "Documento";
    const url = message.documentMessage.url || msg.mediaUrl || null;
    return { tipo: "DOCUMENT", conteudo: fileName, midiaUrl: url };
  }

  // Sticker (treat as image, preserve webp)
  if (message.stickerMessage) {
    const url = message.stickerMessage.url || msg.mediaUrl || null;
    return { tipo: "IMAGE", conteudo: "", midiaUrl: url, isSticker: true };
  }

  // Fallback: any text-like content
  return { tipo: "TEXT", conteudo: "", midiaUrl: null };
}

interface EvolutionMediaConfig {
  url: string;
  instance: string;
  token: string;
}

interface MediaPayload {
  bytes: Uint8Array;
  contentType: string | null;
}

function resolveEvolutionMediaConfig(settings: any, instanceName: string | null): EvolutionMediaConfig | null {
  const trimUrl = (value: string | null | undefined) => (value || "").replace(/\/+$/, "");

  const atendimentoConfig = settings?.atendimento_api_url && settings?.atendimento_api_instance && settings?.atendimento_api_token
    ? {
        url: trimUrl(settings.atendimento_api_url),
        instance: settings.atendimento_api_instance,
        token: settings.atendimento_api_token,
      }
    : null;

  const proposalConfig = settings?.evolution_api_url && settings?.evolution_api_instance && settings?.evolution_api_token
    ? {
        url: trimUrl(settings.evolution_api_url),
        instance: settings.evolution_api_instance,
        token: settings.evolution_api_token,
      }
    : null;

  if (instanceName) {
    if (atendimentoConfig && atendimentoConfig.instance === instanceName) return atendimentoConfig;
    if (proposalConfig && proposalConfig.instance === instanceName) return proposalConfig;
  }

  return atendimentoConfig || proposalConfig;
}

function extractBase64(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === "string") {
    const value = payload.trim();
    if (!value) return null;

    if (value.includes("base64,")) {
      const maybeDataUri = value.split("base64,").pop();
      if (maybeDataUri) return maybeDataUri;
    }

    const normalized = value.replace(/\s/g, "");
    if (/^[A-Za-z0-9+/=]+$/.test(normalized) && normalized.length > 300) {
      return normalized;
    }
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
    const priorityKeys = ["base64", "data", "media", "file", "buffer"];

    for (const key of priorityKeys) {
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
  const normalized = base64.replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function looksLikePlayableMedia(contentType: string | null, tipo: string, size: number): boolean {
  if (!size) return false;

  const cleanType = (contentType || "").split(";")[0].toLowerCase();
  if (!cleanType) return true;

  if (
    cleanType.includes("application/json") ||
    cleanType.includes("text/html") ||
    cleanType.includes("text/plain")
  ) {
    return false;
  }

  if (tipo === "AUDIO") return cleanType.startsWith("audio/");
  if (tipo === "IMAGE") return cleanType.startsWith("image/");
  if (tipo === "VIDEO") return cleanType.startsWith("video/");

  return true;
}

function resolveUploadContentType(tipo: string, isSticker: boolean, detectedContentType: string | null): string {
  const cleanType = (detectedContentType || "").split(";")[0].toLowerCase();

  if (tipo === "AUDIO") {
    return cleanType.startsWith("audio/") ? cleanType : "audio/ogg";
  }

  if (tipo === "IMAGE") {
    if (isSticker) return "image/webp";
    return cleanType.startsWith("image/") ? cleanType : "image/jpeg";
  }

  if (tipo === "VIDEO") {
    return cleanType.startsWith("video/") ? cleanType : "video/mp4";
  }

  if (tipo === "DOCUMENT") {
    return cleanType || "application/octet-stream";
  }

  return cleanType || "application/octet-stream";
}

function resolveExtension(tipo: string, isSticker: boolean, contentType: string): string {
  const cleanType = contentType.toLowerCase();

  if (tipo === "AUDIO") {
    if (cleanType.includes("mpeg")) return "mp3";
    if (cleanType.includes("wav")) return "wav";
    if (cleanType.includes("mp4") || cleanType.includes("m4a")) return "m4a";
    return "ogg";
  }

  if (tipo === "IMAGE") {
    if (isSticker || cleanType.includes("webp")) return "webp";
    if (cleanType.includes("png")) return "png";
    return "jpg";
  }

  if (tipo === "VIDEO") {
    if (cleanType.includes("webm")) return "webm";
    return "mp4";
  }

  return "bin";
}

function isEphemeralWhatsappUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === "web.whatsapp.net";
  } catch {
    return false;
  }
}

async function fetchDecryptedMedia(
  config: EvolutionMediaConfig,
  messageKey: Record<string, unknown>,
  tipo: string,
): Promise<MediaPayload | null> {
  try {
    const response = await fetch(`${config.url}/chat/getBase64FromMediaMessage/${config.instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.token,
      },
      body: JSON.stringify({
        message: { key: messageKey },
        convertToMp4: tipo === "VIDEO",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Decrypted media fetch failed:", response.status, errorText);
      return null;
    }

    const responseType = (response.headers.get("content-type") || "").toLowerCase();

    if (responseType.startsWith("audio/") || responseType.startsWith("video/") || responseType.startsWith("image/")) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      return { bytes, contentType: responseType };
    }

    if (responseType.includes("application/json")) {
      const payload = await response.json();
      const base64 = extractBase64(payload);
      if (!base64) return null;
      return { bytes: decodeBase64ToBytes(base64), contentType: null };
    }

    const textBody = await response.text();
    const base64 = extractBase64(textBody);
    if (!base64) return null;

    return { bytes: decodeBase64ToBytes(base64), contentType: null };
  } catch (error) {
    console.error("Decrypted media fetch error:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const event = body.event;
    const instanceName = body.instance || body.instanceName || body.instance_name || null;
    console.log("Webhook event:", event, "instance:", instanceName);

    // Resolve owner by matching the instance name to company_settings
    async function resolveOwner(): Promise<string | null> {
      if (instanceName) {
        // First check atendimento instance (chat/support)
        const { data: atendimentoMatch } = await supabase
          .from("company_settings")
          .select("user_id")
          .eq("atendimento_api_instance", instanceName)
          .limit(1)
          .maybeSingle();
        if (atendimentoMatch) return atendimentoMatch.user_id;

        // Then check proposals instance
        const { data: proposalMatch } = await supabase
          .from("company_settings")
          .select("user_id")
          .eq("evolution_api_instance", instanceName)
          .limit(1)
          .maybeSingle();
        if (proposalMatch) return proposalMatch.user_id;
      }
      // Fallback: single-tenant (first record)
      const { data } = await supabase
        .from("company_settings")
        .select("user_id")
        .limit(1)
        .single();
      return data?.user_id || null;
    }

    // Always return 200 to prevent Evolution API retries
    if (event === "messages.upsert") {
      const msg = body.data;
      if (!msg || !msg.key) return new Response("ok", { headers: corsHeaders });

      const remoteJid = msg.key.remoteJid || "";
      const isGroup = remoteJid.endsWith("@g.us");
      const isFromMe = msg.key.fromMe === true;
      const messageId = msg.key.id;
      const pushName = msg.pushName || null;

      // Skip own messages and empty JIDs
      if (!remoteJid || isFromMe) {
        console.log("Skipping:", isFromMe ? "own message" : "empty jid");
        return new Response("ok", { headers: corsHeaders });
      }

      const ownerId = await resolveOwner();
      if (!ownerId) return new Response("no settings", { headers: corsHeaders });

      const { data: companySettings } = await supabase
        .from("company_settings")
        .select("atendimento_api_url, atendimento_api_instance, atendimento_api_token, evolution_api_url, evolution_api_instance, evolution_api_token")
        .eq("user_id", ownerId)
        .maybeSingle();

      const evolutionConfig = resolveEvolutionMediaConfig(companySettings, instanceName);

      // For group messages, check if group is allowed
      if (isGroup) {
        const { data: allowedGroup } = await supabase
          .from("allowed_groups")
          .select("id")
          .eq("user_id", ownerId)
          .eq("group_jid", remoteJid)
          .eq("ativo", true)
          .maybeSingle();

        if (!allowedGroup) {
          console.log("Skipping: group not allowed", remoteJid);
          return new Response("ok", { headers: corsHeaders });
        }
        console.log("Processing allowed group message:", remoteJid);
      }

      // For groups, keep the full JID so send-message can route correctly; for private chats, strip suffix
      const cleanNumber = isGroup
        ? remoteJid
        : remoteJid.replace("@s.whatsapp.net", "");

      // Extract message content (text, image, audio, video, document)
      const { tipo, conteudo, midiaUrl, isSticker } = extractMessageContent(msg);

      // Skip empty messages
      if (!conteudo && !midiaUrl) {
        console.log("Skipping empty message");
        return new Response("ok", { headers: corsHeaders });
      }

      // For groups, try to get group name from metadata; for private, use pushName
      const groupSubject = isGroup ? (body.data?.groupMetadata?.subject || body.data?.pushName || remoteJid.replace("@g.us", "")) : null;
      const contactName = isGroup ? (groupSubject + " (Grupo)") : pushName;

      // Find or create contato, only update nome if pushName is present and contato has no name
      let contatoId: string;
      const { data: existingContato } = await supabase
        .from("contatos")
        .select("id, nome")
        .eq("whatsapp_number", cleanNumber)
        .maybeSingle();

      if (existingContato) {
        contatoId = existingContato.id;
        // Update name only if contact has no name and contactName is available
        if (!existingContato.nome && contactName) {
          await supabase.from("contatos").update({ nome: contactName }).eq("id", contatoId);
        }
      } else {
        const { data: newContato } = await supabase
          .from("contatos")
          .insert({ whatsapp_number: cleanNumber, nome: contactName, user_id: ownerId })
          .select("id")
          .single();
        if (!newContato) return new Response("contato error", { headers: corsHeaders });
        contatoId = newContato.id;
      }

      const contato = { id: contatoId };

      if (!contato) return new Response("contato error", { headers: corsHeaders });

      // Find open ticket or create new
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("contato_id", contato.id)
        .in("status", ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let ticketId: string;

      if (existingTicket) {
        ticketId = existingTicket.id;
        // Reopen if AGUARDANDO
        await supabase
          .from("tickets")
          .update({ status: "EM_ATENDIMENTO" })
          .eq("id", ticketId)
          .eq("status", "AGUARDANDO");
      } else {
        const { data: newTicket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            contato_id: contato.id,
            whatsapp_number: cleanNumber,
            user_id: ownerId,
            status: "ABERTO",
          })
          .select("id")
          .single();

        if (ticketError || !newTicket) {
          console.error("Ticket error:", ticketError);
          return new Response("ticket error", { headers: corsHeaders });
        }
        ticketId = newTicket.id;
      }

      // Download media from Evolution API if we have a URL
      let finalMediaUrl = midiaUrl;
      if (midiaUrl && tipo !== "TEXT") {
        try {
          let mediaBytes: Uint8Array | null = null;
          let mediaContentType: string | null = null;
          let rawBytes: Uint8Array | null = null;
          let rawContentType: string | null = null;

          const shouldSkipDirectFetch = isEphemeralWhatsappUrl(midiaUrl);

          // Attempt 1: direct media URL (with instance apikey when available)
          if (!shouldSkipDirectFetch) {
            const directHeaders = evolutionConfig?.token ? { apikey: evolutionConfig.token } : undefined;
            const mediaRes = await fetch(midiaUrl, directHeaders ? { headers: directHeaders } : undefined);

            if (mediaRes.ok) {
              rawContentType = mediaRes.headers.get("content-type");
              rawBytes = new Uint8Array(await mediaRes.arrayBuffer());

              if (looksLikePlayableMedia(rawContentType, tipo, rawBytes.byteLength)) {
                mediaBytes = rawBytes;
                mediaContentType = rawContentType;
              } else {
                console.warn("Direct media download looked invalid, trying decrypted endpoint", {
                  tipo,
                  contentType: rawContentType,
                  size: rawBytes.byteLength,
                });
              }
            } else {
              const errText = await mediaRes.text();
              console.warn("Direct media download failed:", mediaRes.status, errText);
            }
          }

          // Attempt 2: force decrypted media from Evolution API
          if (!mediaBytes && evolutionConfig && msg.key) {
            const decrypted = await fetchDecryptedMedia(evolutionConfig, msg.key as Record<string, unknown>, tipo);
            if (decrypted && decrypted.bytes.byteLength > 0) {
              mediaBytes = decrypted.bytes;
              mediaContentType = decrypted.contentType;
            }
          }

          // Last fallback keeps previous behavior only for non-ephemeral direct URLs
          if (!mediaBytes && rawBytes && !shouldSkipDirectFetch) {
            mediaBytes = rawBytes;
            mediaContentType = rawContentType;
          }

          if (!mediaBytes && shouldSkipDirectFetch) {
            finalMediaUrl = null;
            console.warn("Could not decrypt ephemeral WhatsApp media URL", {
              messageId,
              tipo,
            });
          }

          if (mediaBytes) {
            const contentType = resolveUploadContentType(tipo, !!isSticker, mediaContentType);
            const ext = resolveExtension(tipo, !!isSticker, contentType);
            const path = `${ticketId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from("chat-media")
              .upload(path, mediaBytes, { contentType, upsert: false });

            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
              finalMediaUrl = urlData.publicUrl;
            } else {
              console.error("Media upload error:", uploadError);
            }
          }
        } catch (mediaErr) {
          console.error("Media download error:", mediaErr);
          // Keep original URL as fallback
        }
      }

      // Insert message
      const { error: msgError } = await supabase.from("mensagens").insert({
        ticket_id: ticketId,
        evolution_id: messageId,
        sentido: "ENTRADA",
        tipo,
        conteudo: conteudo || null,
        midia_url: finalMediaUrl,
        timestamp_wa: new Date().toISOString(),
        status_envio: "ENTREGUE",
      });

      if (msgError) console.error("Message insert error:", msgError);

      return new Response("ok", { headers: corsHeaders });
    }

    if (event === "messages.update") {
      const updates = body.data;
      if (Array.isArray(updates)) {
        for (const upd of updates) {
          const messageId = upd.key?.id;
          if (!messageId) continue;
          const status = upd.update?.status;
          let statusEnvio = null;
          if (status === 2) statusEnvio = "ENVIADO";
          else if (status === 3) statusEnvio = "ENTREGUE";
          else if (status === 4) statusEnvio = "LIDO";

          if (statusEnvio) {
            await supabase
              .from("mensagens")
              .update({ status_envio: statusEnvio })
              .eq("evolution_id", messageId);
          }
        }
      }
      return new Response("ok", { headers: corsHeaders });
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
