import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  FolderKanban,
  Bot,
  Database,
  Smartphone,
  Globe,
  ChevronLeft,
  History,
  FileText,
  Gauge,
  Github,
  ShieldCheck
} from "lucide-react";
import { useSelector } from "react-redux";
import logo from "../../assets/ADVENT_AT.png";

const Sidebar = () => {
  const { user } = useSelector((state) => state.profile);
  const [isCollapsed, setIsCollapsed] = useState(false); // State for toggle
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Projects", icon: <FolderKanban size={20} />, path: "/projects" },
    { name: "Web Testing", icon: <Bot size={20} />, path: "/web-testing" },
    { name: "Business Validation", icon: <FileText size={20} />, path: "/test-case-designer" },
    { name: "Regression Testing", icon: <History size={20} />, path: "/regression-testing" },
    { name: "Mobile App Testing", icon: <Smartphone size={20} />, path: "/mobile-testing" },
    { name: "API Testing", icon: <Globe size={20} />, path: "/api-testing" },
    { name: "DB Testing", icon: <Database size={20} />, path: "/db-testing" },
    { name: "Security Testing", icon: <ShieldCheck size={20} />, path: "/security-testing" },
    { name: "Performance Testing", icon: <Gauge size={20} />, path: "/performance-testing" },
    { name: "GitHub Code Testing", icon: <Github size={20} />, path: "/github-testing" },
  ];

  if (user?.role === "company_admin") {
    menuItems.push({
      name: "Admin Portal",
      icon: <Users size={20} />,
      path: "/organization-admin-dashboard",
    });
  }

  if (user?.role === "super_admin") {
    menuItems.push({
      name: "Super Admin Portal",
      icon: <Users size={20} />,
      path: "/dashboard/super-admin",
    });
  }

  return (
    <aside
      className={`relative shrink-0 h-full rounded-3xl bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 text-white shadow-card transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-60"
      }`}
    >
      {/* Soft orange glow at the foot of the panel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 rounded-b-3xl bg-gradient-to-t from-orange-500/25 to-transparent" />

      {/* Toggle Button */}
      {/* Edge toggle: one chevron that points the way the sidebar will move
          (‹ collapse, › expand) — the standard pattern for a collapsible rail. */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-8 z-10 rounded-full border border-navy-100 bg-white p-1 text-navy-500 shadow-md transition-colors hover:text-orange-600"
      >
        <ChevronLeft
          size={16}
          className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
        />
      </button>

      <div className="relative flex h-full flex-col">
        {/* Logo (moved here from the header) */}
        <div
          className={`flex cursor-pointer items-center pt-5 pb-4 ${isCollapsed ? "justify-center px-2" : "px-5"}`}
          onClick={() => navigate("/")}
        >
          <span className="flex h-11 items-center justify-center rounded-xl bg-white px-1.5 shadow-sm">
            <img src={logo} alt="Advent AT" className="h-9 w-auto object-contain" />
          </span>
        </div>

        <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <NavLink
                to={item.path}
                onClick={(e) => {
                  const isRunning = localStorage.getItem("autopilotRunning") === "true";
                  const goingToAutopilot = item.path === "/autopilot";

                  if (isRunning && !goingToAutopilot) {
                    const confirmLeave = window.confirm(
                      "An Autopilot test is currently running. Leaving this page may interrupt the process. Continue?"
                    );

                    if (!confirmLeave) {
                      e.preventDefault();
                    } else {
                      localStorage.setItem("autopilotRunning", "false");
                    }
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
                    isCollapsed ? "justify-center px-2" : "justify-start px-3.5"
                  } ${
                    isActive
                      ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] [&>span:first-child]:text-orange-400"
                      : "text-navy-200 hover:bg-white/10 hover:text-white"
                  }`
                }
                title={isCollapsed ? item.name : ""} // Show tooltip when collapsed
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
