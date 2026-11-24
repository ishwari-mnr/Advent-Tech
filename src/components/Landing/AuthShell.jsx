import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import logo from "../../assets/ADVENT_AT.png";
import "../../pages/landing.css";
import HeroSphere from "./HeroSphere";
import HelpWidget from "./HelpWidget";
import { Brackets, Sparkle, EASE } from "./Primitives";

const AuthShell = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="lp-root relative min-h-screen overflow-hidden lp-grain">
      <div className="absolute inset-0 lp-cross-grid" />
      <div className="absolute inset-0 lp-bloom" />

      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative z-20 max-w-[1400px] mx-auto px-4 md:px-8 pt-4"
      >
        <div className="lp-brackets text-[#0c1e5b]/40 flex items-center justify-between bg-[#f8f4ed]/60 backdrop-blur-md px-4 md:px-6 py-3">
          <Brackets />
          <button onClick={() => navigate("/")} className="flex items-center" aria-label="Advent AT">
            <img src={logo} alt="Advent AT" className="h-10 md:h-11 w-auto object-contain mix-blend-multiply" />
          </button>
          <button
            onClick={() => navigate("/")}
            aria-label="Home"
            className="w-11 h-11 flex items-center justify-center text-[#0c1e5b] border border-[#0c1e5b]/15 hover:bg-[#0c1e5b] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-14 grid lg:grid-cols-2 gap-10 items-center min-h-[calc(100vh-6rem)]">
        <div className="relative hidden lg:flex flex-col justify-center min-h-[560px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE }}
            className="absolute -top-10 bottom-28 -left-10 right-0 pointer-events-none"
          >
            <HeroSphere className="w-full h-full" />
          </motion.div>
          <div className="relative mt-auto pb-6">
            <div className="overflow-hidden">
              <motion.div
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, delay: 0.3, ease: EASE }}
                className="lp-display font-extrabold text-[clamp(2.6rem,4.6vw,4.6rem)] text-[#0c1e5b] flex items-center gap-[0.25em]"
              >
                Advent
                <Sparkle className="w-[0.55em] h-[0.55em] text-orange-500" />
                <span className="text-orange-500">AT</span>
              </motion.div>
            </div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.3, delay: 0.7, ease: EASE }}
              className="mt-5 h-[3px] w-[60%] origin-left bg-gradient-to-r from-orange-500 via-orange-400 to-transparent"
            />
          </div>
        </div>

        <div className="lg:hidden absolute left-1/2 -translate-x-1/2 top-0 w-[130vw] aspect-square opacity-40 pointer-events-none">
          <HeroSphere className="w-full h-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
          className="relative w-full max-w-md mx-auto lg:mr-0 lg:ml-auto"
        >
          <div className="relative rounded-[28px] bg-[#f8f4ed]/90 backdrop-blur-xl border border-[#0c1e5b]/10 shadow-[0_50px_100px_-50px_rgba(12,30,91,0.6)] overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-[#0c1e5b]" />
            <div className="relative p-7 md:p-10">{children}</div>
          </div>
        </motion.div>
      </main>

      <HelpWidget />
    </div>
  );
};

export const authLabel = "block lp-mono text-[11px] uppercase text-[#0c1e5b]/60 mb-2";
export const authInput = (error) =>
  `lp-input ${error ? "!border-red-300 !bg-red-50 focus:!shadow-[0_0_0_4px_rgba(248,113,113,0.2)]" : ""}`;
export const authSubmit =
  "lp-btn lp-btn-orange text-white w-full justify-center !py-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_18px_40px_-16px_rgba(249,115,22,0.9)]";

export const AuthBrand = ({ subtitle }) => (
  <div className="text-center mb-9">
    <div className="lp-display font-bold text-2xl mb-3 text-[#0c1e5b]">
      Advent <span className="text-orange-500 text-3xl">AT</span>
    </div>
    <p className="text-[#0c1e5b]/65">{subtitle}</p>
  </div>
);

export default AuthShell;
