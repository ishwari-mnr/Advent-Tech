import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Check, Loader2, Lock, MousePointer2 } from "lucide-react";

// Uses only words already on the site; everything else is placeholder bars.

const TARGETS = [
  { x: 6, y: 6, w: 22, h: 8 },
  { x: 6, y: 22, w: 52, h: 26 },
  { x: 64, y: 22, w: 30, h: 12 },
  { x: 64, y: 38, w: 18, h: 10 },
  { x: 6, y: 58, w: 27, h: 32 },
  { x: 37, y: 58, w: 27, h: 32 },
  { x: 68, y: 58, w: 26, h: 32 },
];
const STEPS = ["Connect", "Discover", "Review", "Validate"];
const BAR_WIDTHS = [72, 54, 86, 61, 78, 47, 66, 90, 58, 81];

const useTicker = (ms, active) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms, active]);
  return tick;
};

const Stage = ({ tick, dense = true }) => {
  const idx = tick % TARGETS.length;
  const cycle = Math.floor(tick / TARGETS.length);
  const t = TARGETS[idx];

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      <div className="absolute rounded-[3px] bg-[#0c1e5b]" style={{ left: "6%", top: "6%", width: "8%", height: "8%" }} />
      <div className="absolute rounded-full bg-[#0c1e5b]/15" style={{ left: "16%", top: "8.5%", width: "12%", height: "3%" }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute rounded-full bg-[#0c1e5b]/10" style={{ left: `${62 + i * 11}%`, top: "8.5%", width: "8%", height: "3%" }} />
      ))}
      <div className="absolute rounded-md bg-gradient-to-br from-[#e3e8f3] to-[#f1ebe1]" style={{ left: "6%", top: "22%", width: "52%", height: "26%" }}>
        <div className="absolute left-[8%] top-[22%] w-[62%] h-[14%] rounded-full bg-[#0c1e5b]/80" />
        <div className="absolute left-[8%] top-[46%] w-[44%] h-[10%] rounded-full bg-[#0c1e5b]/25" />
        <div className="absolute left-[8%] top-[66%] w-[22%] h-[16%] rounded bg-orange-500" />
      </div>
      <div className="absolute rounded border border-[#0c1e5b]/20 bg-[#f8f4ed]" style={{ left: "64%", top: "22%", width: "30%", height: "12%" }}>
        <div className="absolute left-[8%] top-[38%] w-[46%] h-[24%] rounded-full bg-[#0c1e5b]/15" />
      </div>
      <div className="absolute rounded bg-[#0c1e5b]" style={{ left: "64%", top: "38%", width: "18%", height: "10%" }} />
      {[6, 37, 68].map((x, i) => (
        <div key={x} className="absolute rounded-md border border-[#0c1e5b]/10 bg-[#f8f4ed]" style={{ left: `${x}%`, top: "58%", width: i === 2 ? "26%" : "27%", height: "32%" }}>
          <div className="absolute left-[10%] top-[12%] w-[28%] h-[22%] rounded bg-orange-200" />
          <div className="absolute left-[10%] top-[46%] w-[70%] h-[9%] rounded-full bg-[#0c1e5b]/30" />
          {dense && <div className="absolute left-[10%] top-[62%] w-[52%] h-[8%] rounded-full bg-[#0c1e5b]/12" />}
        </div>
      ))}

      {TARGETS.slice(0, idx).map((b, i) => (
        <div
          key={`${cycle}-${i}`}
          className="absolute rounded-[4px] border border-emerald-500/70 bg-emerald-500/[0.06]"
          style={{ left: `${b.x - 1}%`, top: `${b.y - 1.5}%`, width: `${b.w + 2}%`, height: `${b.h + 3}%` }}
        >
          <span className="absolute -top-[7px] -right-[7px] w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check size={9} strokeWidth={3.5} />
          </span>
        </div>
      ))}

      <motion.div
        key={`active-${tick}`}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="absolute rounded-[4px] border-[1.5px] border-orange-500 bg-orange-500/[0.07]"
        style={{ left: `${t.x - 1}%`, top: `${t.y - 1.5}%`, width: `${t.w + 2}%`, height: `${t.h + 3}%` }}
      >
        <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-orange-500" />
        <span className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-orange-500" />
      </motion.div>

      <motion.div
        className="absolute z-10 pointer-events-none"
        animate={{ left: `${t.x + t.w * 0.6}%`, top: `${t.y + t.h * 0.55}%` }}
        transition={{ type: "spring", stiffness: 70, damping: 16 }}
        style={{ left: "50%", top: "50%" }}
      >
        <MousePointer2 size={dense ? 18 : 14} className="text-[#0c1e5b] fill-white drop-shadow" />
        <motion.span
          key={`click-${tick}`}
          initial={{ scale: 0.2, opacity: 0.9 }}
          animate={{ scale: 2.4, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute -left-1.5 -top-1.5 w-4 h-4 rounded-full border-2 border-orange-500"
        />
      </motion.div>

      <span className="absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-orange-500/0 via-orange-500/10 to-orange-500/0 border-b border-orange-500/60 lp-scanline pointer-events-none" />
    </div>
  );
};

const WindowChrome = ({ small = false }) => (
  <div className={`flex items-center gap-1.5 bg-[#f1ebe1] border-b border-[#0c1e5b]/10 ${small ? "px-2.5 py-2" : "px-3.5 py-2.5"}`}>
    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
    <div className={`mx-auto flex items-center gap-1.5 rounded-md bg-white/80 border border-[#0c1e5b]/10 ${small ? "px-2 py-0.5 w-[55%]" : "px-2.5 py-1 w-[46%]"}`}>
      <Lock size={9} className="text-[#0c1e5b]/40 shrink-0" />
      <span className="h-1.5 w-full rounded-full bg-[#0c1e5b]/12" />
    </div>
  </div>
);

const ProductConsole = ({ modules = [] }) => {
  const ref = useRef(null);
  const inView = useInView(ref);
  const tick = useTicker(1500, inView);
  const step = Math.floor(tick / 2) % STEPS.length;
  const logStart = Math.max(0, tick - 4);
  const rows = Array.from({ length: tick - logStart + 1 }, (_, i) => logStart + i);

  return (
    <div ref={ref} className="w-full rounded-2xl overflow-hidden bg-[#f8f4ed] border border-white/20 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
      <WindowChrome />
      <div className="flex">
        {modules.length > 0 && (
          <aside className="hidden xl:flex flex-col gap-0.5 w-[32%] max-w-[190px] bg-[#0c1e5b] p-2.5">
            {modules.slice(0, 5).map((m, i) => (
              <div
                key={m.title}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium ${
                  i === 0 ? "bg-white/10 text-white" : "text-white/45"
                }`}
              >
                <span className={`shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 ${i === 0 ? "text-orange-400" : ""}`}>{m.icon}</span>
                <span className="truncate">{m.title}</span>
                {i === 0 && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 lp-pulse-dot" />}
              </div>
            ))}
          </aside>
        )}

        <div className="flex-1 min-w-0 p-3 md:p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <React.Fragment key={s}>
                  <div className={`flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 text-[10.5px] font-semibold transition-colors duration-500 ${
                    active ? "bg-orange-500 text-white" : done ? "bg-[#0c1e5b] text-white" : "bg-[#0c1e5b]/[0.06] text-[#0c1e5b]/45"
                  }`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${active || done ? "bg-white/20" : "bg-[#0c1e5b]/10"}`}>
                      {done ? <Check size={10} strokeWidth={3} /> : active ? <Loader2 size={10} className="animate-spin" /> : <span className="w-1 h-1 rounded-full bg-current" />}
                    </span>
                    <span className="hidden sm:inline">{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className="flex-1 h-px bg-[#0c1e5b]/15 relative overflow-hidden">
                      <span className={`absolute inset-y-0 left-0 bg-[#0c1e5b] transition-all duration-700 ${done ? "w-full" : "w-0"}`} />
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-3 rounded-lg overflow-hidden border border-[#0c1e5b]/10 aspect-[4/3] relative">
              <Stage tick={tick} />
              <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-[#0c1e5b]/85 px-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 lp-pulse-dot" />
                <span className="w-6 h-1 rounded-full bg-white/50" />
              </span>
            </div>

            <div className="sm:col-span-2 rounded-lg bg-white border border-[#0c1e5b]/10 p-2.5 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="h-1.5 w-12 rounded-full bg-[#0c1e5b]/25" />
                <span className="flex gap-1">
                  <span className="w-3 h-1.5 rounded-full bg-emerald-400" />
                  <span className="w-3 h-1.5 rounded-full bg-orange-300" />
                </span>
              </div>
              <div className="space-y-1.5 flex-1">
                <AnimatePresence initial={false}>
                  {rows.map((r) => {
                    const latest = r === tick;
                    return (
                      <motion.div
                        key={r}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 ${latest ? "bg-orange-50" : ""}`}
                      >
                        <span className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${latest ? "text-orange-500" : "bg-emerald-500 text-white"}`}>
                          {latest ? <Loader2 size={12} className="animate-spin" /> : <Check size={9} strokeWidth={3.5} />}
                        </span>
                        <span className="flex-1 space-y-1">
                          <span className="block h-1.5 rounded-full bg-[#0c1e5b]/20" style={{ width: `${BAR_WIDTHS[r % BAR_WIDTHS.length]}%` }} />
                          <span className="block h-1 rounded-full bg-[#0c1e5b]/10" style={{ width: `${BAR_WIDTHS[(r + 3) % BAR_WIDTHS.length] * 0.6}%` }} />
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConsole;
