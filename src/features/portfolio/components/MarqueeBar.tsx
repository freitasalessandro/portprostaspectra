import { motion } from "framer-motion";

const items = [
  "ENGENHARIA",
  "INTELIGÊNCIA",
  "AUTOMAÇÃO",
  "PERFORMANCE",
  "SOBERANIA",
  "CTO AS A SERVICE",
  "IA & ROI",
  "ESCALA",
  "DESIGN",
  "TRÁFEGO",
];

const MarqueeBar = () => {
  return (
    <div className="py-5 border-y border-border/10 overflow-hidden relative bg-card/20">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex marquee-track whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-display text-[10px] tracking-[0.4em] text-muted-foreground/20 uppercase mx-6 flex items-center gap-6"
          >
            {item}
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
            />
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBar;
