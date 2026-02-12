import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import spectraLogo from "@/assets/spectra-logo.svg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32 flex items-center">
        {/* Left content */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-body text-primary tracking-[0.3em] uppercase text-sm mb-6">
              Engenharia de Software & Inteligência de Negócios
            </p>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight mb-8">
              Spectra
              <br />
              <span className="text-gradient">CTO as a</span>
              <br />
              Service.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
          >
            Transformamos complexidade operacional em ativos digitais de alta performance sob o modelo CTO as a Service.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#contato"
              className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 glow-box tracking-wide uppercase text-sm"
            >
              Solicitar Diagnóstico
            </a>
            <a
              href="#arsenal"
              className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-foreground border border-border hover:border-primary/50 transition-all duration-300 tracking-wide uppercase text-sm"
            >
              Ver Arsenal
            </a>
          </motion.div>
        </div>

        {/* Right - Large Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-1 items-center justify-center relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <img
            src={spectraLogo}
            alt="Spectra"
            className="w-[420px] h-auto relative z-10 opacity-90"
            style={{ filter: "drop-shadow(0 0 40px hsl(82 85% 50% / 0.25))" }}
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-12 left-6 z-10"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground text-xs tracking-[0.2em] uppercase rotate-90 origin-center translate-y-8">
            Scroll
          </span>
          <div className="w-px h-16 bg-gradient-to-b from-primary/60 to-transparent mt-12 animate-pulse-glow" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
