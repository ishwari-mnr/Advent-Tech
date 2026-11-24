import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Zap, Cpu, Layout, Globe, LineChart, Shield, Lock, AppWindow, ArrowUpRight, ArrowDown } from "lucide-react";
import {
  FileSearch,
  RefreshCw,
  Smartphone,
  Network,
  Database,
  ShieldCheck,
  Gauge,
  GitBranch,
  Boxes,
} from "lucide-react";

import HomeHeader from "../components/Layout/HomeHeader";
import ContactPage from "../components/UI/ContactPage";
import { useNavigate } from "react-router-dom";
import PricingCTA from "../components/UI/Pricing";
import OurClients from "../components/UI/OurClients";

import "./landing.css";
import useSmoothScroll from "../components/Landing/useSmoothScroll";
import HeroSphere from "../components/Landing/HeroSphere";
import ModuleVisual from "../components/Landing/ModuleVisuals";
import LandingFooter from "../components/Landing/LandingFooter";
import HelpWidget from "../components/Landing/HelpWidget";
import ProductConsole from "../components/Landing/ProductConsole";
import { Reveal, RevealLines, Brackets, PlusCorners, ScrollProgress, Sparkle, EASE } from "../components/Landing/Primitives";

const testingSuite = [
  {
    icon: <Globe />,
    title: "Web Testing",
    description:
      "An AI agent signs in to your web app, explores it and tests it while you watch.",
    points: [
      "Connect → Discover → Review → Validate: it writes tests, you confirm expected results",
      "Works on public sites or behind sign-in, with approver accounts for approval flows",
      "Standard crawl with test stories and Excel report, or prompt testing with your own steps",
      "Live browser stream, activity log and a Terminate button",
    ],
  },
  {
    icon: <FileSearch />,
    title: "Business Validation",
    description:
      "Test Case Designer for before the site is built. No website needed.",
    points: [
      "Upload a requirements document (PDF, DOCX, TXT or MD, up to 50 MB)",
      "Get back a full test case specification",
      "Reads diagrams and mockups inside the document",
    ],
  },
  {
    icon: <RefreshCw />,
    title: "Regression Testing",
    description:
      "Project-based regression testing that keeps every release in check.",
    points: [
      "Organise work into projects",
      "Connect your existing tools",
      "ML pipeline, insights and an AI chat assistant",
    ],
  },
  {
    icon: <Smartphone />,
    title: "Mobile App Testing",
    description: "Upload an Android APK and an autonomous AI agent tests it.",
    points: [
      "Optional login details and a max actions setting (50–500)",
      "Pipeline stages: Validation → Exploration → Testing",
      "Live device stream, live logs, and screen, passed and failed counts",
    ],
  },
  {
    icon: <Network />,
    title: "API Testing",
    description:
      "API Guardian tests your endpoints straight from your Swagger / OpenAPI docs.",
    points: [
      "Target URL, API base URL and optional OpenAPI link",
      "Login credentials, OTP and results delivered by email",
      "Safe mode (on by default) skips destructive calls",
    ],
  },
  {
    icon: <Database />,
    title: "DB Testing",
    description:
      "Full database assessments for PostgreSQL, MongoDB or both via a replica URL.",
    points: [
      "Choose Claude or GPT and pick the model",
      "Tests in SQL or JavaScript, as integration or unit tests",
      "Optional schema DDL and description to steer the AI",
    ],
  },
  {
    icon: <ShieldCheck />,
    title: "Security Testing (VAPT)",
    description:
      "Security assessment against the OWASP Top 10 plus API security.",
    points: [
      "Checks pages behind login using a test account",
      "Reads your OpenAPI docs to cover every endpoint",
      "Requires confirmation that you're authorized to test the site",
    ],
  },
  {
    icon: <Gauge />,
    title: "Performance Testing",
    description:
      "Describe a user flow in plain English. The engine plans it, finds the real endpoints and runs the load test.",
    points: [
      "Scenarios: browsing, login under load, signup, per-feature timing or mixed",
      "Set the number of virtual users",
      "Smoke and Load always run; add Stress, Spike and Soak",
    ],
  },
  {
    icon: <GitBranch />,
    title: "GitHub Code Testing",
    description:
      "AI reads your code's business logic, then tests whether the code does what it claims.",
    points: [
      "Connect a GitHub repo, or upload a folder or .zip (up to 500 MB)",
      "Python, JavaScript, TypeScript, Java and Kotlin",
      "Run history kept per repository",
    ],
  },
  {
    icon: <Boxes />,
    title: "AI SAP Testing",
    description:
      "An AI agent signs in to your SAP and tests it module by module (Finance, Sales, Purchasing, Inventory and more). No one writes test scripts.",
    points: [
      "Connect → Discover → Learn → Write tests → Run → Report",
      "Name a module and it reads SAP's own menu to find every transaction in it",
      "Learns how your SAP behaves, then writes tests only from what it saw",
      "Pass or Fail per test, with screenshots, the exact failing step and an Excel report of real defects",
      "Fits any company's SAP with no per-customer setup, and never changes real business data",
    ],
    wide: true,
  },
];

const capabilities = [
  {
    icon: <Cpu />,
    title: "Intelligent Discovery",
    description: "AI-driven requirement analysis, risk prioritization, and smart test coverage planning.",
  },
  {
    icon: <Layout />,
    title: "Experience Validation",
    description: "Autonomous UI, UX, accessibility, and visual regression testing across devices.",
  },
  {
    icon: <Globe />,
    title: "Cloud & DevOps Ready",
    description: "Seamless automation for cloud-native, microservices, and CI/CD pipelines.",
  },
  {
    icon: <LineChart />,
    title: "Performance Intelligence",
    description: "AI-powered load, stress, and scalability testing with predictive insights.",
  },
  {
    icon: <Shield />,
    title: "Self-Healing Automation",
    description: "Adaptive tests that evolve with application changes, reducing maintenance overhead.",
  },
  {
    icon: <Lock />,
    title: "Enterprise-Grade Security",
    description: "Secure, compliant, and scalable testing for mission-critical applications.",
  },
  {
    icon: <AppWindow />,
    title: "Power Apps Testing",
    description: "End-to-end Power Apps testing across screens, forms, field validation, and user workflows.",
    wide: true,
  },
];

const H2 = "lp-display font-bold text-[clamp(1.7rem,4.1vw,3.9rem)]";

const Home = () => {
  const navigate = useNavigate();
  useSmoothScroll();

  const heroRef = useRef(null);
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const sphereY = useTransform(heroP, [0, 1], [0, 220]);
  const sphereScale = useTransform(heroP, [0, 1], [1, 0.85]);
  const textY = useTransform(heroP, [0, 1], [0, -90]);
  const heroFade = useTransform(heroP, [0, 0.85], [1, 0]);

  const featRef = useRef(null);
  const { scrollYProgress: featP } = useScroll({ target: featRef, offset: ["start end", "end start"] });
  const imgY = useTransform(featP, [0, 1], [50, -50]);

  return (
    <div className="lp-root">
      <ScrollProgress />
      <HomeHeader />

      {/* ================= HERO ================= */}
      <section id="home" ref={heroRef} className="relative min-h-[100svh] pt-28 md:pt-32 pb-14 overflow-hidden lp-grain">
        <div className="absolute inset-0 lp-cross-grid" />
        <div className="absolute inset-0 lp-bloom" />

        <motion.div
          style={{ y: sphereY, scale: sphereScale }}
          className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-[2%] top-[4%] w-[min(820px,120vw)] aspect-square pointer-events-none opacity-60 lg:opacity-100"
        >
          <HeroSphere className="w-full h-full" />
        </motion.div>

        <motion.div
          style={{ y: textY, opacity: heroFade }}
          className="relative max-w-[1400px] mx-auto px-6 md:px-12 min-h-[calc(100svh-10rem)] flex flex-col"
        >
          <div className="flex items-start justify-between pt-4">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lp-eyebrow !text-sm md:!text-base font-medium text-orange-600 leading-relaxed"
            >
              Autonomous AI Testing for Faster, Smarter Releases
            </motion.p>

          </div>

          <div className="mt-auto grid lg:grid-cols-12 gap-10 items-end pt-16">
            <div className="lg:col-span-8">
              <RevealLines
                as="h1"
                fade={false}
                delay={0.15}
                className="lp-display font-extrabold text-[clamp(2.2rem,6vw,6.4rem)] text-[#0c1e5b]"
                lines={[
                  "Elevate Your",
                  <span className="inline-flex items-center gap-[0.25em]">
                    <Sparkle className="w-[0.6em] h-[0.6em] text-orange-500" />
                    <span className="text-orange-500">QA</span>
                  </span>,
                ]}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, delay: 0.8, ease: EASE }}
                className="mt-6 h-[3px] w-[min(70%,520px)] origin-left bg-gradient-to-r from-orange-500 via-orange-400 to-transparent"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: EASE }}
              className="lg:col-span-4 lg:pb-2 relative bg-[#f8f4ed]/75 backdrop-blur-md border border-[#0c1e5b]/10 rounded-[24px] p-6 md:p-7 shadow-[0_30px_60px_-40px_rgba(12,30,91,0.5)]"
            >
              <p className="text-[#0c1e5b]/90 font-semibold leading-relaxed mb-8 text-base md:text-lg max-w-md">
                Discover the future of software testing.{" "}
                <span className="text-[#0c1e5b] font-extrabold text-lg px-1.5 rounded-md bg-orange-200/80 box-decoration-clone">Advent</span>{" "}
                <span className="text-orange-500 font-bold text-lg">AT</span>
                ’s AI-driven platform automates functional, UI, API, and
                regression workflows with intelligent defect detection.
              </p>

              <div className="flex gap-4 flex-wrap items-center">
                <button
                  onClick={() =>
                    document
                      .getElementById("contact")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="lp-btn lp-btn-orange text-white shadow-[0_18px_40px_-16px_rgba(249,115,22,0.9)]"
                >
                  Contact Us
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>

          <div className="hidden md:flex items-center gap-4 mt-12 text-[#0c1e5b]/50">
            <span className="relative block w-px h-12 bg-[#0c1e5b]/15 overflow-hidden">
              <motion.span
                className="absolute left-0 w-px h-4 bg-orange-500"
                animate={{ top: ["-30%", "110%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <ArrowDown size={14} className="animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ================= MARQUEE BANDS ================= */}
      <div className="relative py-14 overflow-hidden bg-[#f1ebe1]" aria-hidden="true">
        <div className="rotate-[2deg] scale-[1.04] bg-orange-500 py-3.5">
          <MarqueeRow reverse className="text-[#0c1e5b]" star="text-white" />
        </div>
        <div className="-rotate-[2deg] scale-[1.04] bg-[#0c1e5b] py-4 -mt-10 shadow-[0_20px_50px_-20px_rgba(12,30,91,0.6)]">
          <MarqueeRow className="text-white" star="text-orange-500" />
        </div>
      </div>

      {/* =================>> FEATURES<< ================= */}
      <section id="features" className="relative bg-[#f1ebe1] py-20 md:py-28 px-4 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <Reveal>
              <p className="lp-eyebrow text-orange-600 mb-6">Revolutionize Your Workflow</p>
            </Reveal>
            <RevealLines
              className={`${H2} text-[#0c1e5b]`}
              lines={["Transformative", "AI Testing"]}
            />
          </div>

          <Reveal y={60}>
            <div ref={featRef} className="relative rounded-[32px] bg-[#f8f4ed] border border-[#0c1e5b]/10 p-3 md:p-9 shadow-[0_40px_80px_-50px_rgba(12,30,91,0.45)]">
              <PlusCorners inset={22} className="text-[#0c1e5b]/50 hidden md:block" />
              <div className="grid md:grid-cols-2 border border-dashed border-[#0c1e5b]/20 rounded-[20px] md:rounded-none overflow-hidden">
                <div className="relative bg-[#0c1e5b] min-h-[300px] md:min-h-[460px] overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 lp-dot-grid-dark lp-drift" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(249,115,22,0.35),transparent_60%)]" />
                  <motion.div style={{ y: imgY }} className="relative w-[92%] py-8">
                    <ProductConsole modules={testingSuite} />
                  </motion.div>
                </div>

                <div className="relative flex flex-col justify-center p-8 md:p-14 border-t md:border-t-0 md:border-l border-dashed border-[#0c1e5b]/20">
                  <Zap className="text-orange-500 mb-6" size={28} />
                  <h3 className="lp-heading text-3xl md:text-5xl font-semibold mb-6 text-[#0c1e5b] leading-[1.05]">
                    Intelligent <span className="text-orange-500">Automation</span>
                  </h3>

                  <p className="text-[#0c1e5b]/70 mb-10 text-base md:text-lg leading-relaxed max-w-md">
                    AI powered prioritization, test generation, and self-healing
                    workflows accelerate your release cycle.
                  </p>

                  <div>
                    <button onClick={() => navigate("/login")} className="lp-btn lp-btn-navy text-white">
                      Start your journey
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* =================> TESTING SUITE <<================= */}
      <section id="testing-suite" className="relative bg-[#e3e8f3] py-20 md:py-28 px-4 md:px-12 overflow-hidden">
        <div className="absolute inset-0 lp-line-grid [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="relative max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 items-end mb-14 md:mb-20">
            <div className="lg:col-span-8">
              <Reveal>
                <p className="lp-eyebrow text-orange-600 mb-6">Features</p>
              </Reveal>
              <RevealLines
                className={`${H2} text-[#0c1e5b]`}
                lines={["One Platform,", <span className="text-orange-500">Every Kind of Testing</span>]}
              />
            </div>
            <Reveal delay={0.2} className="lg:col-span-4">
              <p className="text-[#0c1e5b]/70 leading-relaxed text-base md:text-lg">
                From requirements to production code, AI agents cover web, mobile,
                API, database, security and performance testing. Bring your own
                OpenAI or Anthropic key.
              </p>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {testingSuite.map((feature, i) => (
              <FeatureCard key={feature.title} index={i} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* =================> CAPABILITIES <<================= */}
      <section id="about" className="relative py-20 md:py-28 px-4 md:px-12 overflow-clip bg-gradient-to-br from-[#f0640f] via-[#ea5d0c] to-[#d9520a] lp-grain">
        <div className="absolute inset-0 lp-dot-grid-light lp-drift opacity-60" />
        <div className="absolute -right-40 -top-40 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35),transparent_65%)]" />
        <div className="absolute -left-40 bottom-[-30%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(12,30,91,0.35),transparent_65%)]" />

        <div className="relative max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <Reveal>
                <p className="lp-eyebrow text-white mb-6">Capabilities</p>
              </Reveal>
              <RevealLines
                className={`${H2} text-white`}
                fade={false}
                lines={["Unlock the", "Power of", <span className="text-[#0c1e5b]">Autonomous</span>, <span className="text-[#0c1e5b]">Testing</span>]}
              />
              <OrbitMotif />
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 md:gap-5">
            {capabilities.map((c, i) => (
              <Card key={c.title} index={i} {...c} className={c.wide ? "sm:col-span-2" : ""} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= Plan Pricing  ================= */}
      <section id="pricing">
        <PricingCTA />
      </section>

      {/* ================= Our Clients ================= */}
      <section id="clients">
        <OurClients />
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact">
        <ContactPage />
      </section>

      {/* ================= >>FOOTER <<================= */}
      <LandingFooter />

      <HelpWidget />
    </div>
  );
};

const MarqueeRow = ({ reverse = false, className = "", star = "" }) => {
  const items = [...testingSuite, ...testingSuite];
  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <div className={`flex shrink-0 items-center lp-marquee-track ${reverse ? "reverse" : ""}`}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {items.map((f, i) => (
              <span key={`${k}-${i}`} className={`flex items-center lp-heading uppercase font-semibold text-xl md:text-3xl px-6 md:px-8 ${className}`}>
                {f.title}
                <Sparkle className={`w-4 h-4 md:w-5 md:h-5 ml-12 md:ml-16 ${star}`} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const OrbitMotif = () => (
  <div className="hidden lg:block relative mt-14 w-64 h-64" aria-hidden="true">
    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="0.1 6" strokeLinecap="round" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="rgba(12,30,91,0.5)" strokeWidth="1.5" strokeDasharray="0.1 5" strokeLinecap="round" />
      <circle cx="100" cy="100" r="34" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeDasharray="0.1 4" strokeLinecap="round" />
      <g>
        <circle cx="100" cy="10" r="6" fill="#fff" />
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="12s" repeatCount="indefinite" />
      </g>
      <g>
        <circle cx="100" cy="38" r="5" fill="#0c1e5b" />
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="8s" repeatCount="indefinite" />
      </g>
      <g>
        <circle cx="134" cy="100" r="4" fill="#fff" />
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="5s" repeatCount="indefinite" />
      </g>
      <circle cx="100" cy="100" r="12" fill="#0c1e5b">
        <animate attributeName="r" values="10;14;10" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  </div>
);

const Card = ({ icon, title, description, className = "", index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.8, delay: (index % 2) * 0.1, ease: EASE }}
    className={`group relative bg-[#f8f4ed] hover:bg-[#0c1e5b] p-7 md:p-8 rounded-[24px] overflow-hidden transition-colors duration-500 shadow-[0_20px_50px_-30px_rgba(12,30,91,0.6)] ${className}`}
  >
    <span className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-orange-500/0 group-hover:bg-orange-500/25 blur-2xl transition-colors duration-700" />
    <div className="relative flex items-start justify-between mb-10">
      <div className="w-12 h-12 rounded-2xl bg-[#0c1e5b] group-hover:bg-orange-500 text-orange-400 group-hover:text-white flex items-center justify-center transition-colors duration-500 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      <span className="lp-mono text-xs text-[#0c1e5b]/40 group-hover:text-orange-400 transition-colors">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>

    <h4 className="relative lp-heading text-xl font-semibold mb-2 text-[#0c1e5b] group-hover:text-white transition-colors duration-500">{title}</h4>

    <p className="relative text-[#0c1e5b]/65 group-hover:text-white/70 text-sm leading-relaxed transition-colors duration-500">{description}</p>
  </motion.div>
);

const FeatureCard = ({ icon, title, description, points, index = 0, wide = false }) => (
  <motion.article
    initial={{ opacity: 0, y: 60 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.9, delay: (index % 3) * 0.12, ease: EASE }}
    whileHover={{ y: -8 }}
    className={`group relative bg-[#f8f4ed] p-2.5 rounded-[28px] border border-[#0c1e5b]/10 shadow-[0_24px_60px_-40px_rgba(12,30,91,0.55)] hover:shadow-[0_40px_80px_-40px_rgba(12,30,91,0.6)] transition-shadow duration-500 h-full flex flex-col ${wide ? "lg:col-span-3 lg:flex-row" : ""}`}
  >
    <div className={`relative h-48 md:h-52 rounded-[20px] bg-[#0c1e5b] overflow-hidden ${wide ? "lg:h-auto lg:min-h-[300px] lg:w-[42%] lg:shrink-0" : ""}`}>
      <div className="absolute inset-0 lp-visual transition-transform duration-700 ease-out group-hover:scale-[1.06]">
        <ModuleVisual title={title} />
      </div>
      <div className="lp-brackets absolute inset-3 text-orange-400/0 group-hover:text-orange-400/80 transition-colors duration-500 pointer-events-none">
        <Brackets />
      </div>
      <span className="absolute top-4 left-4 lp-mono text-[11px] text-white/55">
        {String(index + 1).padStart(2, "0")} / {String(testingSuite.length).padStart(2, "0")}
      </span>
      <div className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/10 backdrop-blur text-orange-400 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center transition-colors duration-500 [&>svg]:w-[18px] [&>svg]:h-[18px]">
        {icon}
      </div>
    </div>

    <div className={`p-5 md:p-6 flex-1 flex flex-col ${wide ? "lg:px-10 lg:py-8" : ""}`}>
      <h4 className="lp-heading text-xl md:text-[22px] font-semibold mb-2 text-[#0c1e5b] flex items-center gap-2">
        {title}
        <ArrowUpRight size={18} className="text-orange-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
      </h4>

      <p className="text-[#0c1e5b]/70 text-sm leading-relaxed mb-5">{description}</p>

      <ul className="space-y-2.5 pt-5 mt-auto border-t border-dashed border-[#0c1e5b]/15">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-[13px] text-[#0c1e5b]/65 leading-snug">
            <span className="w-1.5 h-1.5 mt-[7px] shrink-0 bg-orange-500 rotate-45" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  </motion.article>
);

export default Home;
