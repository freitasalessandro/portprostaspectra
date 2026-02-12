import { motion } from "framer-motion";

const items = [
  "ENGENHARIA",
  "INTELIGÊNCIA",
  "AUTOMAÇÃO",
  "PERFORMANCE",
  "SOBERANIA DIGITAL",
  "CTO AS A SERVICE",
  "IA & ROI",
  "ESCALA",
];

const MarqueeBar = () => {
  return (
    <div className="py-8 border-y border-border/20 overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex marquee-track whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-display text-sm tracking-[0.3em] text-muted-foreground/30 uppercase mx-8 flex items-center gap-8 hover:text-primary/60 transition-colors duration-500"
          >
            {item}
            <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBar;
