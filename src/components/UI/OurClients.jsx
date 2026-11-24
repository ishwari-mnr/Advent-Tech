"use client";
import { motion } from "framer-motion";
import clientLogo from "../../assets/advanto.png";
import { Reveal, RevealLines, Brackets } from "../Landing/Primitives";

export default function OurClients() {
  return (
    <main id="our clients" className="relative bg-[#f1ebe1] overflow-hidden">
      <div className="absolute inset-0 lp-cross-grid opacity-70" />

      {/* HERO SECTION */}
      <section className="relative pt-24 md:pt-28 pb-14 text-center px-6">
        <RevealLines
          className="lp-display font-bold text-[clamp(1.8rem,4.1vw,3.9rem)] text-[#0c1e5b] mb-6"
          lines={[<>Our <span className="text-orange-500">Clients</span></>]}
        />
        <Reveal delay={0.15}>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-[#0c1e5b]/65 leading-relaxed">
            We are proud to partner with industry-leading organizations that trust
            Advent AT to deliver technology excellence and innovative solutions.
          </p>
        </Reveal>
      </section>

      {/* CLIENTS GRID SECTION */}
      <section className="relative pb-24 md:pb-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative flex justify-center items-center mt-4 py-10">
            <svg className="absolute w-[560px] max-w-[140%] h-[300px] text-[#0c1e5b]" viewBox="0 0 560 300" aria-hidden="true">
              <ellipse cx="280" cy="150" rx="270" ry="140" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" strokeDasharray="0.1 7" strokeLinecap="round" />
              <ellipse cx="280" cy="150" rx="215" ry="112" fill="none" stroke="#f97316" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="0.1 6" strokeLinecap="round" />
              <circle r="5" fill="#f97316">
                <animateMotion dur="9s" repeatCount="indefinite" path="M10 150 a270 140 0 1 0 540 0 a270 140 0 1 0 -540 0" />
              </circle>
              <circle r="4" fill="#0c1e5b">
                <animateMotion dur="6s" repeatCount="indefinite" path="M495 150 a215 112 0 1 0 -430 0 a215 112 0 1 0 430 0" />
              </circle>
            </svg>

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              whileHover={{ y: -6 }}
              className="lp-brackets group relative flex items-center justify-center w-[320px] h-[160px] bg-[#0c1e5b] rounded-[28px] p-10 shadow-[0_40px_80px_-30px_rgba(12,30,91,0.7)] cursor-pointer overflow-hidden text-orange-400"
            >
              <span className="absolute inset-0 lp-dot-grid-dark opacity-60" />
              <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent lp-sheen" />
              <span className="absolute inset-3 lp-brackets text-orange-400/70 pointer-events-none">
                <Brackets />
              </span>
              <img
                src={clientLogo}
                alt="Advent Global Solutions Inc."
                className="relative max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
