import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import spectraLogo from "@/assets/spectra-logo.svg";

const ParticleField = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
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
            y: [0, -80, 0],
            opacity: [0, 0.8, 0],
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
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const logoRotateX = useTransform(springY, [-300, 300], [8, -8]);
  const logoRotateY = useTransform(springX, [-300, 300], [-8, 8]);

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
      className="relative min-h-screen flex items-center overflow-hidden noise-overlay"
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-60" />

      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/60" />
      </div>

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] animate-breathe" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/8 blur-[100px] animate-breathe" style={{ animationDelay: "2s" }} />

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-scan" />
      </div>

      <ParticleField />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32 flex items-center">
        {/* Left content */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-body text-primary tracking-[0.3em] uppercase text-sm mb-6 flex items-center gap-3"
            >
              <span className="w-8 h-px bg-primary" />
              Engenharia de Software & Inteligência de Negócios
            </motion.p>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight mb-8">
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block"
              >
                Spectra
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="block text-gradient-intense"
              >
                CTO as a
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="block"
              >
                Service.
              </motion.span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-muted-foreground text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
          >
            Transformamos complexidade operacional em ativos digitais de alta performance sob o modelo CTO as a Service.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.a
              href="#contato"
              whileHover={{ scale: 1.03, boxShadow: "0 0 30px hsl(220 100% 55% / 0.5), 0 0 80px hsl(220 100% 55% / 0.2)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 glow-box-intense tracking-wide uppercase text-sm relative overflow-hidden group"
            >
              <span className="relative z-10">Solicitar Diagnóstico</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </motion.a>
            <motion.a
              href="#arsenal"
              whileHover={{ scale: 1.03, borderColor: "hsl(220 100% 55% / 0.6)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center px-8 py-4 font-display font-bold text-foreground border border-border hover:border-primary/50 transition-all duration-300 tracking-wide uppercase text-sm backdrop-blur-sm"
            >
              Ver Arsenal
            </motion.a>
          </motion.div>
        </div>

        {/* Right - Large Logo with 3D effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-1 items-center justify-center relative"
          style={{
            perspective: 1000,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full bg-primary/5 blur-[120px] animate-breathe" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border border-primary/10 animate-[spin_20s_linear_infinite]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full border border-primary/5 animate-[counter-spin_25s_linear_infinite]" />
          </div>
          <motion.img
            src={spectraLogo}
            alt="Spectra"
            className="w-[420px] h-auto relative z-10 animate-float"
            style={{
              rotateX: logoRotateX,
              rotateY: logoRotateY,
              filter: "drop-shadow(0 0 60px hsl(220 100% 55% / 0.3)) drop-shadow(0 0 120px hsl(220 100% 55% / 0.15))",
            }}
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-12 right-6 z-10 hidden md:flex"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground text-xs tracking-[0.2em] uppercase origin-center">
            Scroll
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-primary/60 to-transparent animate-pulse-glow" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
