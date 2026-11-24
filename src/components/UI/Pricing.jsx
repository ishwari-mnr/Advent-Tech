import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Mail, Copy, X, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import LandingTierCard from "../Landing/LandingTierCard";
import { RevealLines, Reveal } from "../Landing/Primitives";
import { listTiers, listPlanTypes, leadPlanTypeKey, PRICING } from "../../config/pricing/creditMath";

/**
 * Public pricing section on the home page.
 *
 * Every number here comes from src/config/pricing/pricing.data.json — there
 * are no hard-coded prices in this file. It previously advertised
 * "10 Web Testing / month" flat plans, which bore no relation to what a run
 * actually costs: a Contact form and an Inventory dashboard differ by more
 * than 20x in AI spend. Credits price the actual work.
 */

const PricingCTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planType, setPlanType] = useState(leadPlanTypeKey());

  const planTypes = listPlanTypes();
  const tiers = listTiers(planType);
  const activePlan = PRICING.planTypes[planType];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("sales@adventglobal.com");
    toast.success("Email copied to clipboard!");
  };

  return (
    <section className="relative bg-[#0c1e5b] py-20 md:py-28 px-4 sm:px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 lp-dot-grid-dark lp-drift opacity-70" />
      <div className="absolute left-1/2 -translate-x-1/2 -top-40 w-[900px] h-[500px] rounded-full bg-[radial-gradient(ellipse,rgba(249,115,22,0.35),transparent_65%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07123f] to-transparent" />

      <div className="relative max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <RevealLines
            className="lp-display font-bold text-[clamp(1.6rem,3.8vw,3.5rem)] text-white mb-6"
            lines={[
              <>Pay for <span className="text-orange-500">Work Done</span>,</>,
              "Not Pages Visited",
            ]}
          />
          <Reveal delay={0.2}>
            <p className="text-white/65 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
              One credit tests one page with up to two test scenarios. Heavy pages cost
              more, simple pages cost less, and you always see the price before we run
              anything.
            </p>
          </Reveal>
        </div>

        {/* Plan type toggle — BYOK leads */}
        <Reveal delay={0.3} className="flex justify-center mb-5">
          <div className="inline-flex flex-wrap justify-center bg-white/5 border border-white/10 p-1.5 rounded-full backdrop-blur">
            {planTypes.map((pt) => {
              const active = planType === pt.key;
              return (
                <button
                  key={pt.key}
                  onClick={() => setPlanType(pt.key)}
                  className={`relative px-5 md:px-6 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 flex items-center gap-2 ${
                    active ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="lp-plan-pill"
                      className="absolute inset-0 rounded-full bg-orange-500 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.9)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{pt.label}</span>
                  {pt.lead && (
                    <span
                      className={`relative lp-mono text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        active ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      Best value
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {activePlan?.blurb && (
            <motion.p
              key={planType + "-blurb"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-center text-sm text-white/55 max-w-2xl mx-auto mb-14"
            >
              {activePlan.blurb}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Tier grid */}
        <div key={planType} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {tiers.map((tier, i) => (
            <LandingTierCard key={tier.key} tier={tier} currency="USD" index={i} />
          ))}
        </div>

        {/* Demo CTA */}
        <div className="mt-14 flex flex-col items-center gap-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="lp-btn lp-btn-orange text-white shadow-[0_18px_40px_-16px_rgba(249,115,22,0.9)]"
          >
            <Mail size={16} />
            Book a Live Demo
          </button>

          <div className="flex items-start gap-2 text-xs text-white/45 max-w-2xl text-center">
            <Info size={14} className="shrink-0 mt-0.5" />
            <p>
              A credit covers one page and up to two scenarios (about 162 AI model
              calls). A page that generates more scenarios costs proportionally more —
              you approve the exact number before any of it runs. Any page producing
              more than {PRICING.formula.MAX_STORIES_PER_URL} scenarios always pauses
              for your confirmation first.
            </p>
          </div>
        </div>
      </div>

      {/* Contact modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#07123f]/70 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="bg-[#f8f4ed] rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden relative"
            >
              <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-[#0c1e5b]" />
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-[#0c1e5b]/50 hover:text-[#0c1e5b] transition-colors bg-[#0c1e5b]/5 hover:bg-[#0c1e5b]/10 rounded-full p-1.5"
              >
                <X size={18} />
              </button>

              <div className="p-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#0c1e5b] flex items-center justify-center text-orange-400 mb-5">
                    <Rocket size={30} />
                  </div>
                  <h3 className="lp-heading text-2xl font-semibold text-[#0c1e5b] mb-2">Book Your Demo</h3>
                  <p className="text-[#0c1e5b]/65 text-sm leading-relaxed">
                    To schedule your personalized platform walkthrough, please reach out
                    to our sales team directly at the email address below. We typically
                    respond within a few hours to arrange a time that works best for you.
                  </p>
                </div>

                <div className="bg-white border border-[#0c1e5b]/10 rounded-2xl p-2 flex items-center justify-between mt-2">
                  <div className="pl-4 pr-2 py-2 overflow-hidden">
                    <span className="text-[#0c1e5b] font-medium text-sm md:text-base truncate block">
                      sales@adventglobal.com
                    </span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-[#0c1e5b] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PricingCTA;
