import { motion } from "framer-motion";
import spectraLogo from "@/assets/spectra-logo.svg";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-end overflow-hidden pb-12 md:pb-20">
      {/* Background image with heavy overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20 scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/70" />
      </div>

      {/* Diagonal cut accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none hidden lg:block">
        <div className="absolute inset-0 bg-primary/[0.03] [clip-path:polygon(30%_0,100%_0,100%_100%,0%_100%)]" />
        <div className="absolute inset-0 border-l border-primary/10 [clip-path:polygon(30%_0,30.1%_0,0.1%_100%,0%_100%)]" />
      </div>

      {/* Floating logo watermark */}
      <motion.img
        src={spectraLogo}
        alt=""
        className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[300px] md:w-[500px] opacity-[0.03] pointer-events-none hidden lg:block"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-body text-[10px] md:text-xs text-primary tracking-[0.4em] uppercase font-semibold">
              Spectra — CTO as a Service
            </span>
          </div>
        </motion.div>

        {/* Headline — contrasting weights */}
        <motion.h1
          className="font-display leading-[0.85] tracking-[-0.04em] mb-10 md:mb-14"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block text-[clamp(3rem,10vw,9rem)] font-extralight text-foreground/80">
            Sua operação
          </span>
          <span className="block text-[clamp(3rem,10vw,9rem)] font-black text-gradient-intense">
            merece mais.
          </span>
        </motion.h1>

        {/* Bottom bar — info + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8 border-t border-border/20"
        >
          <p className="font-body text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg">
            Transformamos complexidade operacional em ativos digitais de alta performance.
            Engenharia, IA, design e tráfego — sob um único teto estratégico.
          </p>

          <div className="flex gap-3 shrink-0">
            <motion.a
              href="#contato"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-7 py-3.5 font-display font-bold text-primary-foreground bg-primary text-xs tracking-widest uppercase relative overflow-hidden group glow-box-intense"
            >
              <span className="relative z-10">Diagnóstico</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </motion.a>
            <motion.a
              href="#arsenal"
              whileHover={{ borderColor: "hsl(220 100% 55% / 0.5)" }}
              className="px-7 py-3.5 font-display font-bold text-foreground/70 border border-border/40 text-xs tracking-widest uppercase transition-all duration-300 hover:text-foreground"
            >
              Explorar
            </motion.a>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="grid grid-cols-3 gap-8 mt-14 md:mt-20 max-w-xl"
        >
          {[
            { value: "0", label: "Risco" },
            { value: "100%", label: "Diagnóstico revertido" },
            { value: "CTO", label: "As a Service" },
          ].map((stat, i) => (
            <div key={i} className="group">
              <span className="font-display text-2xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors duration-300">
                {stat.value}
              </span>
              <p className="font-body text-[10px] md:text-xs text-muted-foreground/60 tracking-wider uppercase mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
