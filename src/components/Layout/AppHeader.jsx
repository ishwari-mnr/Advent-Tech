import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, getUserDetails } from "../../services/operations/authAPIs";
import { Settings, User, ChevronDown, Key, LogOut } from "lucide-react";
import logo from "../../assets/ADVENT_AT.png";

/**
 * variant="shell" → floating card inside the dashboard layout (logo lives in the sidebar)
 * variant="bar"   → full-width bar with logo (admin pages, upgrade plan)
 */
const AppHeader = ({ variant = "bar" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.profile);

  useEffect(() => {
    if (!user) {
      dispatch(getUserDetails());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoutUser = () => {
    dispatch(logout(navigate));
    setIsOpen(false);
  };

  // Helper function to map paths to readable names
  const getPageName = (pathname) => {
    switch (pathname) {
      case "/":
      case "/dashboard":
        return "Dashboard";
      case "/web-testing":
        return "Web Testing";
      case "/db-testing":
        return "DB Testing";
      case "/mobile-testing":
        return "Mobile App Testing";
      case "/api-testing":
        return "API Testing";
      case "/profile":
        return "Profile";
      case "/change-password":
        return "Change Password";
      case "/upgrade-plan":
        return "Upgrade Plan";
      default:
        return pathname
          .substring(1)
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
    }
  };

  const isShell = variant === "shell";

  return (
    <header
      className={
        isShell
          ? "relative z-40 flex shrink-0 items-center justify-between rounded-3xl border border-white/70 bg-white/45 px-6 py-3 shadow-card backdrop-blur-xl"
          : "sticky top-0 z-50 flex h-16 items-center justify-between border-b border-navy-50 bg-white/80 px-6 backdrop-blur-xl"
      }
    >
      <div className="flex min-w-0 items-center gap-6">
        {!isShell && (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src={logo}
              alt="Advent AT"
              className="h-11 w-auto object-contain rounded-xl"
            />
          </div>
        )}
        <nav className="min-w-0">
          <span
            className={
              isShell
                ? "block truncate text-2xl font-bold tracking-tight text-navy-800"
                : "text-sm font-semibold text-navy-800"
            }
          >
            {getPageName(location.pathname)}
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-3 p-1 pr-3 rounded-full border transition-all ${
              isOpen
                ? "border-orange-200 bg-white shadow-sm"
                : "border-white bg-white/70 hover:bg-white"
            }`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-navy-700 to-navy-900 rounded-full flex items-center justify-center ring-2 ring-white shrink-0">
              <User size={18} className="text-orange-300" />
            </div>

            {/* USER name */}
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-sm font-semibold text-navy-800">
                {user?.name || "User"}
              </span>
              {user?.email && (
                <span className="text-[11px] text-navy-300 truncate max-w-[120px]">
                  {user.email.split("@")[0]}
                </span>
              )}
            </div>

            <ChevronDown
              size={14}
              className={`text-navy-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Content */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-navy-50 rounded-2xl shadow-2xl p-1.5 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">

              <button
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-700 hover:bg-navy-50 transition-colors"
              >
                <Settings size={16} className="text-navy-300" />
                <span className="font-medium">Profile</span>
              </button>

              <button
                onClick={() => {
                  navigate("/change-password");
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-700 hover:bg-navy-50 transition-colors"
              >
                <Key size={16} className="text-navy-300" />
                <span className="font-medium">Change Password</span>
              </button>

              <div className="my-1 border-t border-navy-50"></div>

              <button
                onClick={logoutUser}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span className="font-bold">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
