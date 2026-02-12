import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ManifestoSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-28 md:py-40 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-15" />

      {/* Animated accent orb */}
      <motion.div
        className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"
        animate={{ x: [0, 50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left — large editorial quote */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-display text-3xl md:text-5xl lg:text-[3.5rem] font-extralight leading-[1.15] tracking-tight text-foreground/70">
              O mercado entrega
              <br />
              o que você pede.
            </p>
            <motion.p
              className="font-display text-3xl md:text-5xl lg:text-[3.5rem] font-black leading-[1.15] tracking-tight mt-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              Nós entregamos o que
              <br />
              <span className="text-gradient-intense">o seu lucro exige.</span>
            </motion.p>
          </motion.div>

          {/* Right — manifesto pillars stacked */}
          <motion.div
            className="lg:col-span-4 lg:col-start-9 space-y-0"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {[
              {
                num: "01",
                title: "Diagnóstico Primeiro",
                text: "Cada linha de código justificada pelo ROI. 100% revertido no setup.",
              },
              {
                num: "02",
                title: "Soberania Digital",
                text: "Infraestrutura proprietária. Seus dados, suas regras.",
              },
              {
                num: "03",
                title: "IA que Gera Margem",
                text: "Machine Learning focado em custos e receitas — não em hype.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.num}
                className="group py-6 border-b border-border/20 first:border-t first:border-t-border/20 relative overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                whileHover={{ x: 4 }}
              >
                {/* Hover accent */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-primary transition-all duration-300" />

                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-display text-[10px] text-primary/60 tracking-[0.3em] uppercase">
                    {item.num}
                  </span>
                  <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                </div>
                <p className="font-body text-muted-foreground text-xs leading-relaxed pl-10">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ManifestoSection;
