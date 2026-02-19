import AdminLayout from "@/components/AdminLayout";
import { FileText, ListChecks, ClipboardList, Brain, PenTool, Code2, Palette, Share2, Globe, Megaphone, ExternalLink } from "lucide-react";

interface ServiceItem {
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  status: "production" | "development";
  link?: string;
}

const saasProducts: ServiceItem[] = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma que automatiza vendas, gestão de contratos e cobrança via boleto.",
    icon: FileText,
    status: "production",
    link: "https://piloto.contratoonline.tec.br/",
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    description: "Gestão 360° com controle de margem financeira em tempo real.",
    icon: ListChecks,
    status: "production",
    link: "https://flowlist.com.br/",
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    description: "Motor de captura que transforma respostas em insights acionáveis.",
    icon: ClipboardList,
    status: "production",
  },
  {
    title: "Spectra Sign",
    category: "SaaS · Assinaturas",
    description: "Plataforma de assinatura digital com validade jurídica, integrada ao ecossistema Spectra.",
    icon: PenTool,
    status: "development",
  },
];

const customDev: ServiceItem[] = [
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    description: "IA de alta precisão para diagnósticos médicos, implantada em hospitais de referência.",
    icon: Brain,
    status: "production",
  },
  {
    title: "AVA",
    category: "EdTech · Plataforma",
    description: "Ambiente virtual de aprendizagem personalizado para ensino e gestão educacional.",
    icon: Code2,
    status: "development",
  },
];

const designServices: ServiceItem[] = [
  {
    title: "Identidade Visual",
    category: "Design · Branding",
    description: "Logos, paletas, tipografia e brandbook completo.",
    icon: Palette,
    status: "production",
  },
  {
    title: "Social Media & Gestão",
    category: "Design · Conteúdo",
    description: "Criação de conteúdo, calendário editorial e gerenciamento de redes sociais.",
    icon: Share2,
    status: "production",
  },
  {
    title: "Construção de Sites",
    category: "Design · Web",
    description: "Landing pages, portais e plataformas web com design premium e alta conversão.",
    icon: Globe,
    status: "production",
  },
  {
    title: "Tráfego Pago",
    category: "Marketing · Ads",
    description: "Campanhas estratégicas para garantir que sua tecnologia domine o mercado.",
    icon: Megaphone,
    status: "production",
  },
];

const statusConfig = {
  production: { label: "Em produção", color: "bg-green-500/20 text-green-400" },
  development: { label: "Em desenvolvimento", color: "bg-primary/20 text-primary" },
};

const ServiceCard = ({ service }: { service: ServiceItem }) => {
  const st = statusConfig[service.status];
  return (
    <div className="glass-card p-5 flex items-start gap-4 group hover:border-primary/40 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
        <service.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-display font-bold text-base truncate">{service.title}</h3>
          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm font-bold ${st.color}`}>
            {st.label}
          </span>
        </div>
        <p className="text-[11px] uppercase tracking-widest text-primary/60 mb-1">{service.category}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
      </div>
      {service.link && (
        <a
          href={service.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-8 h-8 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};

const AdminServicos = () => (
  <AdminLayout>
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-8">Serviços</h1>

      {/* Arsenal Spectra */}
      <div className="mb-10">
        <h2 className="font-display text-lg font-bold mb-1">Arsenal Spectra</h2>
        <p className="text-sm text-muted-foreground mb-4">Produtos SaaS próprios</p>
        <div className="grid gap-3">
          {saasProducts.map((s) => (
            <ServiceCard key={s.title} service={s} />
          ))}
        </div>
      </div>

      {/* Desenvolvimento sob medida */}
      <div className="mb-10">
        <h2 className="font-display text-lg font-bold mb-1">Desenvolvimento sob medida</h2>
        <p className="text-sm text-muted-foreground mb-4">Projetos customizados</p>
        <div className="grid gap-3">
          {customDev.map((s) => (
            <ServiceCard key={s.title} service={s} />
          ))}
        </div>
      </div>

      {/* Inteligência em Design */}
      <div>
        <h2 className="font-display text-lg font-bold mb-1">Inteligência em Design</h2>
        <p className="text-sm text-muted-foreground mb-4">Design, branding e tráfego</p>
        <div className="grid gap-3">
          {designServices.map((s) => (
            <ServiceCard key={s.title} service={s} />
          ))}
        </div>
      </div>
    </div>
  </AdminLayout>
);

export default AdminServicos;
