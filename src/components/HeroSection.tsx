import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-body text-primary tracking-[0.3em] uppercase text-sm mb-6">
            Proposta Comercial & Portfólio
          </p>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight mb-8">
            Criamos
            <br />
            <span className="text-gradient">experiências</span>
            <br />
            que vendem.
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-body text-muted-foreground text-lg md:text-xl max-w-xl mb-12 leading-relaxed"
        >
          Design estratégico, tecnologia de ponta e narrativa visual que transforma marcas em referências de mercado.
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
            Solicitar Proposta
          </a>
          <a
            href="#portfolio"
            className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-foreground border border-border hover:border-primary/50 transition-all duration-300 tracking-wide uppercase text-sm"
          >
            Ver Portfólio
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-6"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground text-xs tracking-[0.2em] uppercase rotate-90 origin-center translate-y-8">
              Scroll
            </span>
            <div className="w-px h-16 bg-gradient-to-b from-primary/60 to-transparent mt-12 animate-pulse-glow" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
