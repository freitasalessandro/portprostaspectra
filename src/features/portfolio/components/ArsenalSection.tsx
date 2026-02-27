import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { Cpu, Shield, Target, Zap, Globe, Brain } from "lucide-react";
import { staggerContainer, fadeUp, fadeScale } from "@/lib/motion";
import { useRef, useCallback } from "react";

const services = [
  { icon: Target, title: "Diagnóstico Estratégico", description: "ROI antes de cada linha de código.", span: "col-span-1" },
  { icon: Cpu, title: "Arquitetura de Escala", description: "Sistemas que crescem sem quebrar.", span: "col-span-1" },
  { icon: Shield, title: "Soberania Digital", description: "Infraestrutura proprietária. Zero dependência.", span: "col-span-1 md:col-span-2" },
  { icon: Brain, title: "IA Aplicada ao Lucro", description: "Machine Learning que gera margem real.", span: "col-span-1 md:col-span-2" },
  { icon: Zap, title: "Automação Inteligente", description: "Processos que rodam sozinhos.", span: "col-span-1" },
  { icon: Globe, title: "Design + Tráfego Integrado", description: "Branding, sites e campanhas sob a mesma estratégia.", span: "col-span-1" },
];

const TiltCard = ({ service, index }: { service: typeof services[0]; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rotateX.set((y - 0.5) * -12);
    rotateY.set((x - 0.5) * 12);
    glareX.set(x * 100);
    glareY.set(y * 100);
  }, [rotateX, rotateY, glareX, glareY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      variants={fadeScale}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
      className={`group ${service.span} relative bg-card/30 border border-border/20 p-6 md:p-8 hover:border-primary/30 hover:bg-card/50 transition-colors duration-500 cursor-default overflow-hidden`}
    >
      {/* Glare overlay */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
        style={{
          background: useTransform(
            [glareX, glareY],
            ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, hsl(220 100% 55% / 0.08) 0%, transparent 60%)`
          ),
        }}
      />

      <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-[600ms]" />
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-primary/0 group-hover:bg-primary/10 blur-3xl transition-all duration-700 pointer-events-none" />

      <div className="flex items-center justify-between mb-4 md:mb-5 relative" style={{ transform: "translateZ(20px)" }}>
        <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ duration: 0.3 }}>
          <service.icon className="w-5 h-5 text-primary group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
        </motion.div>
        <span className="font-display text-xs text-muted-foreground/20 tracking-[0.2em] group-hover:text-primary/20 transition-colors duration-300">
          0{index + 1}
        </span>
      </div>

      <div style={{ transform: "translateZ(30px)" }}>
        <h3 className="font-display text-base md:text-xl font-bold mb-2 md:mb-3 group-hover:text-primary transition-colors duration-300 leading-tight">
          {service.title}
        </h3>
        <p className="text-muted-foreground font-body text-sm md:text-base leading-relaxed">
          {service.description}
        </p>
      </div>
    </motion.div>
  );
};

const ArsenalSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.15], [20, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.08], [0.4, 1]);
  const gridY = useTransform(scrollYProgress, [0.05, 0.2], [30, 0]);
  const orbScale = useTransform(scrollYProgress, [0, 0.5], [0.6, 1.2]);

  return (
    <section ref={sectionRef} className="py-10 md:py-36 px-4 sm:px-5 md:px-12 relative" id="arsenal">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <motion.div
        className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/4 blur-[200px] rounded-full pointer-events-none"
        style={{ scale: orbScale }}
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-primary/3 blur-[150px] rounded-full pointer-events-none"
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with scroll parallax */}
        <motion.div
          className="mb-12 md:mb-16"
          style={{ y: headerY, opacity: headerOpacity }}
        >
          <p className="text-primary tracking-[0.4em] uppercase text-xs md:text-sm mb-3 md:mb-4 font-body flex items-center gap-3">
            <motion.span
              className="w-8 md:w-10 h-px bg-primary/50"
              initial={{ width: 0 }}
              whileInView={{ width: 40 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            Arsenal
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-6xl font-black tracking-tight leading-[0.95]">
            Ferramentas<br />
            <span className="font-extralight text-foreground/80">de guerra.</span>
          </h2>
        </motion.div>

        {/* Bento Grid with 3D tilt cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          style={{ y: gridY }}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {services.map((service, i) => (
            <TiltCard key={service.title} service={service} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ArsenalSection;
