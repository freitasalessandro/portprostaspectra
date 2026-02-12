import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";

const CTASection = () => {
  return (
    <section className="relative overflow-hidden" id="contato">
      {/* Top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="py-32 md:py-44 px-6 md:px-12 relative">
        <div className="absolute inset-0 grid-pattern opacity-15" />

        {/* Animated central glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 blur-[180px] rounded-full pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30 pointer-events-none"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 5 + i,
              delay: i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Logo mark */}
            <motion.img
              src={spectraLogo}
              alt=""
              className="w-10 h-8 mb-10 opacity-40"
              style={{ filter: "drop-shadow(0 0 15px hsl(220 100% 55% / 0.3))" }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-tight mb-8 leading-[0.92]">
              <span className="font-extralight text-foreground/70 block">Você foca no jogo.</span>
              <span className="font-black text-gradient-intense block">Nós cuidamos do estádio.</span>
            </h2>

            <p className="text-muted-foreground/70 text-sm md:text-base max-w-xl mb-4 font-body leading-relaxed">
              Software, IA, design e tráfego integrados. Do diagnóstico estratégico à escala — sem risco, sem desenvolvimento cego.
            </p>
            <p className="text-muted-foreground/40 text-xs max-w-md mb-12 font-body">
              O diagnóstico é remunerado e 100% revertido no setup do projeto. Você só investe se fizer sentido.
            </p>

            <motion.a
              href="mailto:contato@spectra.dev"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-8 py-4 font-display font-bold text-primary-foreground bg-primary text-xs tracking-widest uppercase relative overflow-hidden group glow-box-intense"
            >
              <span className="relative z-10 flex items-center gap-3">
                Solicitar Diagnóstico
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 md:px-12 pb-8">
        <div className="max-w-7xl mx-auto pt-6 border-t border-border/15 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground/30 text-[10px] tracking-[0.2em] uppercase font-body">
            © 2026 Spectra — Engenharia & Inteligência de Negócios
          </p>
          <div className="flex gap-6">
            <a href="#arsenal" className="text-muted-foreground/30 text-[10px] tracking-widest uppercase font-body hover:text-primary/60 transition-colors duration-300">Arsenal</a>
            <a href="#cases" className="text-muted-foreground/30 text-[10px] tracking-widest uppercase font-body hover:text-primary/60 transition-colors duration-300">Cases</a>
            <a href="#contato" className="text-muted-foreground/30 text-[10px] tracking-widest uppercase font-body hover:text-primary/60 transition-colors duration-300">Contato</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
