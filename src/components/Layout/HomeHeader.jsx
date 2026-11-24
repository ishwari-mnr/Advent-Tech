import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { User, ArrowUpRight, Menu, X } from "lucide-react";
import logo from "../../assets/ADVENT_AT.png";

const NAV_ITEMS = ["Home", "Features", "About", "Contact", "Pricing", "Our Clients"];

const HomeHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScroll = (id) => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-3 md:px-6 pt-3"
    >
      <nav
        className={`lp-brackets text-[#0c1e5b]/40 max-w-[1400px] mx-auto flex items-center justify-between transition-all duration-500 border ${
          scrolled
            ? "bg-[#f8f4ed]/85 backdrop-blur-xl border-[#0c1e5b]/10 shadow-[0_10px_40px_-20px_rgba(12,30,91,0.35)] px-4 md:px-6 py-2.5"
            : "bg-[#f8f4ed]/40 backdrop-blur-md border-transparent px-4 md:px-8 py-4"
        }`}
      >
        <span className="lp-bk tl" />
        <span className="lp-bk tr" />
        <span className="lp-bk bl" />
        <span className="lp-bk br" />

        {/* Brand Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img
            src={logo}
            alt="Advent AT"
            className={`w-auto object-contain mix-blend-multiply transition-all duration-500 ${scrolled ? "h-9" : "h-11"}`}
          />
        </Link>

        {/* Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => handleScroll(item.toLowerCase())}
              className="group relative lp-mono text-[11px] uppercase text-[#0c1e5b]/70 hover:text-[#0c1e5b] px-3.5 py-2 transition-colors flex items-center gap-1"
            >
              {item}
              <ArrowUpRight
                size={12}
                className="text-orange-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              />
              <span className="absolute left-3.5 right-3.5 bottom-1 h-px bg-orange-500 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="lp-btn lp-btn-navy !py-3 !px-5 text-white">
            <User size={14} strokeWidth={2.5} />
            <span>Log in</span>
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden w-11 h-11 flex items-center justify-center text-[#0c1e5b] border border-[#0c1e5b]/15"
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden max-w-[1400px] mx-auto mt-2 bg-[#0c1e5b] text-white p-3 shadow-2xl"
          >
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item}
                onClick={() => handleScroll(item.toLowerCase())}
                className="w-full flex items-center justify-between px-4 py-3.5 border-b border-white/10 last:border-0 lp-mono text-xs uppercase hover:text-orange-400 transition-colors"
              >
                <span className="flex items-center gap-4">
                  <span className="text-orange-400/80">0{i + 1}</span>
                  {item}
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default HomeHeader;
