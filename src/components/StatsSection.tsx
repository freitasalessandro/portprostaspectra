import { motion } from "framer-motion";

const stats = [
  { value: "Risco 0", label: "Desenvolvimento Cego" },
  { value: "100%", label: "Diagnóstico Revertido" },
  { value: "CTO", label: "As a Service" },
  { value: "360°", label: "Gestão Integrada" },
];

const StatsSection = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
      <div className="line-accent mb-24" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-4xl md:text-6xl font-extrabold text-gradient mb-3">
                {stat.value}
              </div>
              <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase font-body">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="line-accent mt-24" />
    </section>
  );
};

export default StatsSection;
