import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { staggerContainer, fadeUp } from "@/lib/motion";

const stats = [
  { value: "0", suffix: "", prefix: "Risco ", label: "Desenvolvimento Cego" },
  { value: "100", suffix: "%", prefix: "", label: "Diagnóstico Revertido" },
  { value: "CTO", suffix: "", prefix: "", label: "As a Service", isText: true },
  { value: "360", suffix: "°", prefix: "", label: "Gestão Integrada" },
];

const AnimatedCounter = ({ value, suffix, prefix, isText }: { value: string; suffix: string; prefix: string; isText?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numValue = parseInt(value);

  useEffect(() => {
    if (!isInView || isText || isNaN(numValue)) return;
    let start = 0;
    const duration = 2000;
    const steps = 60;
    const increment = numValue / steps;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isInView, numValue, isText]);

  return (
    <div ref={ref} className="font-display text-5xl md:text-7xl font-extrabold text-gradient-intense mb-3">
      {isText ? value : `${prefix}${count}${suffix}`}
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full animate-breathe" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] rounded-full animate-breathe" style={{ animationDelay: "2s" }} />

      <div className="line-accent mb-24" />

      <motion.div
        className="max-w-7xl mx-auto relative z-10"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center group"
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                prefix={stat.prefix}
                isText={stat.isText}
              />
              <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase font-body group-hover:text-primary/70 transition-colors duration-300">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="line-accent mt-24" />
    </section>
  );
};

export default StatsSection;
