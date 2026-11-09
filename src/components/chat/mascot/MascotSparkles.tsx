import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Heart, Sparkles as SparkleIcon } from "lucide-react";
import { SparkleParticle } from "./useMascotPlayEngine";

interface MascotSparklesProps {
  sparkles: SparkleParticle[];
}

export const MascotSparkles: React.FC<MascotSparklesProps> = ({ sparkles }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      <AnimatePresence>
        {sparkles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 0,
              scale: 0.2,
              x: p.x,
              y: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1.2, 0.9, 0],
              x: p.x + (Math.random() - 0.5) * 20,
              y: p.y - 20,
              rotate: [0, (Math.random() - 0.5) * 60],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 1.1,
              ease: "easeOut",
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
            style={{ color: p.color }}
          >
            {p.type === "star" && (
              <Star
                className="w-3.5 h-3.5 fill-current drop-shadow-[0_0_6px_currentColor]"
              />
            )}
            {p.type === "heart" && (
              <Heart
                className="w-3.5 h-3.5 fill-current drop-shadow-[0_0_6px_currentColor]"
              />
            )}
            {p.type === "sparkle" && (
              <SparkleIcon
                className="w-3.5 h-3.5 fill-current drop-shadow-[0_0_6px_currentColor]"
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
