import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Smartphone,
  Database,
  Activity,
  FolderGit2,
  ArrowRight,
  ShieldCheck,
  Code2,
  TerminalSquare
} from "lucide-react";
import {
  WebIllustration,
  ApiIllustration,
  MobileIllustration,
  DbIllustration,
} from "./ModuleIllustrations.jsx";

const MainDashboard = () => {
  const navigate = useNavigate();

  // Alternating navy / orange accents to match the app theme.
  const testingModules = [
    {
      title: "Web Testing",
      desc: "Configure and run end-to-end automated tests for web applications across multiple browsers.",
      path: "/web-testing",
      accent: "bg-navy-800",
      lightBg: "bg-orange-200/60",
      band: "from-navy-50 via-white/70 to-orange-50",
      art: <WebIllustration />,
      iconColor: "text-white bg-navy-800",
      icon: <Globe size={22} />,
    },
    {
      title: "API Testing",
      desc: "Validate REST and GraphQL endpoints, check status codes, and monitor response schemas.",
      path: "/api-testing",
      accent: "bg-orange-500",
      lightBg: "bg-navy-200/60",
      band: "from-orange-50 via-white/70 to-navy-50",
      art: <ApiIllustration />,
      iconColor: "text-white bg-orange-500",
      icon: <Activity size={22} />,
    },
    {
      title: "Mobile Testing",
      desc: "Execute automated UI and functional tests for iOS and Android applications.",
      path: "/mobile-testing",
      accent: "bg-orange-500",
      lightBg: "bg-navy-200/60",
      band: "from-orange-50 via-white/70 to-navy-50",
      art: <MobileIllustration />,
      iconColor: "text-white bg-orange-500",
      icon: <Smartphone size={22} />,
    },
    {
      title: "DB Testing",
      desc: "Verify data integrity, schema consistency, and execute automated migration checks.",
      path: "/db-testing",
      accent: "bg-navy-800",
      lightBg: "bg-orange-200/60",
      band: "from-navy-50 via-white/70 to-orange-50",
      art: <DbIllustration />,
      iconColor: "text-white bg-navy-800",
      icon: <Database size={22} />,
    },
  ];

  return (
    <div className="space-y-4 pb-4 font-sans">

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* --- BANNER HERO SECTION --- */}
        <div className="rounded-3xl border border-white/70 bg-white/45 px-8 py-7 shadow-card backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-orange-600 bg-orange-100 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
              <ShieldCheck size={13} />
              <span>Autonomous QA Platform</span>
            </div>
            <h2 className="text-3xl font-bold text-navy-800 mb-2.5 tracking-tight">
              Welcome to <span className="text-orange-500">Advent AT</span>
            </h2>
            <p className="text-[15px] text-navy-400 leading-relaxed">
              Select a testing module below to configure your environments, write test scripts, and launch automated executions. Manage all your configurations in the Projects section.
            </p>
          </div>

          {/* Decorative Graphic */}
          <div className="w-28 h-28 bg-gradient-to-br from-navy-800 to-navy-600 rounded-3xl shadow-lg shadow-navy-900/20 flex items-center justify-center relative z-10 shrink-0 transform rotate-3 hover:rotate-0 transition-transform">
            <div className="text-white font-black text-xl tracking-tighter text-center leading-tight">
              Advent<br/><span className="text-orange-400 text-2xl">AT</span>
            </div>
          </div>

          {/* Decorative blurs */}
          <div className="absolute -top-16 right-16 w-48 h-48 bg-orange-400/15 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-navy-400/10 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        {/* --- YOUR PROJECTS SECTION --- */}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-navy-800 flex items-center gap-2 mb-2.5 px-1">
            <span className="text-orange-500">✦</span> Workspace
          </h3>

          <div
            onClick={() => navigate("/projects")}
            className="flex-1 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 rounded-3xl px-6 py-6 text-white shadow-card relative overflow-hidden group cursor-pointer transition-all hover:shadow-xl hover:shadow-navy-900/20 flex flex-col justify-center"
          >
            {/* Background Accents */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-orange-500/25 blur-3xl rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <FolderGit2 size={100} />
            </div>

            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/15 rounded-2xl text-orange-300 backdrop-blur-sm shrink-0">
                  <FolderGit2 size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Your Projects</h3>
                  <p className="text-navy-100 text-sm leading-relaxed">
                    View and manage all your active test suites, environment variables, and saved automation scripts.
                  </p>
                </div>
              </div>

              <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-orange-900/30 transition-colors shrink-0 w-fit">
                Open Workspace <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- TESTING MODULES GRID --- */}
      <div>
        <h3 className="text-base font-semibold text-navy-800 flex items-center gap-2 mb-2.5 px-1">
          <span className="text-orange-500">✦</span> Testing Modules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {testingModules.map((module, i) => (
            <div
              key={i}
              onClick={() => navigate(module.path)}
              className="rounded-3xl border border-white/70 bg-white/45 p-3 shadow-card backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              {/* Illustration panel */}
              <div className={`relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br ${module.band}`}>
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${module.lightBg} blur-2xl`}></div>
                <div className="absolute inset-0 px-4 pt-3 pb-6 transition-transform duration-500 group-hover:scale-[1.04]">
                  {module.art}
                </div>
                <div className="absolute right-2.5 top-2.5 w-8 h-8 rounded-full flex items-center justify-center bg-white text-navy-400 shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <ArrowRight size={15} />
                </div>
              </div>

              <div className="relative z-10 -mt-6 ml-3 mb-2">
                <div className={`inline-flex p-2.5 rounded-xl shadow-md ring-4 ring-white ${module.iconColor}`}>
                  {module.icon}
                </div>
              </div>

              <div className="relative z-10 flex-grow px-2.5 pb-3">
                <h4 className="text-lg font-semibold text-navy-800 mb-1.5">
                  {module.title}
                </h4>
                <p className="text-sm text-navy-400 leading-relaxed">
                  {module.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MainDashboard;
