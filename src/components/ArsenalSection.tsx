import { motion } from "framer-motion";
import { Cpu, Shield, Target, Zap, Globe, Brain } from "lucide-react";

const services = [
  {
    icon: Target,
    title: "Diagnóstico Estratégico",
    description: "Cada linha justificada pelo ROI. Valor 100% revertido no setup.",
  },
  {
    icon: Cpu,
    title: "Arquitetura de Escala",
    description: "Sistemas que crescem sem quebrar. Do legado à cloud-native.",
  },
  {
    icon: Shield,
    title: "Soberania Digital",
    description: "Infraestrutura proprietária. Sem dependência externa.",
  },
  {
    icon: Brain,
    title: "IA Aplicada ao Lucro",
    description: "Machine Learning que gera margem real, não hype.",
  },
  {
    icon: Zap,
    title: "Automação Inteligente",
    description: "Processos que rodam sozinhos. Menos custo, mais escala.",
  },
  {
    icon: Globe,
    title: "Design + Tráfego",
    description: "Branding, sites e campanhas integrados à sua tecnologia.",
  },
];

const ArsenalSection = () => {
  return (
    <section className="py-32 px-6 md:px-12 relative" id="arsenal">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20"
        >
          <div className="md:col-span-7">
            <p className="text-primary tracking-[0.3em] uppercase text-xs mb-4 font-body flex items-center gap-3">
              <span className="w-12 h-px bg-primary" />
              Arsenal Spectra
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1]">
              Ferramentas de{" "}
              <span className="text-gradient-intense">guerra.</span>
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9 flex items-end">
            <p className="font-body text-muted-foreground text-sm leading-relaxed">
              Cada competência projetada para converter complexidade em vantagem competitiva irreversível.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/20 border border-border/20 overflow-hidden">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-background p-8 md:p-10 hover:bg-card/40 transition-all duration-500 cursor-default relative"
            >
              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-500" />

              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center group-hover:bg-primary/15 group-hover:border-primary/30 transition-all duration-300">
                  <service.icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <span className="font-display text-xs text-muted-foreground/30 tracking-[0.2em] uppercase">
                  0{i + 1}
                </span>
              </div>

              <h3 className="font-display text-lg md:text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArsenalSection;
