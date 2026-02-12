import { motion } from "framer-motion";
import { Shield, Target, Cpu, Zap } from "lucide-react";

const services = [
  {
    icon: Target,
    title: "Diagnóstico Estratégico Remunerado",
    description: "Não começamos um código sem garantir que cada linha escrita vai reduzir custos e escalar sua operação. Valor 100% revertido no setup.",
    tag: "01",
  },
  {
    icon: Cpu,
    title: "Especialistas em Impossíveis",
    description: "Legado obsoleto que trava a empresa ou sistema crítico que ninguém escala — a Spectra resolve. Do Governo a Fintechs, de ISPs a Educação.",
    tag: "02",
  },
  {
    icon: Shield,
    title: "Soberania Digital",
    description: "Projetos como PAX e SAGAS não são softwares; são ecossistemas de soberania digital construídos para dominar mercados.",
    tag: "03",
  },
  {
    icon: Zap,
    title: "IA que Gera Margem",
    description: "Esqueça o hype. Nossa IA é focada em otimização de custos e novas receitas. Se usamos IA para diagnósticos médicos de alta precisão, imagine o que faremos com seus dados.",
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
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body">Onde a complexidade se curva</p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            O mercado entrega o que
            <br />
            você pede. A Spectra entrega
            <br />
            <span className="text-gradient">o que o seu lucro exige.</span>
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
