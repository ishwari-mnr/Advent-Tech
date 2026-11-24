import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, Crown, Rocket, PhoneCall, Server } from "lucide-react";
import { usdToInr, semiAnnualUsd } from "../../config/pricing/creditMath";

// UI/PricingTierCard.jsx is shared with the in-app upgrade page, so the landing page has its own.
const TIER_ICONS = {
  starter: <Zap size={20} />,
  growth: <Crown size={20} />,
  scale: <Rocket size={20} />,
  self_hosted: <Server size={20} />,
  managed_starter: <Zap size={20} />,
  managed_growth: <Crown size={20} />,
  managed_pro: <Rocket size={20} />,
  enterprise: <PhoneCall size={20} />,
};

const LandingTierCard = ({ tier, currency = "USD", billing = "monthly", index = 0 }) => {
  const isCustom = !!tier.custom;
  const unavailable = tier.available === false;
  const hot = tier.highlighted && !unavailable;

  const symbol = currency === "INR" ? "₹" : "$";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const monthlyUsd = tier.priceUsdMonthly;
  const semiUsd = semiAnnualUsd(monthlyUsd);

  const fmt = (usd) => {
    if (usd === null || usd === undefined) return "Custom";
    const v = currency === "INR" ? usdToInr(usd) : usd;
    return `${symbol}${v.toLocaleString(locale)}`;
  };

  const showSemi = billing === "semiAnnual" && !isCustom;
  const headlinePrice = isCustom ? "Custom" : showSemi ? fmt(semiUsd) : fmt(monthlyUsd);
  const headlineSuffix = isCustom ? "" : showSemi ? "/ 6 mo" : "/ month";
  const creditLine = isCustom
    ? "Custom credit allowance"
    : `${tier.credits.toLocaleString(locale)} credits / month`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -8 }}
      className={[
        "group relative rounded-[28px] p-7 flex flex-col overflow-hidden border transition-colors duration-500",
        hot
          ? "bg-gradient-to-b from-orange-500 to-orange-600 border-orange-400 text-white shadow-[0_30px_80px_-30px_rgba(249,115,22,0.8)]"
          : "bg-white/[0.04] border-white/10 text-white hover:border-orange-500/60 hover:bg-white/[0.07]",
        unavailable ? "opacity-60" : "",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 lp-sheen" />
      {hot && <span className="pointer-events-none absolute inset-0 lp-dot-grid-light opacity-40" />}

      <div className="relative flex items-start justify-between mb-8">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
            hot ? "bg-white text-orange-600" : "bg-white/10 text-orange-400 group-hover:bg-orange-500 group-hover:text-white"
          }`}
        >
          {TIER_ICONS[tier.key] || <Zap size={20} />}
        </div>
        {tier.highlighted && !unavailable && (
          <span className="lp-mono text-[10px] uppercase px-3 py-1.5 rounded-full bg-[#0c1e5b] text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 lp-pulse-dot" />
            Most Popular
          </span>
        )}
      </div>

      <h3 className="relative lp-heading text-2xl font-semibold leading-none mb-1.5">{tier.name}</h3>
      {tier.engineLabel && (
        <div className={`relative lp-mono text-[11px] ${hot ? "text-orange-100" : "text-orange-400"}`}>
          {tier.engineLabel}
        </div>
      )}

      <div className={`relative my-6 pt-6 border-t ${hot ? "border-white/25" : "border-white/10"}`}>
        <p className={`lp-mono text-[10px] uppercase mb-2 ${hot ? "text-orange-100" : "text-white/45"}`}>
          {isCustom ? "Pricing" : showSemi ? "6-Month Billing" : "Monthly Billing"}
        </p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="lp-heading text-4xl font-bold tracking-tight">{headlinePrice}</span>
          {headlineSuffix && (
            <span className={`text-sm ${hot ? "text-orange-100" : "text-white/50"}`}>{headlineSuffix}</span>
          )}
        </div>
        {!isCustom && (
          <p className={`text-xs font-bold mt-2 ${hot ? "text-white" : "text-orange-400"}`}>{creditLine}</p>
        )}
        {currency === "INR" && !isCustom && (
          <p className="text-[10px] mt-1 text-white/50">Indicative — billed in USD</p>
        )}
      </div>

      <ul className="relative space-y-3 flex-1">
        {tier.features.map((feature, i) => (
          <li key={i} className={`flex items-start gap-3 text-sm leading-snug ${hot ? "text-white" : "text-white/75"}`}>
            <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${hot ? "text-white" : "text-orange-500"}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {unavailable && (
        <p className="relative text-[11px] font-semibold mt-5 text-amber-300">
          Coming soon — contact sales for early access.
        </p>
      )}
    </motion.div>
  );
};

export default LandingTierCard;
