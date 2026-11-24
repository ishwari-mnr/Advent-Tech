import { useNavigate } from "react-router-dom";
import {
  AppWindow,
  ArrowUpRight,
  Boxes,
  Cpu,
  Database,
  FileSearch,
  Gauge,
  GitBranch,
  Globe,
  Layout,
  LineChart,
  Lock,
  Network,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { SITE } from "../config/site";
import HomeHeader, { scrollToSection } from "../components/Layout/HomeHeader";
import FeatureCard from "../components/Landing/FeatureCard";
import Pricing from "../components/Landing/Pricing";
import OurClients from "../components/Landing/OurClients";
import ContactSection from "../components/Landing/ContactSection";
import Footer from "../components/Landing/Footer";
import HelpWidget from "../components/Landing/HelpWidget";

const MODULES = [
  {
    icon: Globe,
    title: "Web Testing",
    description: "An AI agent signs in to your web app, explores it and tests it while you watch.",
    points: [
      "Connect → Discover → Review → Validate: it writes tests, you confirm expected results",
      "Works on public sites or behind sign-in, with approver accounts for approval flows",
      "Standard crawl with test stories and Excel report, or prompt testing with your own steps",
      "Live browser stream, activity log and a Terminate button",
    ],
  },
  {
    icon: FileSearch,
    title: "Business Validation",
    description: "Test Case Designer for before the site is built. No website needed.",
    points: [
      "Upload a requirements document (PDF, DOCX, TXT or MD, up to 50 MB)",
      "Get back a full test case specification",
      "Reads diagrams and mockups inside the document",
    ],
  },
  {
    icon: RefreshCw,
    title: "Regression Testing",
    description: "Project-based regression testing that keeps every release in check.",
    points: [
      "Organise work into projects",
      "Connect your existing tools",
      "ML pipeline, insights and an AI chat assistant",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile App Testing",
    description: "Upload an Android APK and an autonomous AI agent tests it.",
    points: [
      "Optional login details and a max actions setting (50–500)",
      "Pipeline stages: Validation → Exploration → Testing",
      "Live device stream, live logs, and screen, passed and failed counts",
    ],
  },
  {
    icon: Network,
    title: "API Testing",
    description: "API Guardian tests your endpoints straight from your Swagger / OpenAPI docs.",
    points: [
      "Target URL, API base URL and optional OpenAPI link",
      "Login credentials, OTP and results delivered by email",
      "Safe mode (on by default) skips destructive calls",
    ],
  },
  {
    icon: Database,
    title: "DB Testing",
    description: "Full database assessments for PostgreSQL, MongoDB or both via a replica URL.",
    points: [
      "Choose Claude or GPT and pick the model",
      "Tests in SQL or JavaScript, as integration or unit tests",
      "Optional schema DDL and description to steer the AI",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security Testing (VAPT)",
    description: "Security assessment against the OWASP Top 10 plus API security.",
    points: [
      "Checks pages behind login using a test account",
      "Reads your OpenAPI docs to cover every endpoint",
      "Requires confirmation that you're authorized to test the site",
    ],
  },
  {
    icon: Gauge,
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
    icon: GitBranch,
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
    icon: Boxes,
    title: "AI SAP Testing",
    wide: true,
    description:
      "An AI agent signs in to your SAP and tests it module by module (Finance, Sales, Purchasing, Inventory and more). No one writes test scripts.",
    points: [
      "Connect → Discover → Learn → Write tests → Run → Report",
      "Name a module and it reads SAP's own menu to find every transaction in it",
      "Learns how your SAP behaves, then writes tests only from what it saw",
      "Pass or Fail per test, with screenshots, the exact failing step and an Excel report of real defects",
      "Fits any company's SAP with no per-customer setup, and never changes real business data",
    ],
  },
];

const CAPABILITIES = [
  {
    icon: Cpu,
    title: "Intelligent Discovery",
    description: "AI-driven requirement analysis, risk prioritization, and smart test coverage planning.",
  },
  {
    icon: Layout,
    title: "Experience Validation",
    description: "Autonomous UI, UX, accessibility, and visual regression testing across devices.",
  },
  {
    icon: Globe,
    title: "Cloud & DevOps Ready",
    description: "Seamless automation for cloud-native, microservices, and CI/CD pipelines.",
  },
  {
    icon: LineChart,
    title: "Performance Intelligence",
    description: "AI-powered load, stress, and scalability testing with predictive insights.",
  },
  {
    icon: Shield,
    title: "Self-Healing Automation",
    description:
      "Adaptive tests that evolve with application changes, reducing maintenance overhead.",
  },
  {
    icon: Lock,
    title: "Enterprise-Grade Security",
    description: "Secure, compliant, and scalable testing for mission-critical applications.",
  },
  {
    icon: AppWindow,
    title: "Power Apps Testing",
    wide: true,
    description:
      "End-to-end Power Apps testing across screens, forms, field validation, and user workflows.",
  },
];

function Eyebrow({ children, className = "text-orange-500" }) {
  return (
    <p className={`text-sm font-semibold uppercase tracking-wide ${className}`}>{children}</p>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <HomeHeader />

      {/* Hero */}
      <section id="home" className="scroll-mt-24 bg-gray-50 pb-20 pt-32 sm:pt-40">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Eyebrow>Autonomous AI Testing for Faster, Smarter Releases</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold text-navy sm:text-6xl">
            Elevate Your <span className="text-orange-500">QA</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Discover the future of software testing. <strong className="text-navy">{SITE.brand}</strong>
            's AI-driven platform automates functional, UI, API, and regression workflows with
            intelligent defect detection.
          </p>
          <button
            type="button"
            onClick={() => scrollToSection("contact")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Contact Us
            <ArrowUpRight size={18} />
          </button>
        </div>
      </section>

      {/* Module strip */}
      <div className="bg-navy py-4 text-white">
        <p className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-3 gap-y-1 px-4 text-sm font-medium sm:px-6">
          {MODULES.map((m, i) => (
            <span key={m.title} className="whitespace-nowrap">
              {m.title}
              {i < MODULES.length - 1 && <span className="ml-3 text-orange-400">•</span>}
            </span>
          ))}
        </p>
      </div>

      {/* Features */}
      <section id="features" className="scroll-mt-24 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <Eyebrow>Revolutionize Your Workflow</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">Transformative AI Testing</h2>
          </div>
          <div className="mt-10 grid overflow-hidden rounded-3xl border border-gray-200 shadow-sm md:grid-cols-2">
            <div className="bg-navy p-8 text-white">
              <ul className="space-y-3">
                {MODULES.map(({ icon: Icon, title }) => (
                  <li key={title} className="flex items-center gap-3">
                    <Icon size={18} className="flex-none text-orange-400" />
                    <span>{title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col justify-center bg-white p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                <Zap size={24} />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-navy">
                Intelligent <span className="text-orange-500">Automation</span>
              </h3>
              <p className="mt-3 text-gray-600">
                AI powered prioritization, test generation, and self-healing workflows accelerate
                your release cycle.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-6 self-start rounded-full bg-navy px-6 py-3 font-semibold text-white hover:bg-navy/90"
              >
                Start your journey
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testing suite */}
      <section id="testing-suite" className="scroll-mt-24 bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <div>
              <Eyebrow>Features</Eyebrow>
              <h2 className="mt-2 text-3xl font-bold text-navy sm:text-4xl">
                One Platform, <span className="text-orange-500">Every Kind of Testing</span>
              </h2>
            </div>
            <p className="text-gray-600">
              From requirements to production code, AI agents cover web, mobile, API, database,
              security and performance testing. Bring your own OpenAI or Anthropic key.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <FeatureCard key={m.title} {...m} />
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="about" className="scroll-mt-24 bg-orange-500 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow className="text-white/80">Capabilities</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              Unlock the Power of <span className="text-navy">Autonomous Testing</span>
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-2">
            {CAPABILITIES.map(({ icon: Icon, title, description, wide }) => (
              <div
                key={title}
                className={`rounded-2xl bg-white p-6 text-gray-800 shadow-sm ${wide ? "sm:col-span-2" : ""}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />
      <OurClients />
      <ContactSection />
      <Footer />
      <HelpWidget />
    </div>
  );
}
