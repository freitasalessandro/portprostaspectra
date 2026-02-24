import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { ticket_id, conteudo, atendente_id, tipo, midia_url } = await req.json();

    if (!ticket_id || (!conteudo && !midia_url)) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    const msgTipo = tipo || "TEXT";

    // Get ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*, contatos(*)")
      .eq("id", ticket_id)
      .single();

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404, headers: corsHeaders });
    }

    // Get atendente profile — try by id first, then by user_id as fallback
    let perfil: any = null;
    if (atendente_id) {
      const { data } = await supabase
        .from("atendentes_perfil")
        .select("*")
        .eq("id", atendente_id)
        .maybeSingle();
      perfil = data;
    }
    if (!perfil) {
      const { data } = await supabase
        .from("atendentes_perfil")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      perfil = data;
    }

    // Fallback name from profile table if atendente profile is missing/incomplete
    const { data: appProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();

    // Build message with operator name prefix + optional footer signature
    let finalText = conteudo || "";
    const operatorName =
      perfil?.nome_completo ||
      appProfile?.display_name ||
      (user.email ? user.email.split("@")[0] : null);

    // Always prepend operator name before the message text
    if (msgTipo === "TEXT" && operatorName && finalText) {
      finalText = `*${operatorName}:*\n${finalText}`;
    }

    // Optional footer signature (keeps existing toggle behavior)
    const sigActive = perfil?.assinatura_ativa !== false;
    if (msgTipo === "TEXT" && sigActive && perfil?.assinatura_padrao) {
      finalText += "\n\n" + perfil.assinatura_padrao;
    }
    const { data: settings } = await supabase
      .from("company_settings")
      .select("atendimento_api_url, atendimento_api_instance, atendimento_api_token")
      .eq("user_id", ticket.user_id)
      .single();

    const evoUrl = settings?.atendimento_api_url;
    const evoInstance = settings?.atendimento_api_instance;
    const evoToken = settings?.atendimento_api_token;

    if (evoUrl && evoInstance && evoToken) {
      const baseUrl = evoUrl.replace(/\/+$/, "");
      try {
        const waNumber = ticket.whatsapp_number.includes("@")
          ? ticket.whatsapp_number
          : ticket.whatsapp_number + "@s.whatsapp.net";

        if (msgTipo === "TEXT") {
          await fetch(
            `${baseUrl}/message/sendText/${evoInstance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: evoToken,
              },
              body: JSON.stringify({ number: waNumber, text: finalText }),
            }
          );
        } else if (msgTipo === "IMAGE" && midia_url) {
          await fetch(
            `${baseUrl}/message/sendMedia/${evoInstance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: evoToken,
              },
              body: JSON.stringify({
                number: waNumber,
                mediatype: "image",
                media: midia_url,
                caption: conteudo || "",
              }),
            }
          );
        } else if ((msgTipo === "DOCUMENT" || msgTipo === "AUDIO" || msgTipo === "VIDEO") && midia_url) {
          await fetch(
            `${baseUrl}/message/sendMedia/${evoInstance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: evoToken,
              },
              body: JSON.stringify({
                number: waNumber,
                mediatype: msgTipo === "DOCUMENT" ? "document" : msgTipo === "VIDEO" ? "video" : "audio",
                media: midia_url,
                caption: conteudo || "",
                fileName: midia_url.split("/").pop() || "file",
              }),
            }
          );
        }
      } catch (err) {
        console.error("Evolution API error:", err);
      }
    }

    // Insert message
    const { data: msg, error: msgError } = await supabase.from("mensagens").insert({
      ticket_id,
      sentido: "SAIDA",
      tipo: msgTipo,
      conteudo: conteudo || null,
      midia_url: midia_url || null,
      atendente_id: atendente_id || userId,
      assinatura: operatorName || null,
      status_envio: "ENVIADO",
    }).select().single();

    if (msgError) {
      return new Response(JSON.stringify({ error: msgError.message }), { status: 500, headers: corsHeaders });
    }

    // Update ticket if ABERTO
    if (ticket.status === "ABERTO") {
      await supabase.from("tickets").update({
        status: "EM_ATENDIMENTO",
        atendente_id: atendente_id || userId,
        assumed_at: new Date().toISOString(),
      }).eq("id", ticket_id);
    }

    return new Response(JSON.stringify({ success: true, message: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send message error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
