// Template definitions for CTO and Design proposals
export type ProposalType = 'cto' | 'design';

export interface SectionTemplate {
  key: string;
  title: string;
  items: { key: string; label: string; placeholder: string }[];
}

export const CTO_SECTIONS: SectionTemplate[] = [
  {
    key: "scenario",
    title: "Visão do Cenário",
    items: [
      { key: "mapeamento", label: "Mapeamento", placeholder: "Descreva o cenário atual da operação do cliente..." },
      { key: "riscos", label: "Riscos Identificados", placeholder: "Liste os principais riscos e gargalos..." },
      { key: "diagnosticos", label: "Diagnósticos", placeholder: "Resultados do diagnóstico estratégico..." },
    ],
  },
  {
    key: "solution",
    title: "A Solução Proposta",
    items: [
      { key: "arquitetura", label: "Arquitetura", placeholder: "Descreva a arquitetura técnica proposta..." },
      { key: "ecossistema", label: "Ecossistema de Apoio", placeholder: "Ferramentas, integrações e infraestrutura de suporte..." },
      { key: "ia_automacoes", label: "IA & Automações", placeholder: "Soluções de IA e automações planejadas..." },
    ],
  },
  {
    key: "delivery",
    title: "Modelo de Entrega",
    items: [
      { key: "ciclo", label: "Ciclo de Desenvolvimento", placeholder: "Sprints, milestones e metodologia de entrega..." },
    ],
  },
  {
    key: "investment",
    title: "Investimento",
    items: [
      { key: "cronogramas", label: "Cronogramas", placeholder: "Timeline detalhado do projeto..." },
      { key: "estrutura", label: "Estrutura de Investimento", placeholder: "Breakdown de custos e fases de pagamento..." },
      { key: "credito_diagnostico", label: "Crédito de Diagnóstico", placeholder: "Detalhes sobre a reversão do diagnóstico no setup..." },
    ],
  },
];

export const DESIGN_SECTIONS: SectionTemplate[] = [
  {
    key: "scenario",
    title: "Visão do Cenário",
    items: [
      { key: "mapeamento", label: "Mapeamento", placeholder: "Análise do posicionamento atual da marca..." },
      { key: "branding", label: "Branding", placeholder: "Avaliação da identidade visual atual..." },
      { key: "trafego", label: "Tráfego", placeholder: "Panorama atual de tráfego e presença digital..." },
    ],
  },
  {
    key: "solution",
    title: "A Solução Proposta",
    items: [
      { key: "ecossistema_marca", label: "Ecossistema de Marca", placeholder: "Estratégia completa de identidade visual e branding..." },
      { key: "performance_trafego", label: "Performance de Tráfego", placeholder: "Estratégia de tráfego pago e orgânico..." },
    ],
  },
  {
    key: "delivery",
    title: "Modelo de Entrega",
    items: [
      { key: "ciclo", label: "Ciclo", placeholder: "Ciclo de entregas e milestones..." },
      { key: "gestao_redes", label: "Gestão de Redes Sociais", placeholder: "Calendário editorial e gestão de conteúdo..." },
      { key: "fluxo_tracao", label: "Fluxo de Tração", placeholder: "Estratégia de crescimento e tração..." },
      { key: "entregaveis", label: "Entregáveis", placeholder: "Lista detalhada de entregáveis por fase..." },
    ],
  },
  {
    key: "investment",
    title: "Investimento",
    items: [
      { key: "modelos", label: "Modelos de Investimento", placeholder: "Opções de pacotes e valores..." },
    ],
  },
];

export const SPECTRA_CASES = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma que automatiza vendas, gestão de contratos e cobrança via boleto.",
    metric: "3x",
    metricLabel: "conversão",
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    description: "Gestão 360° com controle de margem financeira em tempo real.",
    metric: "360°",
    metricLabel: "visão total",
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    description: "Motor de captura que transforma respostas em insights acionáveis.",
    metric: "10x",
    metricLabel: "mais dados",
  },
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    description: "IA de alta precisão para diagnósticos médicos em hospitais de referência.",
    metric: "99%",
    metricLabel: "precisão",
  },
];

export function getSectionsForType(type: ProposalType): SectionTemplate[] {
  return type === 'cto' ? CTO_SECTIONS : DESIGN_SECTIONS;
}
