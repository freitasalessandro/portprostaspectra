import { motion } from "framer-motion";
import { ArrowUpRight, FileText, ListChecks, ClipboardList, Brain } from "lucide-react";

const cases = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma que automatiza vendas, gestão de contratos e cobrança via boleto. Dinheiro no caixa sem fricção.",
    icon: FileText,
    metric: "3x",
    metricLabel: "conversão",
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    description: "Sistema de gestão 360° com controle de margem financeira em tempo real.",
    icon: ListChecks,
    metric: "360°",
    metricLabel: "visão total",
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    description: "Motor de captura que transforma respostas em insights estratégicos acionáveis.",
    icon: ClipboardList,
    metric: "10x",
    metricLabel: "mais dados",
  },
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    description: "IA de alta precisão para diagnósticos médicos em hospitais de referência. Se fizemos na saúde, imagine no seu negócio.",
    icon: Brain,
    metric: "99%",
    metricLabel: "precisão",
  },
];

const CasesSection = () => {
  return (
    <section className="py-32 px-6 md:px-12 relative overflow-hidden" id="cases">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute bottom-1/3 right-0 w-[500px] h-[500px] bg-primary/4 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-xs mb-4 font-body flex items-center gap-3">
            <span className="w-12 h-px bg-primary" />
            Cases em Produção
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1]">
            Resultados que{" "}
            <span className="text-gradient-intense">falam sozinhos.</span>
          </h2>
        </motion.div>

        {/* Editorial stacked cards with alternating layout */}
        <div className="space-y-4">
          {cases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border border-border/30 hover:border-primary/40 transition-all duration-500 bg-background relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-700" />

              <div className="grid grid-cols-1 md:grid-cols-12 items-center">
                {/* Category + Icon */}
                <div className="md:col-span-1 p-6 md:p-8 flex md:justify-center border-b md:border-b-0 md:border-r border-border/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                    <item.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                </div>

                {/* Title + Category */}
                <div className="md:col-span-4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border/20">
                  <span className="text-[10px] text-primary tracking-[0.25em] uppercase font-body font-semibold block mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-display text-xl md:text-2xl font-extrabold group-hover:text-primary transition-colors duration-300 leading-tight">
                    {item.title}
                  </h3>
                </div>

                {/* Description */}
                <div className="md:col-span-4 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border/20">
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Metric */}
                <div className="md:col-span-2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border/20 text-center">
                  <span className="font-display text-3xl md:text-4xl font-extrabold text-gradient-intense leading-none block">
                    {item.metric}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 block">
                    {item.metricLabel}
                  </span>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 p-6 md:p-8 flex justify-center">
                  <div className="w-10 h-10 rounded-full border border-border/40 flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CasesSection;
