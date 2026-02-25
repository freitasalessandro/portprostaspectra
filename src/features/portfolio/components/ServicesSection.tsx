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
    <section className="py-32 px-6 relative noise-overlay" id="servicos">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/3 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-primary tracking-[0.3em] uppercase text-sm mb-4 font-body flex items-center gap-3">
            <span className="w-8 h-px bg-primary" />
            Onde a complexidade se curva
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight">
            O mercado entrega o que
            <br />
            você pede. A Spectra entrega
            <br />
            <span className="text-gradient-intense">o que o seu lucro exige.</span>
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
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="group glass-card-premium p-8 md:p-10 hover:border-primary/40 transition-all duration-500 cursor-default relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/0 group-hover:bg-primary/10 blur-3xl transition-all duration-700 pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/0 group-hover:via-primary/40 to-transparent transition-all duration-700" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500">
                    <service.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-muted-foreground/20 font-display text-6xl font-extrabold group-hover:text-primary/15 transition-colors duration-500">
                    {service.tag}
                  </span>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-body">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
