import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const projects = [
  {
    title: "E-commerce Premium",
    category: "Design & Dev",
    result: "+340% conversão",
    description: "Redesign completo de plataforma de e-commerce para marca de luxo.",
  },
  {
    title: "App Fintech",
    category: "UI/UX & Mobile",
    result: "200k+ usuários",
    description: "Aplicativo de gestão financeira com interface premiada.",
  },
  {
    title: "Portal Corporativo",
    category: "Desenvolvimento",
    result: "99.9% uptime",
    description: "Plataforma escalável para multinacional com alta disponibilidade.",
  },
  {
    title: "Campanha Digital",
    category: "Marketing",
    result: "12x ROI",
    description: "Estratégia integrada de marketing que superou todas as metas.",
  },
];

const PortfolioSection = () => {
  return (
    <section className="py-32 px-6" id="portfolio">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">Cases de sucesso</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Resultados que
            <br />
            <span className="text-gradient">falam.</span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group border-b border-border/50 py-8 md:py-10 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 cursor-pointer hover:bg-card/30 transition-all duration-300 px-4 -mx-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-primary tracking-[0.2em] uppercase font-body">{project.category}</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors duration-300">
                  {project.title}
                </h3>
              </div>

              <p className="text-muted-foreground font-body max-w-xs hidden md:block">
                {project.description}
              </p>

              <div className="flex items-center gap-4">
                <span className="font-display font-bold text-primary text-lg">{project.result}</span>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all duration-300">
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
