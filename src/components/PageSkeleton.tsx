import { motion } from "framer-motion";

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[0.04] before:to-transparent";

const PageSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="min-h-screen bg-background p-6 md:p-10"
  >
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className={`h-3 w-24 rounded-full bg-muted/40 ${shimmer}`} />
        <div className={`h-8 w-64 rounded-md bg-muted/30 ${shimmer}`} />
        <div className={`h-4 w-96 max-w-full rounded-md bg-muted/20 ${shimmer}`} />
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`h-40 rounded-lg bg-muted/15 border border-border/10 ${shimmer}`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className={`h-10 w-full rounded-md bg-muted/20 ${shimmer}`} />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-14 w-full rounded-md bg-muted/10 ${shimmer}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

export default PageSkeleton;
