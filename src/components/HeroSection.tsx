import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Single ambient glow */}
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-primary/6 blur-[200px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex items-center gap-4 mb-10"
        >
          <motion.img
            src={spectraLogo}
            alt="Spectra"
            className="w-8 h-6"
            style={{ filter: "drop-shadow(0 0 12px hsl(220 100% 55% / 0.4))" }}
          />
          <div className="w-12 h-px bg-primary/40" />
          <span className="font-body text-xs text-muted-foreground tracking-[0.3em] uppercase">
            CTO as a Service
          </span>
        </motion.div>

        {/* Main headline — editorial huge type */}
        <div className="mb-12">
          <motion.h1
            className="font-display text-[clamp(2.8rem,8vw,8rem)] font-extrabold leading-[0.88] tracking-[-0.03em]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="block">Complexidade</span>
            <span className="block text-gradient-intense">vira lucro.</span>
          </motion.h1>
        </div>

        {/* Subheadline + CTA — asymmetric editorial layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="md:col-span-5 md:col-start-1"
          >
            <p className="font-body text-muted-foreground text-base md:text-lg leading-relaxed max-w-md">
              Engenharia de software, IA aplicada e governança digital — tudo integrado sob um modelo que transforma operações travadas em ativos de alta performance.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="md:col-span-4 md:col-start-8 flex flex-col gap-4"
          >
            <motion.a
              href="#contato"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-primary-foreground bg-primary transition-all duration-300 tracking-wide uppercase text-sm relative overflow-hidden group glow-box-intense"
            >
              <span className="relative z-10">Solicitar Diagnóstico</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </motion.a>
            <motion.a
              href="#arsenal"
              whileHover={{ borderColor: "hsl(220 100% 55% / 0.5)" }}
              className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-foreground border border-border/50 transition-all duration-300 tracking-wide uppercase text-sm"
            >
              Conhecer o Arsenal
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2"
      >
        <ArrowDown className="w-4 h-4 text-muted-foreground/40 animate-bounce" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
