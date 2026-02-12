import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";

const CTASection = () => {
  return (
    <section className="py-32 md:py-44 px-6 md:px-12 relative overflow-hidden" id="contato">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <motion.img
            src={spectraLogo}
            alt="Spectra"
            className="w-12 h-9 mx-auto mb-10"
            style={{ filter: "drop-shadow(0 0 20px hsl(220 100% 55% / 0.3))" }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          />

          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[0.95]">
            Você foca no jogo.
            <br />
            <span className="text-gradient-intense">Nós cuidamos do estádio.</span>
          </h2>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-4 font-body leading-relaxed">
            Do diagnóstico estratégico à escala — sem risco, sem desenvolvimento cego. Software, IA, design e tráfego integrados em um único parceiro.
          </p>

          <p className="text-muted-foreground/50 text-sm max-w-lg mx-auto mb-12 font-body">
            O diagnóstico é remunerado e 100% revertido no setup. Você só investe se fizer sentido.
          </p>

          <motion.a
            href="mailto:contato@spectra.dev"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-10 py-5 font-display font-bold text-primary-foreground bg-primary transition-all duration-300 tracking-wide uppercase text-sm group relative overflow-hidden glow-box-intense"
          >
            <span className="relative z-10 flex items-center gap-3">
              Solicitar Diagnóstico
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.a>
        </motion.div>

        {/* Footer */}
        <div className="mt-32 pt-8 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground/40 text-xs tracking-[0.15em] uppercase font-body">
            © 2026 Spectra — Engenharia & Inteligência de Negócios
          </p>
          <div className="flex gap-6">
            <a href="#arsenal" className="text-muted-foreground/40 text-xs tracking-wider uppercase font-body hover:text-primary transition-colors duration-300">Arsenal</a>
            <a href="#cases" className="text-muted-foreground/40 text-xs tracking-wider uppercase font-body hover:text-primary transition-colors duration-300">Cases</a>
            <a href="#contato" className="text-muted-foreground/40 text-xs tracking-wider uppercase font-body hover:text-primary transition-colors duration-300">Contato</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
