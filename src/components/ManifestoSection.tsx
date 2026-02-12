import { motion } from "framer-motion";

const ManifestoSection = () => {
  const lines = [
    { text: "O mercado entrega o que você pede.", highlight: false },
    { text: "Nós entregamos o que o seu lucro exige.", highlight: true },
  ];

  const pillars = [
    {
      number: "01",
      title: "Diagnóstico Primeiro",
      text: "Cada linha de código justificada pelo ROI. 100% do valor revertido no setup do projeto.",
    },
    {
      number: "02",
      title: "Soberania Digital",
      text: "Infraestrutura proprietária. Sem dependência de terceiros. Seus dados, suas regras.",
    },
    {
      number: "03",
      title: "IA que Gera Margem",
      text: "Machine Learning focado em otimização de custos e novas receitas — não em hype.",
    },
  ];

  return (
    <section className="py-32 md:py-44 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Big editorial statement */}
        <div className="mb-24 md:mb-32">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className={`font-display text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight ${
                line.highlight ? "text-gradient-intense mt-2" : "text-foreground"
              }`}
            >
              {line.text}
            </motion.p>
          ))}
        </div>

        {/* Divider */}
        <div className="line-accent mb-20" />

        {/* Pillars — editorial 3-column */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="group"
            >
              <span className="font-display text-sm text-primary tracking-[0.3em] uppercase mb-4 block">
                {pillar.number}
              </span>
              <h3 className="font-display text-xl md:text-2xl font-extrabold mb-4 group-hover:text-primary transition-colors duration-300">
                {pillar.title}
              </h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                {pillar.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ManifestoSection;
