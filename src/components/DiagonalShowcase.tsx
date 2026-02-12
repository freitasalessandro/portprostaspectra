import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, FileText, ListChecks, ClipboardList, Brain } from "lucide-react";

const cases = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma SaaS que automatiza vendas, gestão de contratos e cobrança via boleto.",
    icon: FileText,
    metric: "3x",
    metricLabel: "mais conversão",
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
    description: "IA de alta precisão para diagnósticos médicos em hospitais de referência.",
    icon: Brain,
    metric: "99%",
    metricLabel: "precisão",
  },
];

const DiagonalShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const row1X = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const row2X = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-3, -3]);

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden noise-overlay">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/3 blur-[200px] rounded-full pointer-events-none" />

      {/* Section header */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body flex items-center gap-3">
            <span className="w-8 h-px bg-primary" />
            Cases de Impacto
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Resultados que
            <br />
            <span className="text-gradient-intense">falam sozinhos.</span>
          </h2>
        </motion.div>
      </div>

      {/* Diagonal grid */}
      <motion.div
        style={{ rotate }}
        className="relative -mx-20"
      >
        {/* Row 1 - slides right */}
        <motion.div
          style={{ x: row1X }}
          className="flex gap-5 md:gap-6 mb-5 md:mb-6 will-change-transform"
        >
          {[...cases, ...cases].map((item, i) => (
            <motion.div
              key={`r1-${i}`}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3 } }}
              className="group flex-shrink-0 w-[340px] md:w-[480px] h-[220px] md:h-[260px] rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 p-6 md:p-8 flex flex-col justify-between cursor-default relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/0 group-hover:bg-primary/8 blur-3xl transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_20px_hsl(220_100%_55%/0.3)] transition-all duration-300">
                      <item.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <span className="text-[10px] text-primary tracking-[0.2em] uppercase font-body font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl md:text-3xl font-extrabold text-gradient-intense leading-none">
                      {item.metric}
                    </span>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">
                      {item.metricLabel}
                    </p>
                  </div>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-extrabold group-hover:text-primary transition-colors duration-300 leading-tight mb-2">
                  {item.title}
                </h3>
              </div>
              <p className="text-muted-foreground font-body text-xs md:text-sm leading-relaxed relative z-10">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Row 2 - slides left */}
        <motion.div
          style={{ x: row2X }}
          className="flex gap-5 md:gap-6 will-change-transform"
        >
          {[...cases.slice(2), ...cases.slice(0, 2), ...cases].map((item, i) => (
            <motion.div
              key={`r2-${i}`}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3 } }}
              className="group flex-shrink-0 w-[340px] md:w-[480px] h-[220px] md:h-[260px] rounded-2xl border border-border/30 bg-card/20 backdrop-blur-sm hover:border-primary/50 transition-all duration-500 p-6 md:p-8 flex flex-col justify-between cursor-default relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/0 group-hover:bg-primary/8 blur-3xl transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_20px_hsl(220_100%_55%/0.3)] transition-all duration-300">
                      <item.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <span className="text-[10px] text-primary tracking-[0.2em] uppercase font-body font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-body">Em produção</span>
                  </div>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-extrabold group-hover:text-primary transition-colors duration-300 leading-tight mb-2">
                  {item.title}
                </h3>
              </div>
              <p className="text-muted-foreground font-body text-xs md:text-sm leading-relaxed relative z-10">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default DiagonalShowcase;
