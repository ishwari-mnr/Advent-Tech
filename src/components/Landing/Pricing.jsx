import { useCallback, useState } from "react";
import { Check, Copy, Mail, Rocket, X } from "lucide-react";
import toast from "react-hot-toast";
import { SITE } from "../../config/site";
import useEscape from "./useEscape";

const PLANS = {
  byok: {
    blurb:
      "You plug in your own OpenAI or Anthropic key and your provider bills you directly. Credits are a fair-use meter on our capacity.",
    tiers: [
      {
        name: "Starter",
        price: "$375",
        features: [
          "250 credits / month",
          "1 site tested at a time",
          "Use your own OpenAI or Anthropic key",
          "$1.00 per extra credit",
          "Email support",
        ],
      },
      {
        name: "Growth",
        price: "$1,000",
        popular: true,
        features: [
          "1,000 credits / month",
          "2 sites tested at a time",
          "Use your own OpenAI or Anthropic key",
          "$0.75 per extra credit",
          "CI/CD pipeline integrations",
          "Priority email support",
        ],
      },
      {
        name: "Scale",
        price: "$2,500",
        features: [
          "3,500 credits / month",
          "3 sites tested at a time",
          "Use your own OpenAI or Anthropic key",
          "$0.50 per extra credit",
          "CI/CD pipeline integrations",
          "Dedicated account manager",
        ],
      },
      {
        name: "Self-Hosted",
        price: null,
        features: [
          "On-premise deployment",
          "Unlimited concurrency on your hardware",
          "Custom tool integrations",
          "Dedicated infrastructure",
          "Dedicated account manager",
        ],
      },
    ],
  },
  managed: {
    blurb: "We supply the AI keys and carry the token cost. No provider accounts to manage.",
    tiers: [
      {
        name: "Managed Starter",
        price: "$565",
        features: [
          "250 credits / month",
          "1 site tested at a time",
          "AI keys included — nothing to configure",
          "$2.15 per extra credit",
          "Email support",
        ],
      },
      {
        name: "Managed Growth",
        price: "$1,900",
        popular: true,
        features: [
          "1,000 credits / month",
          "2 sites tested at a time",
          "AI keys included — nothing to configure",
          "$1.80 per extra credit",
          "CI/CD pipeline integrations",
          "Priority email support",
        ],
      },
      {
        name: "Managed Scale",
        price: "$4,125",
        features: [
          "2,500 credits / month on the premium engine",
          "3 sites tested at a time",
          "Highest reliability on complex applications",
          "$1.60 per extra credit",
          "CI/CD pipeline integrations",
          "Dedicated account manager",
        ],
      },
      {
        name: "Enterprise",
        price: null,
        features: [
          "Custom credit allowance",
          "Custom concurrency",
          "Model routing tuned to your workload",
          "SSO, audit logs and custom SLAs",
          "Dedicated account manager",
        ],
      },
    ],
  },
};

function DemoModal({ onClose }) {
  useEscape(true, onClose);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.salesEmail);
      toast.success("Email copied to clipboard!");
    } catch {
      toast.error("Could not copy the email");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 text-gray-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
          <Rocket size={24} />
        </div>
        <h3 id="demo-modal-title" className="text-xl font-bold text-navy">
          Book Your Demo
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          To schedule your personalized platform walkthrough, please reach out to our sales team
          directly at the email address below. We typically respond within a few hours to arrange a
          time that works best for you.
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <a href={`mailto:${SITE.salesEmail}`} className="truncate text-sm font-medium text-navy">
            {SITE.salesEmail}
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex flex-none items-center gap-1 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90"
          >
            <Copy size={14} />
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pricing() {
  const [planType, setPlanType] = useState("byok");
  const [demoOpen, setDemoOpen] = useState(false);
  const closeDemo = useCallback(() => setDemoOpen(false), []);
  const plan = PLANS[planType];

  const toggleClass = (active) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-white text-navy" : "text-white/80 hover:text-white"
    }`;

  return (
    <section id="pricing" className="scroll-mt-24 bg-navy py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Pay for <span className="text-orange-500">Work Done</span>, Not Pages Visited
          </h2>
          <p className="mt-4 text-white/80">
            One credit tests one page with up to two test scenarios. Heavy pages cost more, simple
            pages cost less, and you always see the price before we run anything.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-white/10 p-1">
            <button
              type="button"
              aria-pressed={planType === "byok"}
              onClick={() => setPlanType("byok")}
              className={toggleClass(planType === "byok")}
            >
              Bring Your Own Key
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Best value
              </span>
            </button>
            <button
              type="button"
              aria-pressed={planType === "managed"}
              onClick={() => setPlanType("managed")}
              className={toggleClass(planType === "managed")}
            >
              Managed AI
            </button>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-sm text-white/80">{plan.blurb}</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plan.tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl bg-white p-6 text-gray-800 ${
                tier.popular ? "ring-4 ring-orange-500" : ""
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-navy">{tier.name}</h3>
              <p className="mt-2">
                {tier.price ? (
                  <>
                    <span className="text-3xl font-bold text-navy">{tier.price}</span>
                    <span className="text-sm text-gray-500"> / month</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-navy">Custom</span>
                )}
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check size={16} className="mt-0.5 flex-none text-orange-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            <Mail size={18} />
            Book a Live Demo
          </button>
        </div>
      </div>

      {demoOpen && <DemoModal onClose={closeDemo} />}
    </section>
  );
}
