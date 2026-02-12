import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import spectraLogo from "@/assets/spectra-logo.svg";

const CTASection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden noise-overlay" id="contato">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[200px] rounded-full animate-breathe" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <img
              src={spectraLogo}
              alt="Spectra"
              className="w-16 h-12 animate-float"
              style={{ filter: "drop-shadow(0 0 30px hsl(82 85% 50% / 0.4))" }}
            />
          </motion.div>

          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-6 font-body flex items-center justify-center gap-3">
            <Sparkles className="w-4 h-4" />
            A Parceria Definitiva
            <Sparkles className="w-4 h-4" />
          </p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[0.95]">
            Você foca no jogo.
            <br />
            <span className="text-gradient-intense">Nós cuidamos do estádio.</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-6 font-body leading-relaxed">
            Gestão de software, dados, infra e governança. Design, Branding e Tráfego Pago integrados para garantir que sua tecnologia não seja apenas funcional, mas dominante no mercado.
          </p>
          <p className="text-muted-foreground/60 text-sm max-w-xl mx-auto mb-12 font-body">
            Aceleração de tração completa: do diagnóstico estratégico à escala — sem risco, sem desenvolvimento cego.
          </p>

          <motion.a
            href="mailto:contato@spectra.dev"
            whileHover={{ scale: 1.03, boxShadow: "0 0 40px hsl(82 85% 50% / 0.5), 0 0 100px hsl(82 85% 50% / 0.2)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-10 py-5 font-display font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 glow-box-intense tracking-wide uppercase text-sm group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Solicitar Diagnóstico Estratégico
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </motion.a>
        </motion.div>

        {/* Footer */}
        <div className="mt-32 pt-8 border-t border-border/30">
          <p className="text-muted-foreground/50 text-xs tracking-[0.2em] uppercase font-body">
            © 2026 Spectra — Engenharia de Software & Inteligência de Negócios
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
