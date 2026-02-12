import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-32 px-6" id="contato">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-6 font-body">
            A Parceria Definitiva
          </p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[0.95]">
            Você foca no jogo.
            <br />
            <span className="text-gradient">Nós cuidamos do estádio.</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-6 font-body leading-relaxed">
            Gestão de software, dados, infra e governança. Design, Branding e Tráfego Pago integrados para garantir que sua tecnologia não seja apenas funcional, mas dominante no mercado.
          </p>
          <p className="text-muted-foreground/60 text-sm max-w-xl mx-auto mb-12 font-body">
            Aceleração de tração completa: do diagnóstico estratégico à escala — sem risco, sem desenvolvimento cego.
          </p>

          <motion.a
            href="mailto:contato@spectra.dev"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-10 py-5 font-display font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 glow-box tracking-wide uppercase text-sm group"
          >
            Solicitar Diagnóstico Estratégico
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.a>
        </motion.div>

        {/* Footer line */}
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
