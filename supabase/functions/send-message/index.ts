import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { ticket_id, conteudo, atendente_id } = await req.json();

    if (!ticket_id || !conteudo) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    // Get ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*, contatos(*)")
      .eq("id", ticket_id)
      .single();

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404, headers: corsHeaders });
    }

    // Get atendente profile
    const { data: perfil } = await supabase
      .from("atendentes_perfil")
      .select("*")
      .eq("id", atendente_id || userId)
      .maybeSingle();

    // Build message with signature
    let finalText = conteudo;
    if (perfil?.assinatura_ativa && perfil?.assinatura_padrao) {
      finalText += "\n\n" + perfil.assinatura_padrao;
    }

    // Get Evolution API config
    const { data: settings } = await supabase
      .from("company_settings")
      .select("evolution_api_url, evolution_api_instance, evolution_api_token")
      .eq("user_id", ticket.user_id)
      .single();

    if (settings?.evolution_api_url && settings?.evolution_api_instance && settings?.evolution_api_token) {
      // Send via Evolution API
      try {
        const waNumber = ticket.whatsapp_number.includes("@")
          ? ticket.whatsapp_number
          : ticket.whatsapp_number + "@s.whatsapp.net";

        await fetch(
          `${settings.evolution_api_url}/message/sendText/${settings.evolution_api_instance}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: settings.evolution_api_token,
            },
            body: JSON.stringify({
              number: waNumber,
              text: finalText,
            }),
          }
        );
      } catch (err) {
        console.error("Evolution API error:", err);
      }
    }

    // Insert message
    const { data: msg, error: msgError } = await supabase.from("mensagens").insert({
      ticket_id,
      sentido: "SAIDA",
      tipo: "TEXT",
      conteudo,
      atendente_id: atendente_id || userId,
      assinatura: perfil?.assinatura_ativa ? perfil.assinatura_padrao : null,
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
