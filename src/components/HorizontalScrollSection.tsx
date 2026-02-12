import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Cpu, Shield, Target, Zap, Globe, Brain } from "lucide-react";

const cards = [
  {
    icon: Target,
    number: "01",
    title: "Diagnóstico\nEstratégico",
    subtitle: "Cada linha de código justificada pelo ROI.",
    accent: true,
  },
  {
    icon: Cpu,
    number: "02",
    title: "Arquitetura\nde Escala",
    subtitle: "Sistemas que crescem sem quebrar.",
    accent: false,
  },
  {
    icon: Shield,
    number: "03",
    title: "Soberania\nDigital",
    subtitle: "Infraestrutura proprietária. Sem dependência.",
    accent: true,
  },
  {
    icon: Brain,
    number: "04",
    title: "IA Aplicada\nao Lucro",
    subtitle: "Machine Learning que gera margem real.",
    accent: false,
  },
  {
    icon: Zap,
    number: "05",
    title: "Automação\nInteligente",
    subtitle: "Processos que rodam sozinhos.",
    accent: true,
  },
  {
    icon: Globe,
    number: "06",
    title: "Domínio\nde Mercado",
    subtitle: "Tecnologia + Design + Tráfego integrados.",
    accent: false,
  },
];

const HorizontalScrollSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-65%"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="relative h-[400vh]" id="arsenal">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        {/* Background */}
        <motion.div
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 grid-pattern opacity-40"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[250px] rounded-full pointer-events-none" />

        {/* Section header */}
        <div className="px-6 md:px-12 mb-8 md:mb-12 relative z-10">
          <motion.p
            style={{ opacity: bgOpacity }}
            className="text-primary tracking-[0.3em] uppercase text-xs md:text-sm mb-3 font-body flex items-center gap-3"
          >
            <span className="w-12 h-px bg-primary" />
            Arsenal Spectra
          </motion.p>
          <motion.h2
            style={{ opacity: bgOpacity }}
            className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight"
          >
            Ferramentas de{" "}
            <span className="text-gradient-intense">guerra.</span>
          </motion.h2>
        </div>

        {/* Horizontal scroll track */}
        <motion.div
          style={{ x }}
          className="flex gap-6 md:gap-8 pl-6 md:pl-12 will-change-transform"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.number}
              className={`group relative flex-shrink-0 w-[320px] md:w-[420px] h-[380px] md:h-[460px] rounded-2xl border overflow-hidden cursor-default transition-all duration-500 ${
                card.accent
                  ? "border-primary/30 bg-primary/5 hover:border-primary/60"
                  : "border-border/40 bg-card/20 hover:border-primary/40"
              }`}
              whileHover={{ y: -8, transition: { duration: 0.4 } }}
            >
              {/* Glow on hover */}
              <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/0 group-hover:bg-primary/10 blur-[80px] transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/50 to-transparent transition-all duration-700" />

              {/* Content */}
              <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-10">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_25px_hsl(220_100%_55%/0.2)] transition-all duration-500">
                      <card.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-display text-7xl md:text-8xl font-extrabold text-muted-foreground/10 group-hover:text-primary/15 transition-colors duration-500 leading-none">
                      {card.number}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-extrabold leading-tight whitespace-pre-line group-hover:text-primary transition-colors duration-300">
                    {card.title}
                  </h3>
                </div>
                <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              {/* Diagonal line decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
                <div className="absolute top-6 -right-6 w-40 h-px bg-gradient-to-r from-primary/30 to-transparent rotate-[-45deg] group-hover:from-primary/60 transition-colors duration-500" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll progress bar */}
        <div className="px-6 md:px-12 mt-8 md:mt-12 relative z-10">
          <div className="max-w-md h-px bg-border/30 relative overflow-hidden">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="absolute inset-y-0 left-0 w-full bg-primary origin-left"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalScrollSection;
