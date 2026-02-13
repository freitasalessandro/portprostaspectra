import { motion, AnimatePresence } from "framer-motion";
import { FileText, ListChecks, ClipboardList, Brain } from "lucide-react";
import { useState } from "react";

import forms1 from "@/assets/cases/forms-1.png";
import forms2 from "@/assets/cases/forms-2.png";
import forms3 from "@/assets/cases/forms-3.png";
import forms4 from "@/assets/cases/forms-4.png";
import flowlist1 from "@/assets/cases/flowlist-1.png";
import flowlist2 from "@/assets/cases/flowlist-2.png";

import flowlist4 from "@/assets/cases/flowlist-4.png";
import flowlist5 from "@/assets/cases/flowlist-5.png";
import flowlist6 from "@/assets/cases/flowlist-6.png";

const cases = [
  {
    title: "Contrato Online + Boleto Fácil",
    category: "SaaS · Fintech",
    description: "Plataforma que automatiza vendas, gestão de contratos e cobrança via boleto.",
    icon: FileText,
    metric: "3x",
    metricLabel: "conversão",
    screenshots: [flowlist1, flowlist2, flowlist4, flowlist5, flowlist6],
  },
  {
    title: "FlowList",
    category: "SaaS · Gestão",
    description: "Gestão 360° com controle de margem financeira em tempo real.",
    icon: ListChecks,
    metric: "360°",
    metricLabel: "visão total",
    screenshots: [] as string[],
  },
  {
    title: "Forms",
    category: "SaaS · Dados",
    description: "Motor de captura que transforma respostas em insights acionáveis.",
    icon: ClipboardList,
    metric: "10x",
    metricLabel: "mais dados",
    screenshots: [forms1, forms2, forms3, forms4],
  },
  {
    title: "Calculadora de Linfedema",
    category: "HealthTech · IA",
    description: "IA de alta precisão para diagnósticos médicos em hospitais de referência.",
    icon: Brain,
    metric: "99%",
    metricLabel: "precisão",
    screenshots: [] as string[],
  },
];

const CasesSection = () => {
  const [activeScreenshot, setActiveScreenshot] = useState<Record<number, number>>({});

  return (
    <section className="py-28 md:py-36 px-6 md:px-12 relative overflow-hidden" id="cases">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <motion.div
        className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/4 blur-[180px] rounded-full pointer-events-none"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-[10px] md:text-xs mb-4 font-body flex items-center gap-3">
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Cases
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
            Resultados<br />
            <span className="font-extralight text-foreground/60">que falam sozinhos.</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {cases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ x: 6, transition: { duration: 0.3 } }}
              className="group flex flex-col border border-border/20 hover:border-primary/30 transition-all duration-500 bg-background relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-primary transition-all duration-500" />

              <div className="flex items-stretch">
                {/* Big metric */}
                <div className="hidden md:flex w-40 shrink-0 items-center justify-center border-r border-border/15 bg-card/20 group-hover:bg-primary/5 transition-all duration-500">
                  <div className="text-center">
                    <motion.span
                      className="font-display text-4xl font-black text-gradient-intense block leading-none"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {item.metric}
                    </motion.span>
                    <span className="font-body text-[9px] text-muted-foreground/50 uppercase tracking-widest mt-1 block">
                      {item.metricLabel}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="flex items-center gap-3 md:w-56 shrink-0">
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      transition={{ duration: 0.3 }}
                    >
                      <item.icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                    </motion.div>
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
              </div>

              {/* Screenshots gallery */}
              {item.screenshots.length > 0 && (
                <div className="border-t border-border/15 p-4 md:p-6">
                  <div className="flex flex-col gap-4">
                    {/* Main preview */}
                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-card/30 border border-border/20">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={activeScreenshot[i] ?? 0}
                          src={item.screenshots[activeScreenshot[i] ?? 0]}
                          alt={`${item.title} screenshot`}
                          className="w-full h-full object-cover object-top"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </AnimatePresence>
                    </div>

                    {/* Thumbnails */}
                    {item.screenshots.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {item.screenshots.map((src, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveScreenshot(prev => ({ ...prev, [i]: idx }))}
                            className={`shrink-0 w-20 h-12 md:w-28 md:h-16 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                              (activeScreenshot[i] ?? 0) === idx
                                ? "border-primary shadow-[0_0_10px_hsl(220_100%_55%/0.3)]"
                                : "border-border/20 opacity-50 hover:opacity-80"
                            }`}
                          >
                            <img src={src} alt="" className="w-full h-full object-cover object-top" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CasesSection;
