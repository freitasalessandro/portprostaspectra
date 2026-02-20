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

    const { proposal_id, contract_id, event } = await req.json();

    if (!event || (!proposal_id && !contract_id)) {
      return new Response(
        JSON.stringify({ error: "event e (proposal_id ou contract_id) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isContractEvent = event.startsWith("contrato_");
    let userId: string;
    let prospectNumber = "";
    let templateVars: Record<string, string> = {};

    if (isContractEvent && contract_id) {
      // Get contract info
      const { data: contract, error: cErr } = await supabase
        .from("contracts")
        .select("id, user_id, title, slug, access_code, client_name, client_phone, whatsapp_number, proposal_id, status")
        .eq("id", contract_id)
        .single();

      if (cErr || !contract) {
        return new Response(
          JSON.stringify({ error: "Contrato não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = contract.user_id;
      prospectNumber = (contract.whatsapp_number || contract.client_phone || "").replace(/\D/g, "");

      const baseUrl = req.headers.get("origin") || "https://portprostaspectra.lovable.app";
      const contratoLink = contract.slug ? `${baseUrl}/contrato/${contract.slug}` : "";

      // If contract has a linked proposal, get proposal info for extra vars
      let proposalVars: Record<string, string> = {};
      if (contract.proposal_id) {
        const { data: prop } = await supabase
          .from("proposals")
          .select("client_name, project_title, total_value")
          .eq("id", contract.proposal_id)
          .maybeSingle();
        if (prop) {
          proposalVars = {
            projeto: prop.project_title || "",
            valor: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(prop.total_value || 0)),
          };
        }
      }

      templateVars = {
        cliente: contract.client_name || proposalVars.projeto || "",
        projeto: proposalVars.projeto || "",
        valor: proposalVars.valor || "",
        link: contratoLink,
        contrato_titulo: contract.title || "",
        contrato_link: contratoLink,
        contrato_codigo: contract.access_code || "",
        codigo: contract.access_code || "",
        protocolo: contract.id.slice(0, 8).toUpperCase(),
      };
    } else {
      // Proposal event
      const { data: proposal, error: propError } = await supabase
        .from("proposals")
        .select("id, user_id, client_name, project_title, total_value, slug, valid_until, whatsapp_number, client_phone, access_code")
        .eq("id", proposal_id)
        .single();

      if (propError || !proposal) {
        return new Response(
          JSON.stringify({ error: "Proposta não encontrada" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = proposal.user_id;
      prospectNumber = (proposal.whatsapp_number || proposal.client_phone || "").replace(/\D/g, "");

      const baseUrl = req.headers.get("origin") || "https://portprostaspectra.lovable.app";
      const link = proposal.slug ? `${baseUrl}/proposta/${proposal.slug}` : `${baseUrl}/proposta/${proposal.id}`;
      const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(proposal.total_value || 0));

      const formatValidUntil = (d: string | null) => {
        if (!d) return "—";
        const parts = d.split("-");
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
      };

      templateVars = {
        cliente: proposal.client_name || "",
        projeto: proposal.project_title || "",
        valor,
        link,
        data_validade: formatValidUntil(proposal.valid_until),
        protocolo: proposal.id.slice(0, 8).toUpperCase(),
        codigo: proposal.access_code || "",
        contrato_titulo: "",
        contrato_link: "",
        contrato_codigo: "",
      };
    }

    // Time in Brasília
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const horaStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    templateVars.hora = horaStr;

    // Get active triggers for this event and user
    const { data: triggers } = await supabase
      .from("communication_triggers")
      .select("id, template_id, recipient")
      .eq("user_id", userId)
      .eq("event", event)
      .eq("active", true);

    if (!triggers || triggers.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum gatilho ativo para este evento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company settings
    const { data: settings } = await supabase
      .from("company_settings")
      .select("evolution_api_url, evolution_api_token, evolution_api_instance, whatsapp")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings?.evolution_api_url || !settings?.evolution_api_token || !settings?.evolution_api_instance) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const commercialNumber = (settings.whatsapp || "").replace(/\D/g, "");
    const results: { trigger_id: string; recipient: string; number: string; status: string; error?: string }[] = [];

    for (const trigger of triggers) {
      const { data: template } = await supabase
        .from("communication_templates")
        .select("message")
        .eq("id", trigger.template_id)
        .maybeSingle();

      if (!template) continue;

      // Replace all variables
      let finalMessage = template.message;
      for (const [key, value] of Object.entries(templateVars)) {
        finalMessage = finalMessage.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      const nums: { number: string; type: string }[] = [];
      if ((trigger.recipient === "cliente" || trigger.recipient === "ambos") && prospectNumber) {
        nums.push({ number: prospectNumber, type: "cliente" });
      }
      if ((trigger.recipient === "comercial" || trigger.recipient === "ambos") && commercialNumber) {
        nums.push({ number: commercialNumber, type: "comercial" });
      }

      for (const dest of nums) {
        try {
          const apiUrl = `${settings.evolution_api_url.replace(/\/$/, "")}/message/sendText/${settings.evolution_api_instance}`;
          const evoResponse = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: settings.evolution_api_token },
            body: JSON.stringify({ number: dest.number, text: finalMessage }),
          });
          const evoData = await evoResponse.json();
          const success = evoResponse.ok;

          await supabase.from("communication_history").insert({
            user_id: userId,
            proposal_id: isContractEvent ? null : (proposal_id || null),
            event,
            destination_number: dest.number,
            status: success ? "enviado" : "falhou",
            message_sent: finalMessage,
            error_details: success ? null : JSON.stringify(evoData),
          });

          results.push({
            trigger_id: trigger.id,
            recipient: dest.type,
            number: dest.number,
            status: success ? "enviado" : "falhou",
            error: success ? undefined : JSON.stringify(evoData),
          });
        } catch (e) {
          results.push({
            trigger_id: trigger.id,
            recipient: dest.type,
            number: dest.number,
            status: "erro",
            error: e.message,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fire-trigger error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
