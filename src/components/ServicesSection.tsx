import { motion } from "framer-motion";
import { Code, Palette, TrendingUp, Zap } from "lucide-react";

const services = [
  {
    icon: Palette,
    title: "Design & Branding",
    description: "Identidade visual, UI/UX e sistemas de design que posicionam sua marca acima da concorrência.",
    tag: "01",
  },
  {
    icon: Code,
    title: "Desenvolvimento Web",
    description: "Sites e aplicações de alta performance com tecnologias modernas e foco em conversão.",
    tag: "02",
  },
  {
    icon: TrendingUp,
    title: "Marketing Digital",
    description: "Estratégias orientadas a dados, SEO avançado e campanhas que geram resultados mensuráveis.",
    tag: "03",
  },
  {
    icon: Zap,
    title: "Automação & IA",
    description: "Soluções inteligentes que otimizam processos e escalam operações com eficiência.",
    tag: "04",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-32 px-6" id="servicos">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">O que fazemos</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            Serviços sob
            <br />
            <span className="text-gradient">medida.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.tag}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group glass-card p-8 md:p-10 hover:border-primary/40 transition-all duration-500 cursor-default"
            >
              <div className="flex items-start justify-between mb-6">
                <service.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                <span className="text-muted-foreground/40 font-display text-5xl font-extrabold">
                  {service.tag}
                </span>
              </div>
              <h3 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-body">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
