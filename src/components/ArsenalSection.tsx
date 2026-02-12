import { motion } from "framer-motion";
import { Cpu, Shield, Target, Zap, Globe, Brain } from "lucide-react";

const services = [
  { icon: Target, title: "Diagnóstico Estratégico", description: "ROI antes de cada linha de código.", span: "col-span-1" },
  { icon: Cpu, title: "Arquitetura de Escala", description: "Sistemas que crescem sem quebrar.", span: "col-span-1" },
  { icon: Shield, title: "Soberania Digital", description: "Infraestrutura proprietária. Zero dependência.", span: "col-span-1 md:col-span-2" },
  { icon: Brain, title: "IA Aplicada ao Lucro", description: "Machine Learning que gera margem real.", span: "col-span-1 md:col-span-2" },
  { icon: Zap, title: "Automação Inteligente", description: "Processos que rodam sozinhos.", span: "col-span-1" },
  { icon: Globe, title: "Design + Tráfego Integrado", description: "Branding, sites e campanhas sob a mesma estratégia.", span: "col-span-1" },
];

const ArsenalSection = () => {
  return (
    <section className="py-28 md:py-36 px-6 md:px-12 relative" id="arsenal">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/4 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-primary tracking-[0.4em] uppercase text-[10px] md:text-xs mb-4 font-body flex items-center gap-3">
            <span className="w-10 h-px bg-primary/50" />
            Arsenal
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
            Ferramentas<br />
            <span className="font-extralight text-foreground/60">de guerra.</span>
          </h2>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`group ${service.span} relative bg-card/30 border border-border/20 p-7 md:p-8 hover:border-primary/30 hover:bg-card/50 transition-all duration-500 cursor-default overflow-hidden`}
            >
              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-600" />

              <div className="flex items-center justify-between mb-5">
                <service.icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
                <span className="font-display text-[10px] text-muted-foreground/20 tracking-[0.2em]">
                  0{i + 1}
                </span>
              </div>

              <h3 className="font-display text-base md:text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300 leading-tight">
                {service.title}
              </h3>
              <p className="text-muted-foreground/70 font-body text-xs leading-relaxed">
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
