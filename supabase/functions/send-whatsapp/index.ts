import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { to, message, template_id, proposal_id, event } = body;

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'to' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch Evolution API settings
    const { data: settings, error: settingsError } = await supabase
      .from("company_settings")
      .select("evolution_api_url, evolution_api_token, evolution_api_instance, whatsapp")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: "Configurações da Evolution API não encontradas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { evolution_api_url, evolution_api_token, evolution_api_instance } = settings;

    if (!evolution_api_url || !evolution_api_token || !evolution_api_instance) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada. Acesse Integrações no painel admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve final message text
    let finalMessage = message || "";

    if (template_id && proposal_id) {
      // Fetch template
      const { data: template } = await supabase
        .from("communication_templates")
        .select("message")
        .eq("id", template_id)
        .maybeSingle();

      // Fetch proposal
      const { data: proposal } = await supabase
        .from("proposals")
        .select("client_name, project_title, total_value, slug, valid_until, id")
        .eq("id", proposal_id)
        .maybeSingle();

      if (template && proposal) {
        const baseUrl = req.headers.get("origin") || "https://portprostaspectra.lovable.app";
        const link = proposal.slug ? `${baseUrl}/p/${proposal.slug}` : `${baseUrl}/proposta/${proposal.id}`;
        const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(proposal.total_value || 0));
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const horaStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const formatValidUntil = (d: string | null) => {
          if (!d) return "—";
          const parts = d.split("-");
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
        };

        finalMessage = template.message
          .replace(/\{\{cliente\}\}/g, proposal.client_name || "")
          .replace(/\{\{projeto\}\}/g, proposal.project_title || "")
          .replace(/\{\{valor\}\}/g, valor)
          .replace(/\{\{link\}\}/g, link)
          .replace(/\{\{data_validade\}\}/g, formatValidUntil(proposal.valid_until))
          .replace(/\{\{hora\}\}/g, horaStr)
          .replace(/\{\{protocolo\}\}/g, proposal.id.slice(0, 8).toUpperCase());
      }
    }

    if (!finalMessage) {
      return new Response(
        JSON.stringify({ error: "Mensagem vazia. Forneça 'message' ou 'template_id' + 'proposal_id'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean number
    const cleanNumber = to.replace(/\D/g, "");

    // Send via Evolution API
    const apiUrl = `${evolution_api_url.replace(/\/$/, "")}/message/sendText/${evolution_api_instance}`;

    const evoResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolution_api_token,
      },
      body: JSON.stringify({ number: cleanNumber, text: finalMessage }),
    });

    const evoData = await evoResponse.json();
    const success = evoResponse.ok;

    // Log to communication_history
    if (event && proposal_id) {
      await supabase.from("communication_history").insert({
        user_id: user.id,
        proposal_id,
        event,
        destination_number: cleanNumber,
        status: success ? "enviado" : "falhou",
        message_sent: finalMessage,
        error_details: success ? null : JSON.stringify(evoData),
      });
    }

    if (!success) {
      console.error("Evolution API error:", evoData);
      return new Response(
        JSON.stringify({ error: evoData?.message || "Erro ao enviar mensagem via Evolution API" }),
        { status: evoResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data: evoData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-whatsapp error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
