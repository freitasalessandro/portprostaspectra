import { motion } from "framer-motion";
import { ArrowUpRight, FileText, ListChecks, ClipboardList, Brain, Palette, Share2, Globe, Megaphone } from "lucide-react";

const cases = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    tags: ["Automação", "Pagamentos", "Contratos"],
    description: "Plataforma SaaS que automatiza vendas, gestão de contratos e cobrança via boleto. Dinheiro no caixa sem fricção.",
    icon: FileText,
    status: "Em produção",
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    tags: ["Projetos", "Financeiro", "Dashboard"],
    description: "Sistema de gestão 360° de projetos com controle de margem financeira em tempo real. O fim do 'acho que estamos lucrando'.",
    icon: ListChecks,
    status: "Em produção",
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    tags: ["Formulários", "Analytics", "Insights"],
    description: "Motor de captura de dados com camada de inteligência que transforma respostas em insights estratégicos acionáveis.",
    icon: ClipboardList,
    status: "Em produção",
  },
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    tags: ["Machine Learning", "Diagnóstico", "Hospitalar"],
    description: "IA de alta precisão para diagnósticos médicos, implantada em hospitais de referência. Se fizemos isso na saúde, imagine no seu negócio.",
    icon: Brain,
    status: "Em produção",
  },
];

const designCases = [
  {
    title: "Identidade Visual",
    description: "Logos, paletas, tipografia e brandbook completo para posicionar sua marca no topo.",
    icon: Palette,
  },
  {
    title: "Social Media & Gestão",
    description: "Criação de conteúdo, calendário editorial e gerenciamento completo de redes sociais.",
    icon: Share2,
  },
  {
    title: "Construção de Sites",
    description: "Landing pages, portais e plataformas web com design premium e alta conversão.",
    icon: Globe,
  },
  {
    title: "Tráfego Pago",
    description: "Campanhas estratégicas para garantir que sua tecnologia domine o mercado.",
    icon: Megaphone,
  },
];

const PortfolioSection = () => {
  return (
    <section className="py-32 px-6" id="arsenal">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">Cases & Produtos</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Desenvolvido pela
            <br />
            <span className="text-gradient">Spectra.</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 font-body max-w-xl">
            Cada projeto é um ecossistema criado para gerar resultado real. Conheça o que já construímos.
          </p>
        </motion.div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-28">
          {cases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative border border-border/40 rounded-2xl p-8 md:p-10 hover:border-primary/60 transition-all duration-500 bg-card/10 hover:bg-card/40 cursor-pointer overflow-hidden"
            >
              {/* Corner glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-700 pointer-events-none" />

              <div className="relative z-10">
                {/* Top row */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <item.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <div>
                      <span className="text-[10px] text-primary tracking-[0.25em] uppercase font-body font-semibold">{item.category}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="font-display text-2xl md:text-3xl font-extrabold mb-3 group-hover:text-primary transition-colors duration-300 leading-tight">
                  {item.title}
                </h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-body tracking-wider uppercase px-3 py-1 rounded-full border border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary/80 transition-colors duration-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Design Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">Inteligência em Design</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Marca que
            <br />
            <span className="text-gradient">domina.</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 font-body max-w-xl">
            Design, branding e tráfego integrados para que sua tecnologia seja dominante no mercado.
          </p>
        </motion.div>

        {/* Design Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {designCases.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border border-border/30 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 bg-card/10 hover:bg-card/30 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
                <service.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
