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
            Pronto para começar?
          </p>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[0.95]">
            Vamos construir algo
            <br />
            <span className="text-gradient">extraordinário.</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 font-body leading-relaxed">
            Entre em contato e receba uma proposta personalizada para o seu projeto. Sem compromisso, sem burocracia.
          </p>

          <motion.a
            href="mailto:contato@seudominio.com"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-10 py-5 font-display font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 glow-box tracking-wide uppercase text-sm group"
          >
            Fale Conosco
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </motion.a>
        </motion.div>

        {/* Footer line */}
        <div className="mt-32 pt-8 border-t border-border/30">
          <p className="text-muted-foreground/50 text-xs tracking-[0.2em] uppercase font-body">
            © 2026 — Todos os direitos reservados
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
