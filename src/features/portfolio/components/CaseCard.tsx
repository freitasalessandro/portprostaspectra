import { motion, useScroll, useTransform } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useRef } from "react";
import type { CaseItem } from "./CasesSection";

type Props = {
  item: CaseItem;
  index: number;
  indexKey?: string;
  activeScreenshot: Record<string, number>;
  setActiveScreenshot: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

const CaseCard = ({ item, index, indexKey, activeScreenshot, setActiveScreenshot }: Props) => {
  const key = indexKey ?? String(index);
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const cardY = useTransform(scrollYProgress, [0, 0.15], [20, 0]);
  const cardOpacity = useTransform(scrollYProgress, [0, 0.08], [0.4, 1]);
  const screenshotScale = useTransform(scrollYProgress, [0.1, 0.3], [0.98, 1]);
  const screenshotY = useTransform(scrollYProgress, [0.1, 0.3], [10, 0]);

  return (
    <motion.div
      ref={cardRef}
      style={{ y: cardY, opacity: cardOpacity }}
      whileHover={{ x: 6, transition: { duration: 0.3 } }}
      className="group flex flex-col border border-border/30 hover:border-primary/30 transition-all duration-500 bg-card relative overflow-hidden shadow-sm"
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-primary transition-all duration-500" />

      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/5 blur-[80px] rounded-full" />
      </div>

      <div className="flex items-stretch">
        {/* Big metric */}
        <div className="hidden md:flex w-40 shrink-0 items-center justify-center border-r border-border/20 bg-muted/30 group-hover:bg-primary/5 transition-all duration-500">
          <div className="text-center">
            {item.comingSoon ? (
              <>
                <span className="text-3xl block leading-none">{item.metric}</span>
                <span className="font-body text-xs text-primary uppercase tracking-widest mt-2 block font-semibold">
                  {item.metricLabel}
                </span>
              </>
            ) : (
              <>
                <motion.span
                  className="font-display text-4xl font-black text-gradient-intense block leading-none"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.metric}
                </motion.span>
                <span className="font-body text-xs text-muted-foreground/50 uppercase tracking-widest mt-1 block">
                  {item.metricLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-7 flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
          <div className="flex items-center gap-3 md:w-56 shrink-0">
            <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.3 }}>
              <item.icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
            </motion.div>
            <div>
              <span className="text-xs text-primary/70 tracking-[0.25em] uppercase font-body font-semibold block">
                {item.category}
              </span>
              <h3 className="font-display text-base md:text-lg font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
                {item.title}
              </h3>
              {item.comingSoon && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-widest font-body font-semibold inline-block mt-1 w-fit">
                  Em desenvolvimento
                </span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground/60 font-body text-sm md:text-base leading-relaxed flex-1">
            {item.description}
          </p>

          {item.link && (
            <motion.a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 text-xs font-display font-bold uppercase tracking-widest text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-300 relative overflow-hidden group/btn glow-box-intense"
            >
              <span className="relative z-10 flex items-center gap-2">
                Ver projeto
                <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
            </motion.a>
          )}

          {/* Mobile metric */}
          <div className="md:hidden flex items-center gap-2">
            {item.comingSoon ? (
              <>
                <span className="text-lg">{item.metric}</span>
                <span className="font-body text-xs text-primary uppercase tracking-wider font-semibold">{item.metricLabel}</span>
              </>
            ) : (
              <>
                <span className="font-display text-xl font-black text-gradient-intense">{item.metric}</span>
                <span className="font-body text-xs text-muted-foreground/50 uppercase tracking-wider">{item.metricLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots gallery with parallax */}
      {item.screenshots.length > 0 && (
        <motion.div
          className="border-t border-border/15 p-3 md:p-6"
          style={{ scale: screenshotScale, y: screenshotY }}
        >
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted border border-border group/ss">
              {/* Removed dark overlay - screenshots should be crisp */}
              <motion.img
                key={activeScreenshot[key] ?? 0}
                src={item.screenshots[activeScreenshot[key] ?? 0]}
                alt={`${item.title} screenshot`}
                className="w-full h-full object-cover object-top"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              />
            </div>

            {item.screenshots.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {item.screenshots.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveScreenshot(prev => ({ ...prev, [key]: idx }))}
                    className={`shrink-0 w-20 h-12 md:w-28 md:h-16 overflow-hidden border-2 transition-all duration-300 ${
                      (activeScreenshot[key] ?? 0) === idx
                        ? "border-primary shadow-[0_0_10px_hsl(220_100%_55%/0.3)]"
                        : "border-border/20 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover object-top brightness-100" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CaseCard;
