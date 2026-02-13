import { motion } from "framer-motion";

const brands = [
  "Marca 1",
  "Marca 2",
  "Marca 3",
  "Marca 4",
  "Marca 5",
  "Marca 6",
];

const TrustedBrandsSection = () => {
  return (
    <section className="py-20 md:py-28 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-4 font-body flex items-center justify-center gap-3">
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Confiança
            <motion.span
              className="w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-[0.95]">
            Marcas que<br />
            <span className="font-extralight text-foreground/60">confiam na gente.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {brands.map((brand, i) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex items-center justify-center h-24 md:h-28 border border-border/20 hover:border-primary/30 bg-card/10 hover:bg-primary/5 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-primary/5 to-transparent" />
              <span className="font-body text-xs text-muted-foreground/40 group-hover:text-muted-foreground/70 tracking-widest uppercase transition-colors duration-300">
                {brand}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-muted-foreground/30 font-body text-xs tracking-widest uppercase mt-8"
        >
          Envie seus logos para personalizar esta seção
        </motion.p>
      </div>
    </section>
  );
};

export default TrustedBrandsSection;
