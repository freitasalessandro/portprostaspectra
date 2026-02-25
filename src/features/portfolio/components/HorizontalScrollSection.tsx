import { motion } from "framer-motion";
import { Cpu, Shield, Target, Zap, Globe, Brain } from "lucide-react";

const cards = [
  {
    icon: Target,
    number: "01",
    title: "Diagnóstico Estratégico",
    subtitle: "Cada linha de código justificada pelo ROI.",
    accent: true,
  },
  {
    icon: Cpu,
    number: "02",
    title: "Arquitetura de Escala",
    subtitle: "Sistemas que crescem sem quebrar.",
    accent: false,
  },
  {
    icon: Shield,
    number: "03",
    title: "Soberania Digital",
    subtitle: "Infraestrutura proprietária. Sem dependência.",
    accent: true,
  },
  {
    icon: Brain,
    number: "04",
    title: "IA Aplicada ao Lucro",
    subtitle: "Machine Learning que gera margem real.",
    accent: false,
  },
  {
    icon: Zap,
    number: "05",
    title: "Automação Inteligente",
    subtitle: "Processos que rodam sozinhos.",
    accent: true,
  },
  {
    icon: Globe,
    number: "06",
    title: "Domínio de Mercado",
    subtitle: "Tecnologia + Design + Tráfego integrados.",
    accent: false,
  },
];

const HorizontalScrollSection = () => {
  return (
    <section className="py-24 md:py-32 relative" id="arsenal">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[250px] rounded-full pointer-events-none" />

      <div className="px-6 md:px-12 max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-xs md:text-sm mb-3 font-body flex items-center gap-3">
            <span className="w-12 h-px bg-primary" />
            Arsenal Spectra
          </p>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Ferramentas de{" "}
            <span className="text-gradient-intense">guerra.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.4 } }}
              className={`group relative rounded-2xl border overflow-hidden cursor-default transition-all duration-500 ${
                card.accent
                  ? "border-primary/30 bg-primary/5 hover:border-primary/60"
                  : "border-border/40 bg-card/20 hover:border-primary/40"
              }`}
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/0 group-hover:bg-primary/10 blur-[80px] transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/50 to-transparent transition-all duration-700" />

              <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-10 min-h-[280px] md:min-h-[320px]">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_25px_hsl(220_100%_55%/0.2)] transition-all duration-500">
                      <card.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-display text-7xl md:text-8xl font-extrabold text-muted-foreground/10 group-hover:text-primary/15 transition-colors duration-500 leading-none">
                      {card.number}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-extrabold leading-tight group-hover:text-primary transition-colors duration-300">
                    {card.title}
                  </h3>
                </div>
                <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed mt-4">
                  {card.subtitle}
                </p>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
                <div className="absolute top-6 -right-6 w-40 h-px bg-gradient-to-r from-primary/30 to-transparent rotate-[-45deg] group-hover:from-primary/60 transition-colors duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollSection;
