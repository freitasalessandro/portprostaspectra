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
    <div className="py-6 border-y border-border/15 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex marquee-track whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-display text-[11px] tracking-[0.35em] text-muted-foreground/20 uppercase mx-8 flex items-center gap-8"
          >
            {item}
            <span className="w-1 h-1 rounded-full bg-primary/20" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBar;
