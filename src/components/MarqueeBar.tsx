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
    <div className="py-6 border-y border-border/30 overflow-hidden">
      <div className="flex marquee-track whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="font-display text-sm tracking-[0.3em] text-muted-foreground/40 uppercase mx-8 flex items-center gap-8"
          >
            {item}
            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarqueeBar;
