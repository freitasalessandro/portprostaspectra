import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const words = [
  "Não", "entregamos", "software.",
  "Entregamos", "soberania", "digital.",
  "Entregamos", "margem.", "Entregamos",
  "escala.", "Entregamos", "domínio.",
];

const TextRevealSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.2"],
  });

  return (
    <section ref={containerRef} className="py-40 md:py-56 px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <p className="flex flex-wrap gap-x-[0.35em] gap-y-2 font-display text-3xl md:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight justify-center text-center">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return (
              <Word key={i} range={[start, end]} progress={scrollYProgress}>
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </section>
  );
};

const Word = ({
  children,
  range,
  progress,
}: {
  children: string;
  range: [number, number];
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [8, 0]);

  const isHighlight = ["soberania", "margem.", "escala.", "domínio."].includes(children);

  return (
    <motion.span
      style={{ opacity, y }}
      className={`inline-block will-change-transform ${
        isHighlight ? "text-gradient-intense" : ""
      }`}
    >
      {children}
    </motion.span>
  );
};

export default TextRevealSection;
