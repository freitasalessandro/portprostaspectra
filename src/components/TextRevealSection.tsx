import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const words = [
  { text: "Não", highlight: false },
  { text: "entregamos", highlight: false },
  { text: "software.", highlight: false },
  { text: "Entregamos", highlight: false },
  { text: "soberania", highlight: true },
  { text: "digital.", highlight: false },
  { text: "Entregamos", highlight: false },
  { text: "margem.", highlight: true },
  { text: "Entregamos", highlight: false },
  { text: "escala.", highlight: true },
  { text: "Entregamos", highlight: false },
  { text: "domínio.", highlight: true },
];

const TextRevealSection = () => {
  return (
    <section className="py-28 md:py-40 px-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <p className="flex flex-wrap gap-x-[0.4em] gap-y-3 font-display text-3xl md:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight justify-center text-center">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.1, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={`inline-block ${word.highlight ? "text-gradient-intense" : ""}`}
            >
              {word.text}
            </motion.span>
          ))}
        </p>
      </div>
    </section>
  );
};

export default TextRevealSection;
