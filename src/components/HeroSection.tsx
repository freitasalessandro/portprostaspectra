import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import spectraLogo from "@/assets/spectra-logo.svg";
import heroBg from "@/assets/hero-bg.jpg";

const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 8 + 8,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });
  const bgX = useTransform(springX, [-500, 500], [10, -10]);
  const bgY = useTransform(springY, [-500, 500], [10, -10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[100svh] flex flex-col justify-center md:justify-end overflow-hidden pt-20 pb-8 md:pb-20"
    >
      {/* Parallax background */}
      <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }}>
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-20 scale-[1.15]" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/70" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-scan" />
      </div>

      {/* Diagonal cut accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none hidden lg:block">
        <div className="absolute inset-0 bg-primary/[0.03] [clip-path:polygon(30%_0,100%_0,100%_100%,0%_100%)]" />
        <div className="absolute inset-0 border-l border-primary/10 [clip-path:polygon(30%_0,30.1%_0,0.1%_100%,0%_100%)]" />
      </div>

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full bg-primary/5 blur-[120px] animate-breathe pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-primary/8 blur-[100px] animate-breathe pointer-events-none" style={{ animationDelay: "2s" }} />

      {/* Floating logo watermark */}
      <motion.img
        src={spectraLogo}
        alt=""
        className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[280px] md:w-[420px] opacity-[0.08] pointer-events-none hidden lg:block animate-float"
        style={{ filter: "drop-shadow(0 0 40px hsl(220 100% 55% / 0.15))" }}
      />

      <FloatingParticles />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-12">
        {/* Top label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 md:mb-12"
        >
          <div className="flex items-center gap-3">
            <motion.span
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="font-body text-[10px] md:text-sm text-primary tracking-[0.3em] md:tracking-[0.4em] uppercase font-semibold">
              Spectra — CTO as a Service
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="font-display leading-[0.85] tracking-[-0.04em] mb-8 md:mb-14"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="block text-[clamp(2.5rem,9vw,9rem)] font-extralight text-foreground/80"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Sua operação
          </motion.span>
          <motion.span
            className="block text-[clamp(2.5rem,9vw,9rem)] font-black text-gradient-intense"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            merece mais.
          </motion.span>
        </motion.h1>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8 pt-6 md:pt-8 border-t border-border/20"
        >
          <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-lg">
            Transformamos complexidade operacional em ativos digitais de alta performance.
            Engenharia, IA, design e tráfego — sob um único teto estratégico.
          </p>

          <div className="flex gap-3 shrink-0">
            <motion.a
              href="https://wa.me/5582933008540?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20diagn%C3%B3stico%20estrat%C3%A9gico."
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 md:px-7 py-3 md:py-3.5 font-display font-bold text-primary-foreground bg-primary text-xs tracking-widest uppercase relative overflow-hidden group glow-box-intense"
            >
              <span className="relative z-10">Diagnóstico</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </motion.a>
            <motion.a
              href="#arsenal"
              whileHover={{ scale: 1.03, y: -2, borderColor: "hsl(220 100% 55% / 0.5)" }}
              className="px-6 md:px-7 py-3 md:py-3.5 font-display font-bold text-foreground/70 border border-border/40 text-xs tracking-widest uppercase transition-all duration-300 hover:text-foreground"
            >
              Explorar
            </motion.a>
          </div>
        </motion.div>

        {/* Stats row with animated counters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="grid grid-cols-3 gap-6 md:gap-8 mt-10 md:mt-20 max-w-xl"
        >
          {[
            { value: "0", label: "Risco" },
            { value: "100%", label: "Diagnóstico revertido" },
            { value: "CTO", label: "As a Service" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="group cursor-default"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <span className="font-display text-xl md:text-3xl font-black text-foreground group-hover:text-primary transition-colors duration-300">
                {stat.value}
              </span>
              <p className="font-body text-[10px] md:text-sm text-muted-foreground/60 tracking-wider uppercase mt-1">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
