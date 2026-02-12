import { motion } from "framer-motion";
import { FileText, ListChecks, ClipboardList, Brain } from "lucide-react";

const cases = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma que automatiza vendas, gestão de contratos e cobrança via boleto.",
    icon: FileText,
    metric: "3x",
    metricLabel: "conversão",
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    description: "Gestão 360° com controle de margem financeira em tempo real.",
    icon: ListChecks,
    metric: "360°",
    metricLabel: "visão total",
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    description: "Motor de captura que transforma respostas em insights acionáveis.",
    icon: ClipboardList,
    metric: "10x",
    metricLabel: "mais dados",
  },
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    description: "IA de alta precisão para diagnósticos médicos em hospitais de referência.",
    icon: Brain,
    metric: "99%",
    metricLabel: "precisão",
  },
];

const CasesSection = () => {
  return (
    <section className="py-28 md:py-36 px-6 md:px-12 relative overflow-hidden" id="cases">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-[10px] md:text-xs mb-4 font-body flex items-center gap-3">
            <span className="w-10 h-px bg-primary/50" />
            Cases
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
            Resultados<br />
            <span className="font-extralight text-foreground/60">que falam sozinhos.</span>
          </h2>
        </motion.div>

        {/* Number-driven case cards */}
        <div className="space-y-3">
          {cases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex items-stretch border border-border/20 hover:border-primary/30 transition-all duration-500 bg-background relative overflow-hidden"
            >
              {/* Accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-primary transition-all duration-500" />

              {/* Big metric */}
              <div className="hidden md:flex w-40 shrink-0 items-center justify-center border-r border-border/15 bg-card/20 group-hover:bg-primary/5 transition-all duration-500">
                <div className="text-center">
                  <span className="font-display text-4xl font-black text-gradient-intense block leading-none">
                    {item.metric}
                  </span>
                  <span className="font-body text-[9px] text-muted-foreground/50 uppercase tracking-widest mt-1 block">
                    {item.metricLabel}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex items-center gap-3 md:w-56 shrink-0">
                  <item.icon className="w-4 h-4 text-primary/60" strokeWidth={1.5} />
                  <div>
                    <span className="text-[9px] text-primary/70 tracking-[0.25em] uppercase font-body font-semibold block">
                      {item.category}
                    </span>
                    <h3 className="font-display text-base md:text-lg font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <p className="text-muted-foreground/60 font-body text-xs leading-relaxed flex-1">
                  {item.description}
                </p>

                {/* Mobile metric */}
                <div className="md:hidden flex items-center gap-2">
                  <span className="font-display text-xl font-black text-gradient-intense">{item.metric}</span>
                  <span className="font-body text-[9px] text-muted-foreground/50 uppercase tracking-wider">{item.metricLabel}</span>
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
