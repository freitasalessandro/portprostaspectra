import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefing, proposalType, sectionKey, sectionTitle, sectionItems, existingContent } = await req.json();

    if (!briefing || !proposalType) {
      return new Response(
        JSON.stringify({ error: "briefing e proposalType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const structure = proposalType === "cto" ? CTO_STRUCTURE : DESIGN_STRUCTURE;

    // Single section regeneration mode
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
- NÃO invente números, métricas ou valores financeiros
- Foque em diagnóstico, estratégia e entregáveis

${structure}

RESPONDA EXCLUSIVAMENTE em JSON válido com a estrutura:
{
  "sections": {
    "<section_key>": {
      "<item_key>": "conteúdo gerado..."
    }
  },
  "suggested_title": "Título sugerido para o projeto",
  "suggested_description": "Descrição curta do escopo"
}

Não inclua nenhum texto fora do JSON. Não use markdown code fences.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Briefing do cliente:\n\n${briefing}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar proposta com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Resposta vazia da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response, handling possible markdown fences
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
