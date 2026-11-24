import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export const EASE = [0.2, 0.8, 0.2, 1];

export const Reveal = ({ children, delay = 0, y = 40, className = "", as = "div" }) => {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Comp>
  );
};

// Observe the heading, not the lines: a line hidden by its mask never intersects.
const lineVariants = {
  hidden: { y: "110%" },
  show: (c) => ({ y: "0%", transition: { duration: 1, delay: c, ease: EASE } }),
};

export const RevealLines = ({ lines, className = "", lineClassName = "", fade = true, as = "h2", delay = 0 }) => {
  const Tag = motion[as] || motion.h2;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={`block ${lineClassName}`}
            style={fade ? { opacity: 1 - i * 0.18 } : undefined}
            variants={lineVariants}
            custom={delay + i * 0.12}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};

export const Brackets = () => (
  <>
    <span className="lp-bk tl" />
    <span className="lp-bk tr" />
    <span className="lp-bk bl" />
    <span className="lp-bk br" />
  </>
);

export const PlusCorners = ({ inset = 18, className = "" }) => (
  <>
    <span className={`lp-plus ${className}`} style={{ top: inset - 9, left: inset - 9 }} />
    <span className={`lp-plus ${className}`} style={{ top: inset - 9, right: inset - 9 }} />
    <span className={`lp-plus ${className}`} style={{ bottom: inset - 9, left: inset - 9 }} />
    <span className={`lp-plus ${className}`} style={{ bottom: inset - 9, right: inset - 9 }} />
  </>
);

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] origin-left bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 z-[60]"
    />
  );
};

export const Sparkle = ({ className = "" }) => (
  <svg viewBox="0 0 40 40" className={`lp-spin-slow ${className}`} aria-hidden="true">
    <path
      d="M20 0 C21.5 13 27 18.5 40 20 C27 21.5 21.5 27 20 40 C18.5 27 13 21.5 0 20 C13 18.5 18.5 13 20 0Z"
      fill="currentColor"
    />
  </svg>
);
