import { motion, AnimatePresence } from "framer-motion";
import type { CaseItem } from "../CasesSection";

type Props = {
  item: CaseItem;
  index: number;
  indexKey?: string;
  activeScreenshot: Record<string, number>;
  setActiveScreenshot: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

const CaseCard = ({ item, index, indexKey, activeScreenshot, setActiveScreenshot }: Props) => {
  const key = indexKey ?? String(index);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ x: 6, transition: { duration: 0.3 } }}
      className="group flex flex-col border border-border/20 hover:border-primary/30 transition-all duration-500 bg-background relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-primary transition-all duration-500" />

      <div className="flex items-stretch">
        {/* Big metric */}
        <div className="hidden md:flex w-40 shrink-0 items-center justify-center border-r border-border/15 bg-card/20 group-hover:bg-primary/5 transition-all duration-500">
          <div className="text-center">
            {item.comingSoon ? (
              <>
                <span className="text-3xl block leading-none">{item.metric}</span>
                <span className="font-body text-[9px] text-primary uppercase tracking-widest mt-2 block font-semibold">
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
                <span className="font-body text-[9px] text-muted-foreground/50 uppercase tracking-widest mt-1 block">
                  {item.metricLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 md:w-56 shrink-0">
            <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.3 }}>
              <item.icon className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors duration-300" strokeWidth={1.5} />
            </motion.div>
            <div>
              <span className="text-[9px] text-primary/70 tracking-[0.25em] uppercase font-body font-semibold block">
                {item.category}
              </span>
              <h3 className="font-display text-base md:text-lg font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
                {item.title}
              </h3>
              {item.comingSoon && (
                <span className="text-[8px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-widest font-body font-semibold inline-block mt-1 w-fit">
                  Em desenvolvimento
                </span>
              )}
            </div>
          </div>

          <p className="text-muted-foreground/60 font-body text-xs leading-relaxed flex-1">
            {item.description}
          </p>

          {/* Mobile metric */}
          <div className="md:hidden flex items-center gap-2">
            {item.comingSoon ? (
              <>
                <span className="text-lg">{item.metric}</span>
                <span className="font-body text-[9px] text-primary uppercase tracking-wider font-semibold">{item.metricLabel}</span>
              </>
            ) : (
              <>
                <span className="font-display text-xl font-black text-gradient-intense">{item.metric}</span>
                <span className="font-body text-[9px] text-muted-foreground/50 uppercase tracking-wider">{item.metricLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots gallery */}
      {item.screenshots.length > 0 && (
        <div className="border-t border-border/15 p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-card/30 border border-border/20">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeScreenshot[key] ?? 0}
                  src={item.screenshots[activeScreenshot[key] ?? 0]}
                  alt={`${item.title} screenshot`}
                  className="w-full h-full object-cover object-top"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
            </div>

            {item.screenshots.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {item.screenshots.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveScreenshot(prev => ({ ...prev, [key]: idx }))}
                    className={`shrink-0 w-20 h-12 md:w-28 md:h-16 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                      (activeScreenshot[key] ?? 0) === idx
                        ? "border-primary shadow-[0_0_10px_hsl(220_100%_55%/0.3)]"
                        : "border-border/20 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CaseCard;
