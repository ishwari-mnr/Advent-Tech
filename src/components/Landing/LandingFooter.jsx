import React from "react";
import { motion } from "framer-motion";

// UI/Footer.jsx is shared with the admin layout, so the landing page has its own.
const LandingFooter = () => (
  <footer className="relative bg-[#07123f] text-white overflow-hidden">
    <div className="absolute inset-0 lp-dot-grid-dark lp-drift opacity-60" />
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-40%] w-[120%] h-[90%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.55),rgba(249,115,22,0.12)_45%,transparent_70%)]" />

    <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 pt-16">
      <motion.div
        initial={{ y: "40%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative select-none"
        aria-hidden="true"
      >
        <div className="lp-display lp-outline-text text-center leading-none text-[18vw] md:text-[15vw] font-extrabold">
          Advent AT
        </div>
        <div className="lp-display lp-fill-sweep absolute inset-0 text-center leading-none text-[18vw] md:text-[15vw] font-extrabold">
          Advent AT
        </div>
      </motion.div>

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 py-8 pb-24 md:pb-8 md:pr-24 mt-6 border-t border-white/10 text-sm text-white/60">
        <p className="lp-mono text-xs">© 2026 AT Tester. All rights reserved.</p>
        <p className="lp-mono text-xs">
          Developed by{" "}
          <a href="#home" className="text-white font-bold hover:text-orange-400 transition-colors">
            Advent Global
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
