import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CTO_STRUCTURE = `
Seções para proposta CTO as a Service:
1. "scenario" - Visão do Cenário:
   - "mapeamento": Mapeamento do cenário atual da operação
   - "riscos": Riscos e gargalos identificados
   - "diagnosticos": Resultados do diagnóstico estratégico
2. "solution" - A Solução Proposta:
   - "arquitetura": Arquitetura técnica proposta
   - "ecossistema": Ferramentas, integrações e infraestrutura
   - "ia_automacoes": Soluções de IA e automações
3. "delivery" - Modelo de Entrega:
   - "ciclo": Sprints, milestones e metodologia
4. "investment" - Investimento:
   - "cronogramas": Timeline detalhado
   - "estrutura": Breakdown de custos e fases
   - "credito_diagnostico": Detalhes sobre reversão do diagnóstico
`;

const DESIGN_STRUCTURE = `
Seções para proposta de Design:
1. "scenario" - Visão do Cenário:
   - "mapeamento": Análise do posicionamento atual da marca
   - "branding": Avaliação da identidade visual
   - "trafego": Panorama de tráfego e presença digital
2. "solution" - A Solução Proposta:
   - "ecossistema_marca": Estratégia de identidade visual e branding
   - "performance_trafego": Estratégia de tráfego pago e orgânico
3. "delivery" - Modelo de Entrega:
   - "ciclo": Ciclo de entregas e milestones
   - "gestao_redes": Calendário editorial e gestão de conteúdo
   - "fluxo_tracao": Estratégia de crescimento
   - "entregaveis": Lista de entregáveis por fase
4. "investment" - Investimento:
   - "modelos": Opções de pacotes e valores
`;

// --- Provider helpers ---

async function callLovableAI(messages: any[], apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/gpt-5-nano", messages }),
  });
  return response;
}

async function callAnthropic(messages: any[], apiKey: string) {
  // Convert openai-style messages to Anthropic format
  const systemMsg = messages.find((m: any) => m.role === "system")?.content || "";
  const userMsgs = messages.filter((m: any) => m.role !== "system").map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemMsg,
      messages: userMsgs,
    }),
  });
  return response;
}

function extractAnthropicContent(data: any): string | null {
  return data?.content?.[0]?.text || null;
}

function extractLovableContent(data: any): string | null {
  return data?.choices?.[0]?.message?.content || null;
}

// --- Fetch user settings ---

async function getUserSettings(userId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data } = await sb
    .from("company_settings")
    .select("ai_provider, anthropic_api_key")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    provider: data?.ai_provider || "lovable",
    anthropicKey: data?.anthropic_api_key || null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefing, proposalType, sectionKey, sectionTitle, sectionItems, existingContent, userId } = await req.json();

    if (!briefing || !proposalType) {
      return new Response(
        JSON.stringify({ error: "briefing e proposalType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine AI provider from user settings
    let provider = "lovable";
    let anthropicKey: string | null = null;

    if (userId) {
      const settings = await getUserSettings(userId);
      provider = settings.provider;
      anthropicKey = settings.anthropicKey;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (provider === "lovable" && !LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (provider === "anthropic" && !anthropicKey) {
      return new Response(
        JSON.stringify({ error: "API key da Anthropic não configurada. Acesse Integrações nas configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const structure = proposalType === "cto" ? CTO_STRUCTURE : DESIGN_STRUCTURE;
    const isSingleSection = !!sectionKey && !!sectionTitle && Array.isArray(sectionItems);

    let systemPrompt: string;

    if (isSingleSection) {
      const itemsList = sectionItems.map((i: { key: string; label: string }) => `- "${i.key}": ${i.label}`).join("\n");
      systemPrompt = `Você é um consultor sênior da Spectra, uma empresa de tecnologia e design.

Sua tarefa é regenerar APENAS a seção "${sectionTitle}" (key: "${sectionKey}") de uma proposta comercial.

Campos desta seção:
${itemsList}

${existingContent ? `Conteúdo atual (use como referência para melhorar):\n${JSON.stringify(existingContent)}\n` : ""}

REGRAS:
- Escreva de forma profissional, direta e persuasiva
- Use linguagem de consultoria premium, sem ser genérico
- Cada campo deve ter 2-4 parágrafos concisos
- Personalize com base no briefing fornecido
- NÃO invente números, métricas ou valores financeiros

RESPONDA EXCLUSIVAMENTE em JSON válido:
{
  "${sectionKey}": {
    "<item_key>": "conteúdo gerado..."
  }
}

Não inclua nenhum texto fora do JSON. Não use markdown code fences.`;
    } else {
      systemPrompt = `Você é um consultor sênior da Spectra, uma empresa de tecnologia e design que oferece serviços de CTO as a Service e Design (branding, tráfego, redes sociais).

Sua tarefa é gerar o conteúdo completo de uma proposta comercial a partir de um briefing do cliente.

REGRAS:
- Escreva de forma profissional, direta e persuasiva
- Use linguagem de consultoria premium, sem ser genérico
- Cada campo deve ter 2-4 parágrafos concisos
- Personalize com base no briefing fornecido
- NÃO invente números, métricas ou valores financeiros nas seções de texto
- Foque em diagnóstico, estratégia e entregáveis

${structure}

Além das seções, sugira itens de investimento realistas para o escopo descrito.
Cada item deve ter:
- service_name: nome do serviço
- description: descrição curta do entregável
- payment_type: "setup" (pagamento único) ou "recurring" (mensal)
- estimated_price: valor estimado em reais (número, sem formatação). Use valores realistas de mercado brasileiro para serviços de tecnologia/design.
- quantity: quantidade (geralmente 1)

RESPONDA EXCLUSIVAMENTE em JSON válido com a estrutura:
{
  "sections": {
    "<section_key>": {
      "<item_key>": "conteúdo gerado..."
    }
  },
  "suggested_title": "Título sugerido para o projeto",
  "suggested_description": "Descrição curta do escopo",
  "suggested_items": [
    {
      "service_name": "Nome do serviço",
      "description": "Descrição do entregável",
      "payment_type": "setup",
      "estimated_price": 5000,
      "quantity": 1
    }
  ]
}

Não inclua nenhum texto fora do JSON. Não use markdown code fences.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Briefing do cliente:\n\n${briefing}` },
    ];

    console.log(`Using provider: ${provider}, messages: ${messages.length}`);

    let response;
    if (provider === "anthropic") {
      response = await callAnthropic(messages, anthropicKey!);
    } else {
      response = await callLovableAI(messages, LOVABLE_API_KEY!);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Verifique seu plano." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "API key inválida. Verifique a chave em Integrações." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar proposta com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = provider === "anthropic"
      ? extractAnthropicContent(data)
      : extractLovableContent(data);

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Falha ao interpretar resposta da IA", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
