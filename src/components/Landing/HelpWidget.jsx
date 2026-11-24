import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, X, Copy, Check } from "lucide-react";
import ContactPage from "../UI/ContactPage";

const HelpWidget = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleCopyEmail = () => {
    // navigator.clipboard is undefined on non-HTTPS origins; don't throw.
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard
      .writeText("support@adventglobal.com")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        aria-label="Need Help?"
        className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-[65] w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#0c1e5b] text-white flex items-center justify-center shadow-[0_18px_40px_-12px_rgba(12,30,91,0.7)] ring-4 ring-orange-500"
      >
        <span className="absolute inset-0 rounded-full border-2 border-orange-500 animate-ping opacity-40" />
        <HelpCircle size={28} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-[#07123f]/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-[28px] bg-[#f8f4ed] shadow-2xl"
            >
              <div className="relative bg-[#0c1e5b] text-white p-6 md:p-7 overflow-hidden">
                <span className="absolute inset-0 lp-dot-grid-dark lp-drift opacity-70" />
                <span className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.55),transparent_65%)]" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute top-4 right-4 z-10 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <h3 className="relative lp-heading text-lg font-semibold flex items-center gap-2 mb-5 text-orange-400">
                  <HelpCircle size={20} />
                  Need Help?
                </h3>
                <h4 className="relative lp-heading text-2xl font-semibold mb-2">Any Query?</h4>
                <p className="relative text-white/70 text-sm leading-relaxed mb-5">
                  If you have any questions or need assistance, feel free to drop us an email. Our team will get back to you shortly.
                </p>

                <div className="relative inline-flex items-center bg-white/10 border border-white/15 rounded-xl overflow-hidden max-w-full">
                  <a
                    href="mailto:support@adventglobal.com"
                    className="px-4 py-2.5 text-white font-semibold text-sm hover:bg-white/10 transition-colors truncate"
                  >
                    support@adventglobal.com
                  </a>
                  <span className="w-px h-7 bg-white/20" />
                  <button
                    onClick={handleCopyEmail}
                    title="Copy to clipboard"
                    className="px-3.5 py-2.5 hover:bg-orange-500 transition-colors"
                  >
                    {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} className="text-orange-300" />}
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-7">
                <ContactPage variant="modal" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpWidget;
