import { Fragment, useState, useEffect, useRef } from "react";
import SubscriptionGuard from "../../components/UI/SubscriptionGuard";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import {
  Activity, Ban, Check, ChevronDown, ChevronUp, CircleCheck, CircleX, ClipboardList, Coins, Download,
  FileSpreadsheet, FileText, Flag, Globe, ImagePlus, KeyRound, ListChecks, LoaderCircle, Lock, LogIn, MonitorPlay, PenLine,
  Play, Plug, RefreshCw, ScanSearch, Search, ShieldCheck, Sparkles, Square, TriangleAlert, X, Zap,
} from "lucide-react";
import {
  getCreditEstimate,
  authorizeRun,
  reserveExploration,
  settleRun,
  releaseRun,
  fetchCreditAccount,
  creditPreflight,
} from "../../services/operations/creditAPIs";
import { PHASE2_MAX_URLS } from "../../config/pricing/creditMath";
import useLiveUsage from "../../hooks/useLiveUsage";

const API = process.env.REACT_APP_AI_WEB_TESTER_BACKEND_URL;
// Test Case Designer backend: source of the scenarios for "Run validation".
const SPEC_API = process.env.REACT_APP_AI_SPEC_TESTER_BACKEND_URL;
const WS = API.replace(/^http/, "ws");

/**
 * Bearer token for the web-testing engine.
 *
 * The engine used to take `user_id` from the request body and believe it, so a
 * run started before the profile had loaded arrived with no owner and its usage
 * was recorded against "unknown" — unbillable, and unattributable afterwards.
 * It now derives the owner from this token instead (security.py), so every call
 * that starts or reads a run has to carry it. Mirrors getAuthHeader in
 * MobileAppTesting.jsx.
 */
const getAuthHeader = () => {
  try {
    const token = JSON.parse(localStorage.getItem("token"));
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

/** Raw token for WebSocket routes, which cannot set request headers. */
const getAuthToken = () => {
  try {
    return JSON.parse(localStorage.getItem("token")) || null;
  } catch {
    return null;
  }
};

// const API = "http://localhost:8000";
// const WS = API.replace(/^http/, "ws");

// ── Colour tokens (match the app shell: slate neutrals, orange brand) ────────
const C = {
  bg: "#ffffff",
  canvas: "transparent",
  surface: "#f6f7fb",
  border: "#e3e7f1",
  accent: "#f97316",
  accent2: "#0c1e5b",
  green: "#059669",
  yellow: "#d97706",
  red: "#dc2626",
  text: "#0c1e5b",
  muted: "#657298",
};

// ── Tiny helpers ─────────────────────────────────────────────────────────────
const cx = (...cls) => cls.filter(Boolean).join(" ");

function StatusIcon({ ok, blocked }) {
  const Icon = ok ? CircleCheck : blocked ? Ban : CircleX;
  return <Icon size={14} color={ok ? C.green : blocked ? C.yellow : C.red} className="wt-inline-icon" aria-hidden="true" />;
}

function useInterval(cb, delay) {
  const saved = useRef(cb);

  useEffect(() => {
    saved.current = cb;
  }, [cb]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ── Reusable Copy Button ─────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (error) {
        console.error(error);
      } finally {
        textArea.remove();
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className="btn"
      style={{
        padding: "4px 10px",
        fontSize: 12,
        border: `1px solid ${C.border}`,
        minWidth: "64px",
      }}
      onClick={handleCopy}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Global CSS injected once ──────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(260%); } }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(8px); } to { opacity:1; transform:translateX(0); } }
  @keyframes wtPulse { 50% { box-shadow: 0 0 0 6px rgba(12,30,91,.06); } }

  .wt {
    --wt-canvas:transparent; --wt-card:#ffffff; --wt-border:#e3e7f1; --wt-border-strong:#c5cce0; --wt-hairline:#eef1f7;
    --wt-text:#0c1e5b; --wt-body:#33416e; --wt-muted:#657298; --wt-subtle:#949fbf;
    --wt-brand:#f97316; --wt-brand-600:#ea580c; --wt-brand-50:#fff7ed; --wt-brand-100:#ffedd5;
    --wt-info:#0c1e5b; --wt-info-50:#eef1f8; --wt-ok:#059669; --wt-ok-50:#ecfdf5;
    --wt-warn:#b45309; --wt-warn-50:#fffbeb; --wt-bad:#dc2626; --wt-bad-50:#fef2f2;
    --wt-shadow: 0 1px 2px rgba(12,30,91,.04), 0 8px 24px -12px rgba(12,30,91,.12);
    --wt-shadow-lg: 0 20px 45px -20px rgba(12,30,91,.28);
    min-height: 100%;
    background: var(--wt-canvas); color: var(--wt-text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased;
    border-radius: 16px;
  }
  .wt *, .wt *::before, .wt *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .wt ::-webkit-scrollbar { width: 8px; height: 8px; }
  .wt ::-webkit-scrollbar-track { background: transparent; }
  .wt ::-webkit-scrollbar-thumb { background: #c5cce0; border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
  .wt ::-webkit-scrollbar-thumb:hover { background-color: #949fbf; }
  .wt :focus-visible { outline: 2px solid var(--wt-brand); outline-offset: 2px; }

  .wt .fade-up { animation: fadeUp .35s cubic-bezier(.16,1,.3,1) both; }
  .wt .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
  .wt .wt-inline-icon { vertical-align: -2px; flex-shrink: 0; }

  /* Page shell */
  .wt-shell { max-width: 1320px; margin: 0 auto; padding: 20px 20px 48px; display: flex; flex-direction: column; gap: 20px; }
  .wt-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .wt-title { display: flex; align-items: center; gap: 12px; font-size: 24px; font-weight: 700; letter-spacing: -.02em; color: var(--wt-text); line-height: 1.2; }
  .wt-title-icon { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center;
    background: var(--wt-brand-50); border: 1px solid var(--wt-brand-100); color: var(--wt-brand); flex-shrink: 0; }
  .wt .wt-sub { margin-top: 6px; color: var(--wt-muted); font-size: 14px; max-width: 64ch; }
  .wt-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .wt-chip { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 999px;
    background: #fff; border: 1px solid var(--wt-border); font-size: 13px; font-weight: 500; color: var(--wt-body);
    max-width: 340px; box-shadow: var(--wt-shadow); white-space: nowrap; }
  .wt-chip strong { font-weight: 650; color: var(--wt-text); }
  .wt-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .wt-dot { width: 8px; height: 8px; border-radius: 50%; background: #c5cce0; flex-shrink: 0; }
  .wt-dot.on { background: var(--wt-ok); box-shadow: 0 0 0 3px rgba(5,150,105,.15); }
  .wt-dot.busy { background: var(--wt-info); box-shadow: 0 0 0 3px rgba(12,30,91,.18); animation: wtPulse 1.6s ease-in-out infinite; }

  /* Stepper */
  .wt-stepper { display: grid; grid-template-columns: repeat(4, minmax(150px, 1fr)); gap: 4px; background: #fff;
    border: 1px solid var(--wt-border); border-radius: 14px; padding: 6px; box-shadow: var(--wt-shadow); overflow-x: auto; }
  .wt-step { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; border: none;
    background: transparent; cursor: pointer; text-align: left; font-family: inherit; color: var(--wt-muted); transition: background .15s; }
  .wt-step:hover:not(:disabled) { background: var(--wt-surface, #f6f7fb); }
  .wt-step:disabled { cursor: not-allowed; opacity: .5; }
  .wt-step.active { background: var(--wt-brand-50); color: var(--wt-text); box-shadow: inset 0 0 0 1px var(--wt-brand-100); }
  .wt-step-num { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; flex-shrink: 0;
    font-size: 12.5px; font-weight: 650; border: 1px solid var(--wt-border-strong); background: #fff; color: var(--wt-muted); }
  .wt-step.active .wt-step-num { background: var(--wt-brand); border-color: var(--wt-brand); color: #fff; }
  .wt-step.done .wt-step-num { background: var(--wt-ok-50); border-color: #a7f3d0; color: var(--wt-ok); }
  .wt-step-label { display: block; font-size: 13.5px; font-weight: 650; color: inherit; line-height: 1.2; }
  .wt-step.active .wt-step-label { color: var(--wt-text); }
  .wt-step-hint { display: block; font-size: 12px; color: var(--wt-subtle); line-height: 1.3; margin-top: 2px; }

  /* Callouts */
  .wt-callout { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; border: 1px solid; font-size: 13.5px; line-height: 1.5; }
  .wt-callout.warn { background: var(--wt-warn-50); border-color: #fde68a; color: #92400e; }
  .wt-callout.info { background: var(--wt-info-50); border-color: #bcc6e0; color: #3730a3; }
  .wt-callout.ok { background: var(--wt-ok-50); border-color: #a7f3d0; color: #065f46; }
  .wt-callout-title { font-weight: 650; margin-bottom: 2px; }
  .wt-callout > svg { flex-shrink: 0; margin-top: 2px; }

  /* Connect screen */
  .wt-connect { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 20px; align-items: start; }
  .wt-form { display: flex; flex-direction: column; gap: 22px; }
  .wt-sticky { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .wt-section { display: flex; flex-direction: column; gap: 14px; }
  .wt-section + .wt-section { padding-top: 20px; border-top: 1px solid var(--wt-hairline); }
  .wt-section-head { display: flex; align-items: flex-start; gap: 10px; }
  .wt-section-icon { width: 30px; height: 30px; border-radius: 9px; background: #eef1f7; color: #4a5781; display: grid; place-items: center; flex-shrink: 0; }
  .wt-section-title { font-size: 14.5px; font-weight: 650; color: var(--wt-text); line-height: 1.3; }
  .wt-section-desc { font-size: 12.5px; color: var(--wt-muted); margin-top: 1px; }
  .wt-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .wt-hint { font-size: 12px; color: var(--wt-muted); margin-top: 6px; }
  .wt-opt { color: var(--wt-subtle); font-weight: 500; }
  .wt-req { color: var(--wt-bad); }
  .wt-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #eef1f7; padding: 4px; border-radius: 11px; }
  .wt-seg button { display: flex; align-items: center; justify-content: center; gap: 8px; height: 36px; border-radius: 8px; border: none;
    background: transparent; color: var(--wt-muted); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
  .wt-seg button:hover:not(:disabled):not(.active) { color: var(--wt-text); }
  .wt-seg button.active { background: #fff; color: var(--wt-text); box-shadow: 0 1px 2px rgba(12,30,91,.08), 0 0 0 1px var(--wt-border); }
  .wt-seg button:disabled { cursor: not-allowed; }
  .wt-modes { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .wt-mode { position: relative; display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 12px; border-radius: 12px;
    border: 1px solid var(--wt-border); background: #fff; cursor: pointer; font-family: inherit; transition: border-color .15s, box-shadow .15s, background .15s; }
  .wt-mode:hover:not(:disabled) { border-color: var(--wt-border-strong); box-shadow: var(--wt-shadow); }
  .wt-mode.active { border-color: var(--wt-brand); background: var(--wt-brand-50); box-shadow: 0 0 0 3px var(--wt-brand-100); }
  .wt-mode:disabled { cursor: not-allowed; opacity: .6; }
  .wt-mode-top { display: flex; align-items: center; gap: 8px; padding-right: 20px; }
  .wt-mode-icon { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: #eef1f7; color: #4a5781; flex-shrink: 0; }
  .wt-mode.active .wt-mode-icon { background: #fff; color: var(--wt-brand); }
  .wt-mode-name { font-size: 13.5px; font-weight: 650; color: var(--wt-text); }
  .wt-mode-desc { font-size: 12px; color: var(--wt-muted); line-height: 1.45; }
  .wt-mode-check { position: absolute; top: 12px; right: 12px; color: var(--wt-brand); }
  .wt .wt-cta { width: 100%; min-height: 44px; font-size: 14.5px; }
  .wt-panel-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 650; color: var(--wt-text); }

  /* Buttons */
  .wt .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 38px; padding: 8px 14px;
    border-radius: 9px; border: 1px solid var(--wt-border); background: #fff; color: var(--wt-text);
    font-family: inherit; font-size: 13.5px; font-weight: 550; line-height: 1.2; cursor: pointer; white-space: nowrap;
    box-shadow: 0 1px 2px rgba(12,30,91,.05); transition: background .15s, border-color .15s, box-shadow .15s, color .15s; }
  .wt .btn:hover:not(:disabled) { background: #f6f7fb; border-color: var(--wt-border-strong); }
  .wt .btn:disabled { opacity: .55; cursor: not-allowed; }
  .wt .btn-primary { background: var(--wt-brand); border-color: var(--wt-brand); color: #fff;
    box-shadow: 0 1px 2px rgba(194,65,12,.25), inset 0 1px 0 rgba(255,255,255,.14); }
  .wt .btn-primary:hover:not(:disabled) { background: var(--wt-brand-600); border-color: var(--wt-brand-600); }
  .wt .btn-primary:disabled { background: #fdba74; border-color: #fdba74; opacity: 1; }
  .wt .btn-danger { background: #fff; color: var(--wt-bad); border-color: #fecaca; }
  .wt .btn-danger:hover:not(:disabled) { background: var(--wt-bad-50); border-color: #fca5a5; }

  /* Inputs */
  .wt .input { width: 100%; min-height: 40px; padding: 9px 12px; border-radius: 9px; background: #fff; border: 1px solid var(--wt-border);
    color: var(--wt-text); font-family: inherit; font-size: 14px; outline: none; transition: border-color .15s, box-shadow .15s; }
  .wt .input:hover:not(:disabled) { border-color: var(--wt-border-strong); }
  .wt .input:focus { border-color: var(--wt-brand); box-shadow: 0 0 0 3px var(--wt-brand-100); }
  .wt .input::placeholder { color: var(--wt-subtle); }
  .wt .input:disabled { background: #f6f7fb; color: var(--wt-muted); cursor: not-allowed; }
  .wt textarea.input { line-height: 1.55; }
  .wt .label { display: block; font-size: 13px; font-weight: 600; color: var(--wt-body); margin-bottom: 6px; }

  /* Badges */
  .wt .badge { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px;
    font-size: 11.5px; font-weight: 600; text-transform: capitalize; border: 1px solid transparent; white-space: nowrap; }
  .wt .badge-running { background: var(--wt-info-50); color: var(--wt-info); border-color: #bcc6e0; }
  .wt .badge-done { background: var(--wt-ok-50); color: var(--wt-ok); border-color: #a7f3d0; }
  .wt .badge-failed { background: var(--wt-bad-50); color: var(--wt-bad); border-color: #fecaca; }
  .wt .badge-idle { background: #eef1f7; color: var(--wt-muted); border-color: var(--wt-border); }

  /* Cards, stats, progress */
  .wt .card { background: #fff; border: 1px solid var(--wt-border); border-radius: 14px; padding: 22px; box-shadow: var(--wt-shadow); }
  .wt .divider { height: 1px; background: var(--wt-hairline); margin: 20px 0; }
  .wt .stat-row { display: flex; align-items: center; justify-content: space-between; }
  .wt .stat-val { font-size: 26px; font-weight: 700; color: var(--wt-text); letter-spacing: -.02em; line-height: 1.15; font-variant-numeric: tabular-nums; }
  .wt .stat-lbl { font-size: 12px; font-weight: 500; color: var(--wt-muted); margin-top: 4px; }
  .wt .progress-bar-track { height: 8px; background: #eef2f6; border-radius: 999px; overflow: hidden; }
  .wt .progress-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--wt-brand), #fb923c); transition: width .4s cubic-bezier(.4,0,.2,1); }

  /* Phase headings */
  .wt .phase-header { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--wt-brand); margin-bottom: 6px; }
  .wt .phase-title { font-size: 21px; font-weight: 700; color: var(--wt-text); line-height: 1.25; letter-spacing: -.015em; }

  /* Segmented toggles and tabs (older screens) */
  .wt .toggle-group { display: flex; background: #eef1f7; border-radius: 11px; padding: 4px; flex-wrap: wrap; gap: 4px; }
  .wt .toggle-opt { flex: 1; min-width: 120px; padding: 8px 12px; text-align: center; cursor: pointer; font-family: inherit;
    font-size: 13px; font-weight: 600; transition: all .15s; color: var(--wt-muted); border: none; background: transparent; border-radius: 8px; }
  .wt .toggle-opt.active { background: #fff; color: var(--wt-text); box-shadow: 0 1px 2px rgba(12,30,91,.08), 0 0 0 1px var(--wt-border); }
  .wt .toggle-opt:not(.active):hover { color: var(--wt-text); }
  .wt .nav-tab { padding: 10px 14px; font-family: inherit; font-size: 13px; font-weight: 600; border: none; background: transparent;
    cursor: pointer; border-bottom: 2px solid transparent; color: var(--wt-muted); transition: all .15s; }
  .wt .nav-tab.active { color: var(--wt-text); border-bottom-color: var(--wt-brand); }
  .wt .nav-tab:disabled { opacity: .45; cursor: not-allowed; }

  /* Live browser */
  .wt-screen { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
  .wt .screen-wrap { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--wt-border); background: #fff;
    aspect-ratio: 16 / 10; display: flex; flex-direction: column; box-shadow: var(--wt-shadow); }
  .wt .browser-chrome { height: 36px; background: #f6f7fb; border-bottom: 1px solid var(--wt-border); display: flex; align-items: center; padding: 0 12px; gap: 6px; flex-shrink: 0; }
  .wt .browser-dot { width: 10px; height: 10px; border-radius: 50%; background: #dfe4ef; flex-shrink: 0; }
  .wt .browser-dot:nth-child(1) { background: #f87171; }
  .wt .browser-dot:nth-child(2) { background: #fbbf24; }
  .wt .browser-dot:nth-child(3) { background: #34d399; }
  .wt .browser-url { margin-left: 10px; flex: 1; min-width: 0; height: 22px; border-radius: 6px; background: #fff; border: 1px solid var(--wt-border);
    display: flex; align-items: center; padding: 0 10px; font-size: 11.5px; color: var(--wt-muted); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .wt .screen-wrap img { width: 100%; flex: 1; min-height: 0; object-fit: contain; display: block; background: #fff; }
  .wt .screen-placeholder { flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px;
    color: var(--wt-muted); font-size: 13px; text-align: center; padding: 0 24px; background: radial-gradient(circle at 50% 38%, #fff7ed 0, #fff 62%); }
  .wt .screen-placeholder svg { color: #fdba74; }
  .wt .scan-line { position: absolute; top: 36px; left: 0; right: 0; height: 40%; pointer-events: none;
    background: linear-gradient(to bottom, transparent, rgba(234,88,12,.07)); animation: scan 2.6s ease-in-out infinite; }

  /* Activity console */
  .wt-console { border-radius: 12px; overflow: hidden; border: 1px solid #1f2d60; background: #0b1020; box-shadow: var(--wt-shadow); min-width: 0; }
  .wt-console-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid #1f2d60;
    color: #c5cce0; font-size: 12.5px; font-weight: 600; }
  .wt-console-count { margin-left: auto; font-weight: 500; color: #657298; font-variant-numeric: tabular-nums; }
  .wt .terminal-container { background: #0b1020; padding: 12px 16px; font-family: 'JetBrains Mono', ui-monospace, monospace; color: #dfe4ef; }
  .wt .wt-console .terminal-container { border: none; border-radius: 0; }
  .wt .log-line { font-size: 12.5px; line-height: 1.7; padding: 1px 0; white-space: pre-wrap; word-break: break-word; }
  .wt .log-num { color: #4a5781; margin-right: 12px; user-select: none; }
  .wt .log-cyan { color: #7dd3fc; }
  .wt .log-green { color: #6ee7b7; }
  .wt .log-yellow { color: #fcd34d; }
  .wt .log-red { color: #fca5a5; }
  .wt .log-white { color: #dfe4ef; }

  /* Report pill, spinner, list rows */
  .wt .excel-pill { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 999px;
    background: #fff; color: var(--wt-text); border: 1px solid var(--wt-border); font-family: inherit; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s; animation: slideIn .35s cubic-bezier(.16,1,.3,1) both; white-space: nowrap; box-shadow: var(--wt-shadow); }
  .wt .excel-pill:hover { background: #f6f7fb; border-color: var(--wt-border-strong); }
  .wt .spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(100,116,139,.25); border-top-color: currentColor;
    animation: spin .6s linear infinite; display: inline-block; flex-shrink: 0; }
  .wt .test-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; border: 1px solid var(--wt-border); background: #fff; transition: all .15s; }
  .wt .test-item.active { border-color: var(--wt-brand); background: var(--wt-brand-50); }

  /* Terminate overlay */
  .wt .terminate-overlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; padding: 16px;
    background: rgba(12,30,91,.55); backdrop-filter: blur(6px); }
  .wt .terminate-card { background: #fff; border-radius: 16px; padding: 28px 32px; text-align: center; box-shadow: var(--wt-shadow-lg); max-width: 380px; width: 100%; }
  .wt .terminate-card h2 { font-size: 18px; font-weight: 700; margin-top: 16px; color: var(--wt-text); }
  .wt .terminate-card p { font-size: 13.5px; color: var(--wt-muted); margin-top: 6px; }
  .wt .terminate-spinner { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto; background: var(--wt-bad-50); color: var(--wt-bad); display: grid; place-items: center; }
  .wt .terminate-icon { animation: spin 1.4s linear infinite; }

  /* Realtime flow */
  @keyframes wtFlowStripes { from { background-position: 0 0; } to { background-position: 32px 0; } }
  @keyframes wtBreath { 0%, 100% { box-shadow: 0 0 0 0 rgba(234,88,12,.26), 0 6px 16px -6px rgba(234,88,12,.5); }
    50% { box-shadow: 0 0 0 7px rgba(234,88,12,0), 0 6px 16px -6px rgba(234,88,12,.5); } }
  @keyframes wtPop { 0% { transform: scale(.6); opacity: .4; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
  @keyframes wtSweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
  @keyframes wtRing { 0% { box-shadow: 0 0 0 0 rgba(234,88,12,.35); } 70% { box-shadow: 0 0 0 9px rgba(234,88,12,0); } 100% { box-shadow: 0 0 0 0 rgba(234,88,12,0); } }
  .wt .wt-spin { animation: spin .9s linear infinite; }
  .wt-flow { display: flex; align-items: center; background: #fff; border: 1px solid var(--wt-border); border-radius: 14px;
    padding: 10px 14px; box-shadow: var(--wt-shadow); overflow-x: auto; }
  .wt-flow-step { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border: none; background: transparent; border-radius: 10px;
    font-family: inherit; text-align: left; color: var(--wt-muted); cursor: pointer; flex-shrink: 0; transition: background .15s, transform .2s; }
  .wt-flow-step:hover:not(:disabled) { transform: translateY(-1px); }
  .wt-flow-step:disabled { cursor: default; }
  .wt-flow-step:hover:not(:disabled) { background: #f6f7fb; }
  .wt-flow-icon { width: 34px; height: 34px; border-radius: 999px; display: grid; place-items: center; background: #eef1f7;
    color: var(--wt-subtle); border: 1px solid var(--wt-border); flex-shrink: 0; transition: background .25s, color .25s, border-color .25s; }
  .wt-flow-step.active .wt-flow-icon { background: var(--wt-brand); border-color: var(--wt-brand); color: #fff;
    animation: wtBreath 2.6s ease-in-out infinite; }
  .wt-flow-step.live .wt-flow-icon { animation: wtRing 1.8s ease-out infinite; }
  .wt-flow-step.done .wt-flow-icon { background: var(--wt-ok-50); border-color: #a7f3d0; color: var(--wt-ok);
    animation: wtPop .45s cubic-bezier(.34,1.56,.64,1) both; }
  .wt-flow-label { display: block; font-size: 13.5px; font-weight: 650; line-height: 1.2; color: var(--wt-muted); }
  .wt-flow-step.active .wt-flow-label, .wt-flow-step.done .wt-flow-label { color: var(--wt-text); }
  .wt-flow-hint { display: block; font-size: 12px; color: var(--wt-subtle); margin-top: 2px; white-space: nowrap; max-width: 220px;
    overflow: hidden; text-overflow: ellipsis; }
  .wt-flow-step.live .wt-flow-hint { color: var(--wt-brand); font-weight: 550; }
  .wt-flow-link { position: relative; flex: 1; min-width: 24px; height: 4px; margin: 0 8px; border-radius: 999px; background: #e9eef5; overflow: hidden; }
  .wt-flow-link-fill { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(90deg, #34d399, #10b981);
    transform: scaleX(0); transform-origin: left center; transition: transform .7s cubic-bezier(.65,0,.35,1); }
  .wt-flow-link.filled .wt-flow-link-fill { transform: scaleX(1); }
  .wt-flow-link.leading .wt-flow-link-fill { background: linear-gradient(90deg, #34d399, var(--wt-brand)); }
  .wt-flow-link.leading::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent); animation: wtSweep 2.4s cubic-bezier(.4,0,.2,1) infinite; }
  .wt-flow-link.live .wt-flow-link-fill { background: repeating-linear-gradient(90deg, var(--wt-brand) 0 10px, #fdba74 10px 16px);
    background-size: 32px 4px; animation: wtFlowStripes .7s linear infinite; }
  @media (prefers-reduced-motion: reduce) {
    .wt-flow *, .wt-flow *::after, .wt-compose *, .wt-compose *::after { animation: none !important; transition: none !important; }
  }

  /* Signed-in session bar */
  .wt-session { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: #fff;
    border: 1px solid var(--wt-border); box-shadow: var(--wt-shadow); flex-wrap: wrap; }
  .wt-session-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--wt-ok-50); color: var(--wt-ok); flex-shrink: 0; }
  .wt-session-body { flex: 1; min-width: 200px; }
  .wt-session-title { font-size: 14px; font-weight: 650; color: var(--wt-text); }
  .wt-session-desc { font-size: 12.5px; color: var(--wt-muted); }
  .wt-session-icon.busy { background: var(--wt-brand-50); color: var(--wt-brand); }
  .wt-signing { display: flex; flex-direction: column; gap: 16px; }
  .wt .wt-signin-status { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 14px 18px; }

  /* Reports */
  .wt-reports { display: flex; flex-direction: column; gap: 14px; }
  .wt-reports-head { display: flex; align-items: flex-start; gap: 10px; }
  .wt-report-list { display: flex; flex-direction: column; gap: 8px; }
  .wt-report { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--wt-border); border-radius: 12px;
    background: #fff; flex-wrap: wrap; animation: slideIn .35s cubic-bezier(.16,1,.3,1) both; transition: border-color .15s, box-shadow .15s; }
  .wt-report:hover { border-color: var(--wt-border-strong); box-shadow: var(--wt-shadow); }
  .wt-report-icon { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: var(--wt-ok-50); color: var(--wt-ok); flex-shrink: 0; }
  .wt-report-body { flex: 1; min-width: 180px; }
  .wt-report-title { font-size: 14px; font-weight: 650; color: var(--wt-text); }
  .wt-report-headline { font-weight: 500; color: var(--wt-body); }
  .wt-report-meta { font-size: 12.5px; color: var(--wt-muted); margin-top: 2px; }
  .wt-report-chips { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .wt-mini { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; font-size: 11.5px; font-weight: 650;
    border: 1px solid var(--wt-border); color: var(--wt-muted); background: #eef1f7; white-space: nowrap; }
  .wt-mini.ok { color: var(--wt-ok); background: var(--wt-ok-50); border-color: #a7f3d0; }
  .wt-mini.bad { color: var(--wt-bad); background: var(--wt-bad-50); border-color: #fecaca; }
  .wt-mini.warn { color: var(--wt-warn); background: var(--wt-warn-50); border-color: #fde68a; }

  /* Scenario composer */
  @keyframes wtShimmer { to { background-position: -200% 0; } }
  @keyframes wtDot { 0%, 80%, 100% { opacity: .25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
  .wt-compose { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(300px, 1fr); gap: 16px; align-items: start; }
  .wt-compose-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .wt-compose-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .wt-seg.wt-seg-inline { display: inline-grid; grid-template-columns: auto auto; }
  .wt-seg.wt-seg-inline button { padding: 0 14px; }
  .wt-compose-tools { display: flex; gap: 6px; flex-wrap: wrap; }
  .wt .btn-ghost { border-color: transparent; box-shadow: none; background: transparent; color: var(--wt-body); }
  .wt .btn-ghost:hover:not(:disabled) { background: #eef1f7; border-color: transparent; }
  .wt-assist { display: flex; flex-direction: column; gap: 12px; }
  .wt .wt-brief { min-height: 160px; resize: vertical; font-size: 14px; line-height: 1.6; }
  .wt-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .wt-chip-btn { border: 1px solid var(--wt-border); background: #fff; color: var(--wt-body); border-radius: 999px; padding: 5px 11px;
    font-family: inherit; font-size: 12.5px; cursor: pointer; transition: border-color .15s, color .15s, background .15s; text-align: left; }
  .wt-chip-btn:hover:not(:disabled) { border-color: var(--wt-brand); color: var(--wt-brand); background: var(--wt-brand-50); }
  .wt-chip-btn:disabled { opacity: .5; cursor: not-allowed; }
  .wt-chip-btn.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; border-radius: 8px; }
  .wt-drop { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1.5px dashed var(--wt-border-strong); border-radius: 12px;
    background: #fafbfc; color: var(--wt-muted); cursor: pointer; transition: border-color .15s, background .15s, color .15s; }
  .wt-drop:hover, .wt-drop.over { border-color: var(--wt-brand); background: var(--wt-brand-50); color: var(--wt-brand); }
  .wt-drop-title { font-size: 13.5px; font-weight: 650; color: var(--wt-text); }
  .wt-drop-desc { font-size: 12.5px; color: var(--wt-muted); }
  .wt-thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .wt-thumb { position: relative; aspect-ratio: 4 / 3; border-radius: 10px; overflow: hidden; border: 1px solid var(--wt-border);
    background: #f6f7fb; animation: wtPop .35s cubic-bezier(.34,1.56,.64,1) both; }
  .wt-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wt-thumb-x { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 999px; border: none; display: grid;
    place-items: center; background: rgba(12,30,91,.72); color: #fff; cursor: pointer; }
  .wt-editor-wrap { display: flex; flex-direction: column; gap: 10px; }
  .wt-insert { display: flex; flex-wrap: wrap; gap: 6px; }
  .wt-editor { display: flex; border: 1px solid #1f2d60; border-radius: 12px; overflow: hidden; background: #0b1020; height: clamp(360px, 52vh, 620px); }
  .wt-editor:focus-within { border-color: var(--wt-brand); box-shadow: 0 0 0 3px var(--wt-brand-100); }
  .wt .wt-gutter { margin: 0; padding: 12px 10px; min-width: 46px; text-align: right; color: #4a5781; background: #0d1326;
    font: 12.5px/1.6 'JetBrains Mono', ui-monospace, monospace; overflow: hidden; user-select: none; white-space: pre; }
  .wt .wt-code { flex: 1; min-width: 0; border: none; outline: none; resize: none; padding: 12px 14px; background: transparent; color: #dfe4ef;
    font: 12.5px/1.6 'JetBrains Mono', ui-monospace, monospace; white-space: pre; overflow: auto; tab-size: 2; }
  .wt .wt-code::placeholder { color: #4a5781; }
  .wt-guide { border: 1px solid var(--wt-border); border-radius: 10px; padding: 10px 14px; background: #fafbfc; font-size: 13px; color: var(--wt-body); }
  .wt-guide summary { cursor: pointer; font-weight: 600; color: var(--wt-text); }
  .wt .wt-guide ul { margin: 8px 0 0 18px; display: flex; flex-direction: column; gap: 4px; }
  .wt-guide code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; background: #eef1f7; padding: 1px 5px; border-radius: 5px; }
  .wt .wt-preview { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 12px; padding: 18px; max-height: calc(100vh - 140px); min-width: 0; }
  .wt-preview-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .wt-preview-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; min-height: 120px; padding-right: 2px; }
  .wt-preview-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 12px; color: var(--wt-subtle);
    font-size: 13px; border: 1.5px dashed var(--wt-border); border-radius: 12px; text-align: center; }
  .wt-sc { border: 1px solid var(--wt-border); border-left: 3px solid var(--wt-ok); border-radius: 10px; padding: 10px 12px; background: #fff;
    animation: slideIn .3s cubic-bezier(.16,1,.3,1) both; }
  .wt-sc.warn { border-left-color: #d97706; }
  .wt-sc-title { font-size: 13.5px; font-weight: 650; color: var(--wt-text); line-height: 1.35; }
  .wt-sc-meta { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: var(--wt-muted); margin-top: 3px; }
  .wt-sc-warn { font-size: 12px; color: var(--wt-warn); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  .wt-sc-check { font-size: 12px; color: var(--wt-body); margin-top: 6px; display: flex; gap: 6px; align-items: flex-start; line-height: 1.45; }
  .wt-sc-check svg { color: var(--wt-ok); margin-top: 2px; flex-shrink: 0; }
  .wt-sc.skeleton { display: flex; align-items: center; gap: 10px; border-left-color: var(--wt-brand); font-size: 12.5px; color: var(--wt-brand);
    background: linear-gradient(90deg, #fff 0%, #fff7ed 50%, #fff 100%); background-size: 200% 100%; animation: wtShimmer 1.4s linear infinite; }
  .wt-typing { display: inline-flex; gap: 4px; }
  .wt-typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--wt-brand); animation: wtDot 1s ease-in-out infinite; }
  .wt-typing i:nth-child(2) { animation-delay: .15s; }
  .wt-typing i:nth-child(3) { animation-delay: .3s; }
  .wt .wt-runbar { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 14px 18px; position: sticky; bottom: 12px; z-index: 5; box-shadow: var(--wt-shadow-lg); }
  .wt-switch { position: relative; display: flex; align-items: flex-start; gap: 12px; cursor: pointer; flex: 1; min-width: 260px; font-size: 13.5px; color: var(--wt-text); }
  .wt-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .wt-switch-track { position: relative; width: 38px; height: 22px; border-radius: 999px; background: #c5cce0; flex-shrink: 0; margin-top: 1px; transition: background .2s; }
  .wt-switch-thumb { position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff;
    box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
  .wt-switch.on .wt-switch-track { background: var(--wt-brand); }
  .wt-switch.on .wt-switch-thumb { transform: translateX(16px); }
  .wt-switch input:focus-visible + .wt-switch-track { outline: 2px solid var(--wt-brand); outline-offset: 2px; }
  .wt-switch-desc { display: block; font-size: 12.5px; color: var(--wt-muted); font-weight: 400; margin-top: 2px; }
  .wt .wt-run { min-height: 44px; padding: 0 22px; font-size: 14.5px; }

  /* Activity timeline */
  .wt-activity { display: flex; flex-direction: column; border: 1px solid var(--wt-border); border-radius: 12px; background: #fff;
    box-shadow: var(--wt-shadow); min-width: 0; overflow: hidden; }
  .wt-activity-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--wt-hairline); flex-wrap: wrap; }
  .wt-activity-title { font-size: 13.5px; font-weight: 650; color: var(--wt-text); display: flex; align-items: center; gap: 8px; }
  .wt-activity-stats { display: flex; gap: 6px; margin-left: auto; flex-wrap: wrap; }
  .wt-seg.wt-seg-mini { display: inline-grid; grid-template-columns: auto auto; padding: 3px; }
  .wt-seg.wt-seg-mini button { height: 26px; padding: 0 10px; font-size: 12px; }
  .wt-activity-body { overflow-y: auto; padding: 12px 14px 16px; height: clamp(320px, 46vh, 560px); scroll-behavior: smooth; }
  .wt-activity-body.raw { background: #0b1020; font-family: 'JetBrains Mono', ui-monospace, monospace; }
  .wt-activity-empty { color: var(--wt-subtle); font-size: 13px; padding: 24px 4px; text-align: center; }
  .wt-tl-group { border: 1px solid var(--wt-border); border-radius: 12px; margin-bottom: 12px; overflow: hidden; animation: fadeUp .3s cubic-bezier(.16,1,.3,1) both; }
  .wt-tl-group-head { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: #f6f7fb; border-bottom: 1px solid var(--wt-hairline); }
  .wt-tl-group-title { flex: 1; min-width: 0; font-size: 13px; font-weight: 650; color: var(--wt-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wt-tl-group-sub { font-size: 11.5px; color: var(--wt-muted); white-space: nowrap; }
  .wt-tl-list { list-style: none; padding: 8px 12px 10px; position: relative; }
  .wt-tl-row { position: relative; display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 10px; padding: 5px 0; animation: slideIn .25s ease-out both; }
  .wt-tl-row::before { content: ""; position: absolute; left: 10px; top: 26px; bottom: -6px; width: 1.5px; background: var(--wt-hairline); }
  .wt-tl-row:last-child::before { display: none; }
  .wt-tl-dot { width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center; background: #eef1f7; color: var(--wt-muted); position: relative; z-index: 1; }
  .wt-tl-row.plan .wt-tl-dot { background: var(--wt-info-50); color: var(--wt-info); }
  .wt-tl-row.ok .wt-tl-dot { background: var(--wt-ok-50); color: var(--wt-ok); }
  .wt-tl-row.bad .wt-tl-dot { background: var(--wt-bad-50); color: var(--wt-bad); }
  .wt-tl-row.warn .wt-tl-dot { background: var(--wt-warn-50); color: var(--wt-warn); }
  .wt-tl-row.recover .wt-tl-dot { background: var(--wt-brand-50); color: var(--wt-brand); }
  .wt-tl-row.milestone .wt-tl-dot { background: var(--wt-text); color: #fff; }
  .wt-tl-label { font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--wt-subtle); }
  .wt-tl-row.plan .wt-tl-label { color: var(--wt-info); }
  .wt-tl-row.ok .wt-tl-label { color: var(--wt-ok); }
  .wt-tl-row.bad .wt-tl-label { color: var(--wt-bad); }
  .wt-tl-row.warn .wt-tl-label { color: var(--wt-warn); }
  .wt-tl-row.recover .wt-tl-label { color: var(--wt-brand); }
  .wt-tl-text { font-size: 13px; color: var(--wt-text); line-height: 1.5; word-break: break-word; }
  .wt-tl-why { font-size: 12px; color: var(--wt-muted); line-height: 1.45; margin-top: 1px; word-break: break-word; }
  .wt-tl-plan { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
  .wt-tl-plan span { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: var(--wt-info-50); color: #3730a3; border: 1px solid #dde3f0; }
  .wt-tl-verdict { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; }
  .wt-tl-verdict.PASSED { background: var(--wt-ok-50); color: var(--wt-ok); }
  .wt-tl-verdict.FAILED { background: var(--wt-bad-50); color: var(--wt-bad); }
  .wt-tl-verdict.BLOCKED { background: var(--wt-warn-50); color: var(--wt-warn); }
  .wt-tl-verdict.RUNNING { background: var(--wt-info-50); color: var(--wt-info); }
  .wt-tl-loose { padding: 2px 0 8px; }
  .wt-workspace > .wt-activity { min-height: 0; }
  .wt-workspace > .wt-activity .wt-activity-body { flex: 1 1 0; min-height: 0; height: auto; }

  /* Guided scenarios: live strip and side-by-side workspace */
  .wt-live { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 12px 16px; border-radius: 14px; background: #fff;
    border: 1px solid var(--wt-border); box-shadow: var(--wt-shadow); }
  .wt-live-main { flex: 1; min-width: 220px; }
  .wt-live-kicker { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--wt-brand); }
  .wt-live-title { font-size: 14.5px; font-weight: 650; color: var(--wt-text); margin-top: 2px; }
  .wt-live-step { font-size: 12.5px; color: var(--wt-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wt-live-track { flex-basis: 100%; height: 6px; border-radius: 999px; background: #eef2f6; overflow: hidden; }
  .wt-live-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--wt-brand), #fb923c); transition: width .5s cubic-bezier(.4,0,.2,1); }
  .wt-workspace { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 16px; align-items: stretch; }
  .wt-workspace > .wt-console { display: flex; flex-direction: column; min-height: 0; }
  .wt-workspace > .wt-console .terminal-container { flex: 1 1 0; min-height: 0; height: auto !important; }

  @media (max-width: 1180px) {
    .wt-connect { grid-template-columns: 1fr; }
    .wt-sticky { position: static; }
    .wt-workspace { grid-template-columns: 1fr; }
    .wt-workspace > .wt-console .terminal-container { flex: none; height: 380px !important; }
    .wt-workspace > .wt-activity .wt-activity-body { flex: none; height: 420px; }
    .wt-compose { grid-template-columns: 1fr; }
    .wt .wt-preview { position: static; max-height: none; }
  }
  .wt { overflow-x: clip; }
  .wt-shell, .wt-connect > *, .wt-form, .wt-section { min-width: 0; }
  .wt input, .wt textarea, .wt select { max-width: 100%; }
  @media (max-width: 900px) {
    .wt-stepper { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: minmax(170px, 1fr); }
    .wt-actions { width: 100%; }
  }
  @media (max-width: 640px) {
    .wt { border-radius: 12px; }
    .wt-shell { padding: 12px 10px 32px; gap: 16px; }
    .wt-row2 { grid-template-columns: 1fr; }
    .wt-title { font-size: 20px; }
    .wt-title-icon { width: 32px; height: 32px; }
    .wt-actions { gap: 6px; }
    .wt-chip { max-width: 100%; height: 32px; font-size: 12.5px; }
    .wt-stepper { grid-auto-columns: minmax(132px, 1fr); }
    .wt-step-hint { display: none; }
    .wt-flow-hint { display: none; }
    .wt-seg { grid-template-columns: 1fr; }
    .wt-modes { grid-template-columns: 1fr; }
    .wt .card { padding: 16px; }
    .wt .phase-title { font-size: 18px; }
  }
`;

// ── Live Screenshot panel ─────────────────────────────────────────────────────
function ScreenPanel({ src, label, scanning = true, url }) {
  return (
    <div className="wt-screen">
      {label && (
        <div className="label" style={{ margin: 0 }}>
          {label}
        </div>
      )}
      <div className="screen-wrap">
        <div className="browser-chrome">
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="browser-dot" />
          <span className="browser-url">{url || "about:blank"}</span>
        </div>
        {src ? (
          <img src={src} alt="Live view of the agent's browser" />
        ) : (
          <div className="screen-placeholder">
            <MonitorPlay size={30} strokeWidth={1.5} />
            <span>
              {scanning
                ? "Starting the browser…"
                : "The agent's browser appears here once a session starts."}
            </span>
          </div>
        )}
        {scanning && <div className="scan-line" />}
      </div>
    </div>
  );
}

// ── Log panel ─────────────────────────────────────────────────────────────────
function LogPanel({ logs }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="wt-console">
      <div className="wt-console-head">
        <span className={cx("wt-dot", logs.length > 0 && "on")} />
        Activity log
        <span className="wt-console-count">
          {logs.length} {logs.length === 1 ? "line" : "lines"}
        </span>
      </div>
      <div
        ref={ref}
        className="terminal-container"
        style={{ height: "clamp(320px, 46vh, 560px)", overflowY: "auto" }}
        aria-live="polite"
      >
        {logs.length === 0 ? (
          <div style={{ color: "#657298", fontSize: 12.5 }}>
            Waiting for output
            <span
              className="font-mono"
              style={{ animation: "blink 1s step-end infinite" }}
            >
              _
            </span>
          </div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className={cx("log-line", `log-${l.color || "white"}`)}>
              <span className="log-num">{String(i + 1).padStart(3, "0")}</span>
              {l.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Reports: listed in the page with readable names ─────────────────────────
function siteHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url || "";
  }
}

function reportTitle(r) {
  const n = String(r.name || "").toLowerCase();
  if (r.kind === "scenarios" || n.startsWith("scenario_report")) return "Prompt testing report";
  if (n.includes("validation") || n.includes("batch")) return "Validation report";
  return "Standard checking report";
}

function downloadReport(r) {
  const link = document.createElement("a");
  if (r.urlOrB64.startsWith("http://") || r.urlOrB64.startsWith("https://")) {
    link.href = r.urlOrB64;
    link.target = "_blank";
  } else {
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${r.urlOrB64}`;
  }
  link.download = r.name;
  link.click();
}

function ReportsPanel({ reports }) {
  if (!reports || reports.length === 0) return null;
  return (
    <section className="card wt-reports fade-up" aria-label="Reports">
      <div className="wt-reports-head">
        <span className="wt-section-icon"><FileSpreadsheet size={16} /></span>
        <div>
          <div className="wt-section-title">Reports</div>
          <div className="wt-section-desc">Excel reports from this session, newest first.</div>
        </div>
      </div>
      <div className="wt-report-list">
        {[...reports].reverse().map((r, i) => {
          const t = r.totals || {};
          const when = r.at
            ? r.at.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "";
          const meta = [
            siteHost(r.site),
            when,
            r.count ? `${r.count} scenario${r.count === 1 ? "" : "s"}` : "",
          ].filter(Boolean).join(" · ");
          return (
            <div key={`${r.name}-${i}`} className="wt-report">
              <span className="wt-report-icon"><FileSpreadsheet size={18} /></span>
              <div className="wt-report-body">
                <div className="wt-report-title">
                  {reportTitle(r)}
                  {r.headline && <span className="wt-report-headline"> · {r.headline}</span>}
                </div>
                {meta && <div className="wt-report-meta">{meta}</div>}
              </div>
              <div className="wt-report-chips">
                {t.passed ? <span className="wt-mini ok">{t.passed} passed</span> : null}
                {t.failed ? <span className="wt-mini bad">{t.failed} failed</span> : null}
                {t.blocked ? <span className="wt-mini warn">{t.blocked} blocked</span> : null}
              </div>
              <button className="btn" onClick={() => downloadReport(r)} title="Download the Excel report">
                <Download size={15} /> Download
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Realtime flow (replaces the numbered step bar) ───────────────────────────
const FLOWS = {
  checking: [
    { id: "login", label: "Sign in", hint: "Site and account", Icon: LogIn },
    { id: "phase2", label: "Discover", hint: "Explore and write tests", Icon: Search },
    { id: "review", label: "Review", hint: "Confirm expected results", Icon: ListChecks },
    { id: "phase3", label: "Validate", hint: "Run the reviewed tests", Icon: ShieldCheck },
  ],
  scenarios: [
    { id: "login", label: "Sign in", hint: "Site and account", Icon: LogIn },
    { id: "write", label: "Scenarios", hint: "Write or draft them", Icon: PenLine },
    { id: "running", label: "Running", hint: "Live on the site", Icon: Activity },
    { id: "results", label: "Results", hint: "Pass/fail and report", Icon: Flag },
  ],
  direct: [
    { id: "login", label: "Sign in", hint: "Site and account", Icon: LogIn },
    { id: "phase2", label: "Prompt", hint: "Type and run one instruction", Icon: Zap },
  ],
};

function FlowTracker({ steps, activeId, busy, onSelect, isDisabled }) {
  const activeIndex = Math.max(0, steps.findIndex((s) => s.id === activeId));
  return (
    <nav className="wt-flow" aria-label="Test progress">
      {steps.map((s, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        const live = active && busy;
        const Icon = done ? Check : s.Icon;
        return (
          <Fragment key={s.id}>
            {i > 0 && (
              <span
                className={cx("wt-flow-link", (done || active) && "filled", active && "leading", live && "live")}
                aria-hidden="true"
              >
                <span className="wt-flow-link-fill" />
              </span>
            )}
            <button
              type="button"
              className={cx("wt-flow-step", active && "active", done && "done", live && "live")}
              onClick={() => onSelect(s.id)}
              disabled={isDisabled(s.id)}
              aria-current={active ? "step" : undefined}
              title={s.hint}
            >
              <span key={done ? "done" : active ? "active" : "todo"} className="wt-flow-icon">
                {live ? <LoaderCircle size={16} className="wt-spin" /> : <Icon size={16} />}
              </span>
              <span>
                <span className="wt-flow-label">{s.label}</span>
                <span className="wt-flow-hint">{live ? "In progress…" : s.hint}</span>
              </span>
            </button>
          </Fragment>
        );
      })}
    </nav>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 1 — Login
// ════════════════════════════════════════════════════════════════════════════
const TEST_MODES = [
  { id: "checking", name: "Standard checking", desc: "Crawls the site, writes test stories and an Excel report.", Icon: ScanSearch },
  { id: "scenarios", name: "Prompt testing", desc: "Runs your steps and checks, with a pass/fail report.", Icon: ClipboardList },
];

function PhaseLogin({ onDone, onStatusChange, onSessionCreated, initialMode }) {
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // Approver logins: some approvals land in another person's mailbox, so a
  // scenario can act as them -> "As <name>, approve the email for ..."
  const [approvers, setApprovers] = useState([]);
  const [apvName, setApvName] = useState("");
  const [apvEmail, setApvEmail] = useState("");
  const [apvPassword, setApvPassword] = useState("");
  const [apvOtp, setApvOtp] = useState("");
  const [apvStatus, setApvStatus] = useState("");
  const [apvBusy, setApvBusy] = useState(false);
  const [apvNeedOtp, setApvNeedOtp] = useState(false);
  const [apvLiveOtp, setApvLiveOtp] = useState("");
  const apvWsRef = useRef(null);
  const [targetUrl, setTargetUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");

  const { user } = useSelector((state) => state.profile);
  // const userId = "68e8de5e3691291828e4ac8e";
  const userId = user?._id;

  const [mode, setMode] = useState(initialMode || "checking");
  const goal = "";
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [screenshot, setScreenshot] = useState(null);
  const [needOtp, setNeedOtp] = useState(false);
  const [liveOtp, setLiveOtp] = useState("");
  const wsRef = useRef(null);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  const pushLog = (msg, color = "white") =>
    setLogs((p) => [...p, { message: msg, color }]);

  const loadApprovers = async () => {
    try {
      const r = await fetch(`${API}/approvers`);
      if (!r.ok) return;
      const d = await r.json();
      setApprovers(d.approvers || []);
    } catch {
      // the backend may not be running yet; the list just stays empty
    }
  };

  useEffect(() => {
    loadApprovers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addApprover = () => {
    const name = apvName.trim();
    if (!name || !apvEmail.trim() || apvBusy) return;
    if (!/^[A-Za-z0-9._-]{1,64}$/.test(name)) {
      setApvStatus("The name may only use letters, numbers, dot, dash or underscore.");
      return;
    }
    const url = (targetUrl || "").trim();
    const key = apiKey || anthropicApiKey;
    if (!url || !key) {
      setApvStatus(
        !url
          ? "Fill in the site address at the top of this form first."
          : "Add an AI key in the AI provider section first.",
      );
      return;
    }
    // A browser that auto-fills the password box does not tell React about it,
    // so fall back to what the input actually holds.
    const pwEl = typeof document !== "undefined"
      ? document.getElementById("wt-apv-password")
      : null;
    const pw = (apvPassword || (pwEl && pwEl.value) || "").trim();
    if (!pw) {
      setApvStatus(
        "Type their password in the box above. Sign-in cannot continue without it.",
      );
      return;
    }
    setApvBusy(true);
    setScreenshot(null);
    setApvNeedOtp(false);
    setApvStatus("Opening the browser and going to the sign-in page...");
    setLogs([]);
    pushLog("Signing in as " + name + " to save them as an approver", "cyan");
    const ws = new WebSocket(`${WS}/ws/login`);
    apvWsRef.current = ws;

    ws.onmessage = async (ev) => {
      const data = JSON.parse(ev.data);

      if (data.type === "connected") {
        ws.send(
          JSON.stringify({
            requires_auth: true,
            email: apvEmail,
            password: pw,
            otp: apvOtp || undefined,
            target_url: targetUrl,
            api_key: apiKey || undefined,
            anthropic_api_key: anthropicApiKey || undefined,
            // The engine reads the owner from this token, not from a
            // user_id the page asserts. A WebSocket cannot send an
            // Authorization header, so it travels in the handshake.
            token: getAuthToken(),
          }),
        );
        return;
      }

      if (data.type === "log") {
        setApvStatus(data.message);
        pushLog(data.message, data.color || "cyan");
        return;
      }

      if (data.type === "screenshot") {
        // the Live browser panel on the right is the one place to look
        setScreenshot(`data:image/png;base64,${data.data}`);
        return;
      }

      if (data.type === "input_needed" && data.field === "otp") {
        setApvNeedOtp(true);
        setApvStatus("The site is asking for a one-time code.");
        return;
      }

      if (data.type === "done") {
        try { ws.close(); } catch { /* already closed */ }
        try {
          const r = await fetch(`${API}/approvers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: data.session_id, name }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.detail || "could not save");
          setApvStatus("Saved. A scenario can now approve as " + name + ".");
          pushLog("Saved " + name + " - scenarios can now approve as them", "green");
          setApvName("");
          setApvEmail("");
          setApvPassword("");
          setApvOtp("");
          loadApprovers();
        } catch (e) {
          setApvStatus("Signed in, but could not save: " + e.message);
        }
        setApvBusy(false);
        setApvNeedOtp(false);
        return;
      }

      if (data.type === "error" || data.type === "cancelled") {
        setApvStatus("Sign-in failed: " + (data.message || "unknown reason"));
        pushLog("Sign-in failed: " + (data.message || "unknown reason"), "red");
        setApvBusy(false);
        try { ws.close(); } catch { /* already closed */ }
      }
    };

    ws.onerror = () => {
      setApvStatus("Could not reach the sign-in service.");
      setApvBusy(false);
    };
  };

  const sendApproverOtp = () => {
    if (!apvLiveOtp || !apvWsRef.current) return;
    apvWsRef.current.send(JSON.stringify({ otp: apvLiveOtp }));
    setApvStatus("Code sent - carrying on.");
    setApvNeedOtp(false);
    setApvLiveOtp("");
  };

  const cancelApproverSignIn = () => {
    try {
      if (apvWsRef.current) apvWsRef.current.close();
    } catch {
      // already closed
    }
    setApvBusy(false);
    setApvNeedOtp(false);
    setApvStatus("Sign-in stopped. Check the details and try again.");
  };

  const removeApprover = async (name) => {
    try {
      await fetch(`${API}/approvers/${encodeURIComponent(name)}`, { method: "DELETE" });
      loadApprovers();
    } catch {
      setApvStatus("Could not remove " + name + ".");
    }
  };

  const connect = () => {
    if ((requiresAuth && !email) || !targetUrl || (!apiKey && !anthropicApiKey)) return;

    setStatus("connecting");
    setLogs([]);
    setScreenshot(null);

    const ws = new WebSocket(`${WS}/ws/login`);
    wsRef.current = ws;

    ws.onopen = () => setStatus("running");

    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);

      if (data.session_id && onSessionCreated) {
        onSessionCreated(data.session_id);
      }

      if (data.type === "connected") {
        pushLog(data.message, "cyan");
        ws.send(
          JSON.stringify({
            requires_auth: requiresAuth,
            email: requiresAuth ? email : undefined,
            password: (requiresAuth && password) ? password : undefined,
            otp: (requiresAuth && otp) ? otp : undefined,
            target_url: targetUrl,
            api_key: apiKey || undefined,
            anthropic_api_key: anthropicApiKey || undefined,
            // The engine reads the owner from this token, not from a
            // user_id the page asserts. A WebSocket cannot send an
            // Authorization header, so it travels in the handshake.
            token: getAuthToken(),
          }),
        );
        return;
      }

      if (data.type === "log") {
        pushLog(data.message, data.color || "white");
        return;
      }
      if (data.type === "screenshot") {
        setScreenshot(`data:image/png;base64,${data.data}`);
        return;
      }
      if (data.type === "input_needed" && data.field === "otp") {
        setNeedOtp(true);
        return;
      }

      if (data.type === "done") {
        pushLog("✅ Login complete — auth.json saved", "green");
        setStatus("done");
        ws.close();
        setTimeout(
          () =>
            onDone(
              targetUrl,
              mode,
              apiKey,
              anthropicApiKey,
              goal,
              userId,
              data.session_id,
            ),
          800,
        );
        return;
      }

      if (data.type === "cancelled") {
        pushLog(`✗ ${data.message || "Sign-in was stopped"}`, "red");
        setStatus("error");
        return;
      }

      if (data.type === "error") {
        pushLog(`✗ ${data.message}`, "red");
        setStatus("error");
      }
    };

    ws.onerror = () => {
      pushLog("✗ Could not reach the sign-in service", "red");
      setStatus("error");
    };
    ws.onclose = () => {
      setStatus((st) => {
        if (st === "running" || st === "connecting") {
          pushLog("✗ The connection closed before sign-in finished", "red");
          return "error";
        }
        return st;
      });
    };
  };

  const cancelSignIn = () => {
    setNeedOtp(false);
    setStatus("idle");
    pushLog("Sign-in cancelled. Edit the details and start again.", "yellow");
    try {
      if (wsRef.current) wsRef.current.close();
    } catch {
      // already closed
    }
  };

  const sendOtp = () => {
    if (!liveOtp || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ otp: liveOtp }));
    pushLog(`OTP sent: ${liveOtp}`, "green");
    setNeedOtp(false);
    setLiveOtp("");
  };

  const busy = status === "running" || apvBusy;
  const signingIn = status === "connecting" || status === "running" || status === "done";
  const lastError = status === "error" ? [...logs].reverse().find((l) => l.color === "red")?.message : "";
  const modeName = (TEST_MODES.find((m) => m.id === mode) || {}).name;
  const statusLabel = apvBusy
    ? "Signing in as " + (apvName.trim() || "approver")
    : { idle: "Idle", connecting: "Connecting", running: "Running", done: "Signed in", error: "Error" }[status] || status;

  return (
    <div className={cx("fade-up", signingIn ? "wt-signing" : "wt-connect")}>
      {signingIn && (
        <div className="card wt-signin-status fade-up">
          <span className={cx("wt-session-icon", status !== "done" && "busy")}>
            {status === "done" ? <CircleCheck size={18} /> : <LoaderCircle size={18} className="wt-spin" />}
          </span>
          <div className="wt-session-body">
            <div className="wt-session-title">
              {status === "done" ? `Signed in to ${siteHost(targetUrl)}` : `Signing in to ${siteHost(targetUrl)}…`}
            </div>
            <div className="wt-session-desc">
              {[requiresAuth ? email : "Public site", modeName].filter(Boolean).join(" · ")}
            </div>
          </div>
          {status !== "done" && (
            <button className="btn" onClick={cancelSignIn} title="Stop signing in and edit the details">
              Cancel
            </button>
          )}
          {needOtp && (
            <div className="wt-callout warn fade-up" style={{ flexDirection: "column", gap: 10, flexBasis: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={15} />
                <span className="wt-callout-title" style={{ margin: 0 }}>
                  The site is asking for a one-time code
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <input
                  className="input"
                  placeholder="Enter code"
                  inputMode="numeric"
                  value={liveOtp}
                  onChange={(e) => setLiveOtp(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={sendOtp}>
                  Send code
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!signingIn && (
      <div className="card wt-form">
        <div>
          <div className="phase-header">
            <Plug size={14} /> Connect
          </div>
          <h2 className="phase-title">Sign in to the site you want to test</h2>
          <p className="wt-sub">
            The agent opens the site, signs in and streams its browser live.
          </p>
        </div>

        {status === "error" && (
          <div className="wt-callout warn fade-up" role="alert">
            <TriangleAlert size={16} />
            <div>
              <div className="wt-callout-title">Sign-in did not finish</div>
              {lastError ? String(lastError).replace(/^✗\s*/, "") : "Check the details and start the session again."}
            </div>
          </div>
        )}

        <section className="wt-section">
          <div className="wt-section-head">
            <span className="wt-section-icon"><Globe size={16} /></span>
            <div>
              <div className="wt-section-title">Site</div>
              <div className="wt-section-desc">Where the agent starts.</div>
            </div>
          </div>
          <div className="wt-seg" role="radiogroup" aria-label="Does the site need a sign-in?">
            <button
              type="button"
              role="radio"
              aria-checked={requiresAuth}
              className={cx(requiresAuth && "active")}
              onClick={() => setRequiresAuth(true)}
              disabled={busy}
            >
              <Lock size={14} /> Needs sign-in
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!requiresAuth}
              className={cx(!requiresAuth && "active")}
              onClick={() => setRequiresAuth(false)}
              disabled={busy}
            >
              <Globe size={14} /> Public site
            </button>
          </div>
          <div>
            <label className="label" htmlFor="wt-url">
              Start URL <span className="wt-req">*</span>
            </label>
            <input
              id="wt-url"
              className="input"
              type="url"
              inputMode="url"
              placeholder="https://staging.example.com/sign-in"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={busy}
            />
            <div className="wt-hint">
              {requiresAuth ? "Usually the sign-in page." : "Any page the agent should start from."}
            </div>
          </div>
        </section>

        {requiresAuth && (
          <section className="wt-section fade-up">
            <div className="wt-section-head">
              <span className="wt-section-icon"><KeyRound size={16} /></span>
              <div>
                <div className="wt-section-title">Sign-in details</div>
                <div className="wt-section-desc">Used by the agent for this session only.</div>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="wt-email">
                Email <span className="wt-req">*</span>
              </label>
              <input
                id="wt-email"
                className="input"
                type="email"
                autoComplete="off"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="wt-row2">
              <div>
                <label className="label" htmlFor="wt-password">
                  Password <span className="wt-opt">(optional)</span>
                </label>
                <input
                  id="wt-password"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div>
                <label className="label" htmlFor="wt-otp">
                  Static OTP <span className="wt-opt">(optional)</span>
                </label>
                <input
                  id="wt-otp"
                  className="input"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
          </section>
        )}

        {(requiresAuth || approvers.length > 0) && (
          <section className="wt-section fade-up">
            <div className="wt-section-head">
              <span className="wt-section-icon"><KeyRound size={16} /></span>
              <div>
                <div className="wt-section-title">
                  Does this test need someone else to approve?{" "}
                  <span className="wt-opt">(optional)</span>
                </div>
                <div className="wt-section-desc">
                  Some approvals arrive in another person&apos;s inbox, so the agent
                  has to sign in as them to click Approve. Add each of those people
                  here, one at a time. If nobody else has to approve, skip this.
                </div>
              </div>
            </div>

            {approvers.length > 0 && (
              <div style={{ display: "grid", gap: 8 }}>
                {approvers.map((a) => (
                  <div
                    key={a.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(128,128,128,.25)",
                    }}
                  >
                    <span>
                      <strong>{a.name}</strong>
                      <span className="wt-section-desc" style={{ marginLeft: 8 }}>
                        the agent can open this person&apos;s inbox and approve for them
                      </span>
                    </span>
                    <button
                      className="btn"
                      onClick={() => removeApprover(a.name)}
                      title={"Forget the login for " + a.name}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="wt-row2">
              <div>
                <label className="label" htmlFor="wt-apv-name">
                  Their name in your test <span className="wt-req">*</span>
                </label>
                <input
                  id="wt-apv-name"
                  className="input"
                  autoComplete="off"
                  placeholder="e.g. namspoadmd"
                  value={apvName}
                  onChange={(e) => setApvName(e.target.value)}
                  disabled={apvBusy}
                />
                {apvName.trim() && (
                  <div className="wt-section-desc" style={{ marginTop: 6 }}>
                    Your test will contain this line, spelled exactly like this:
                    <code style={{ display: "block", marginTop: 4 }}>
                      As {apvName.trim()}, approve the email for ...
                    </code>
                  </div>
                )}
              </div>
              <div>
                <label className="label" htmlFor="wt-apv-email">
                  Their email <span className="wt-req">*</span>
                </label>
                <input
                  id="wt-apv-email"
                  className="input"
                  type="email"
                  autoComplete="off"
                  placeholder="approver@example.com"
                  value={apvEmail}
                  onChange={(e) => setApvEmail(e.target.value)}
                  disabled={apvBusy}
                />
              </div>
            </div>

            <div className="wt-row2">
              <div>
                <label className="label" htmlFor="wt-apv-password">
                  Their password <span className="wt-opt">(optional)</span>
                </label>
                <input
                  id="wt-apv-password"
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="********"
                  value={apvPassword}
                  onChange={(e) => setApvPassword(e.target.value)}
                  disabled={apvBusy}
                />
              </div>
              <div>
                <label className="label" htmlFor="wt-apv-otp">
                  Static OTP <span className="wt-opt">(optional)</span>
                </label>
                <input
                  id="wt-apv-otp"
                  className="input"
                  inputMode="numeric"
                  placeholder="123456"
                  value={apvOtp}
                  onChange={(e) => setApvOtp(e.target.value)}
                  disabled={apvBusy}
                />
              </div>
            </div>

            {apvBusy && (
              <div className="wt-callout fade-up" style={{ flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <LoaderCircle size={15} className="wt-spin" />
                  <span className="wt-callout-title" style={{ margin: 0 }}>
                    Signing in as {apvName || "the approver"} - watch it in the Live
                    browser panel. This usually takes a minute or two.
                  </span>
                  <button
                    className="btn"
                    style={{ marginLeft: "auto" }}
                    onClick={cancelApproverSignIn}
                    title="Stop this sign-in"
                  >
                    Cancel
                  </button>
                </div>

                {apvNeedOtp && (
                  <div style={{ display: "flex", gap: 8, width: "100%" }}>
                    <input
                      className="input"
                      placeholder="Enter the one-time code"
                      inputMode="numeric"
                      value={apvLiveOtp}
                      onChange={(e) => setApvLiveOtp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendApproverOtp()}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={sendApproverOtp}>
                      Send code
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={addApprover}
                disabled={apvBusy || !apvName.trim() || !apvEmail.trim()}
              >
                {apvBusy ? "Signing in..." : "Sign in and save this approver"}
              </button>
              {apvStatus && (
                <span className="wt-section-desc" style={{ margin: 0 }}>
                  {apvStatus}
                </span>
              )}
              {!apvStatus && approvers.length > 0 && (
                <span className="wt-section-desc" style={{ margin: 0 }}>
                  {approvers.length === 1
                    ? "Saved 1 approver. Add another if more than one person has to approve."
                    : "Saved " + approvers.length + " approvers."}
                </span>
              )}
            </div>
          </section>
        )}

        <section className="wt-section">
          <div className="wt-section-head">
            <span className="wt-section-icon"><Sparkles size={16} /></span>
            <div>
              <div className="wt-section-title">
                AI provider <span className="wt-req">*</span>
              </div>
              <div className="wt-section-desc">Add at least one key. It powers the agent for this run.</div>
            </div>
          </div>
          <div className="wt-row2">
            <div>
              <label className="label" htmlFor="wt-openai">OpenAI API key</label>
              <input
                id="wt-openai"
                className="input"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className="label" htmlFor="wt-anthropic">Anthropic API key</label>
              <input
                id="wt-anthropic"
                className="input"
                type="password"
                autoComplete="off"
                placeholder="sk-ant-..."
                value={anthropicApiKey}
                onChange={(e) => setAnthropicApiKey(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>
        </section>

        <section className="wt-section">
          <div className="wt-section-head">
            <span className="wt-section-icon"><ListChecks size={16} /></span>
            <div>
              <div className="wt-section-title">Test mode</div>
              <div className="wt-section-desc">What the agent does after signing in.</div>
            </div>
          </div>
          <div className="wt-modes" role="radiogroup" aria-label="Test mode">
            {TEST_MODES.map(({ id, name, desc, Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                data-mode={id}
                className={cx("wt-mode", mode === id && "active")}
                onClick={() => setMode(id)}
                disabled={busy}
              >
                <span className="wt-mode-top">
                  <span className="wt-mode-icon"><Icon size={16} /></span>
                  <span className="wt-mode-name">{name}</span>
                </span>
                <span className="wt-mode-desc">{desc}</span>
                {mode === id && <CircleCheck size={16} className="wt-mode-check" />}
              </button>
            ))}
          </div>

          {mode === "scenarios" && (
            <div className="wt-callout ok fade-up">
              <ClipboardList size={16} />
              <div>
                <div className="wt-callout-title">Prompt testing</div>
                After signing in you write the scenarios to test (steps and expected
                results) or draft them from a requirements document. The agent carries
                out each step on screen, checks every expected result and produces a
                pass/fail Excel report.
              </div>
            </div>
          )}
          {mode === "direct" && (
            <div className="wt-callout info fade-up">
              <Zap size={16} />
              <div>
                <div className="wt-callout-title">Prompt test</div>
                After signing in you type one instruction (for example "add to cart,
                then check out") and the agent runs it straight away. No Excel report.
              </div>
            </div>
          )}
        </section>

        <button
          className="btn btn-primary wt-cta"
          onClick={connect}
          disabled={
            (requiresAuth && !email) ||
            !userId ||
            !targetUrl ||
            (!apiKey && !anthropicApiKey) ||
            status === "running" ||
            status === "done"
          }
        >
          {status === "connecting" ? (
            <>
              <span className="spinner" /> Connecting…
            </>
          ) : status === "running" ? (
            <>
              <span className="spinner" /> Agent is signing in…
            </>
          ) : status === "done" ? (
            <>
              <CircleCheck size={16} /> Signed in
            </>
          ) : (
            <>
              <Play size={15} /> Start session
            </>
          )}
        </button>

      </div>
      )}

      <div className={signingIn ? "wt-workspace" : "wt-sticky"}>
        <ScreenPanel
          src={screenshot}
          scanning={busy}
          url={targetUrl}
          label={
            <div className="wt-panel-head">
              <span>Live browser</span>
              <span
                className={cx(
                  "badge",
                  busy ? "badge-running" : status === "done" ? "badge-done" : status === "error" ? "badge-failed" : "badge-idle",
                )}
              >
                {busy && <span className="spinner" style={{ width: 10, height: 10 }} />}
                {statusLabel}
              </span>
            </div>
          }
        />
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Checking Pipeline
// ════════════════════════════════════════════════════════════════════════════
function PhaseChecking({
  targetUrl,
  apiKey,
  anthropicApiKey,
  userId,
  authSessionId,
  onExcelReady,
  onSessionReady,
  onStatusChange,
}) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.profile);
  const creditAccount = user?.creditAccount;
  // Managed plans pay for model calls on top of the capacity charge, so they
  // get a running total of that additional spend.
  const billsUsage = !!creditAccount?.billsUsage;

  // Exploration is where most model calls happen, so the meter is fed here too.
  const { live: liveUsage, ingest: ingestLiveUsage } = useLiveUsage();

  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("starting");
  const [screenshot, setScreenshot] = useState(null);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    current: "",
  });
  const [parentSessionId, setParentSessionId] = useState(authSessionId || null);

  useEffect(() => {
    if (authSessionId) {
      onSessionReady(authSessionId);
    }
  }, [authSessionId, onSessionReady]);

  const wsRef = useRef(null);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  const pushLog = (msg, color = "white") =>
    setLogs((p) => [...p, { message: msg, color }]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Cheap client-side pre-check so an out-of-credit user is told before we
      // spin anything up. The authoritative hold happens below, once the
      // server has assigned a parent session id to key it on.
      if (
        creditAccount &&
        !creditAccount.unlimited &&
        !creditAccount.overageEnabled &&
        creditAccount.balance < PHASE2_MAX_URLS
      ) {
        pushLog(
          `❌ Not enough credits. Discovery reserves up to ${PHASE2_MAX_URLS} credits ` +
            `and you have ${creditAccount.balance}. Unused credits are returned automatically.`,
          "red",
        );
        setStatus("error");
        return;
      }

      pushLog(`Initializing Checking Pipeline → ${targetUrl}`, "cyan");
      const res = await fetch(`${API}/checking/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          base_url: targetUrl,
          api_key: apiKey || undefined,
          anthropic_api_key: anthropicApiKey || undefined,
          user_id: userId || undefined,
          auth_session_id: authSessionId || undefined,
          session_id: authSessionId || undefined,
        }),
      });
      const data = await res.json();
      if (cancelled) return;

      // Hold the crawler's page ceiling. The real URL count is not knowable
      // until Phase 1 finishes crawling, so we over-hold and the review screen
      // reconciles it back down. If the hold fails, stop the run immediately
      // rather than let it spend against credits that aren't there.
      const reservation = await reserveExploration(data.session_id);
      if (cancelled) return;
      if (!reservation.ok) {
        pushLog(`❌ ${reservation.message}`, "red");
        setStatus("error");
        try {
          await fetch(`${API}/terminate/${data.session_id}`, { method: "POST" });
        } catch (_) {
          /* best effort — the reconciler releases the hold either way */
        }
        return;
      }
      if (reservation.data?.creditsHeld) {
        pushLog(
          `💳 ${reservation.data.creditsHeld} credits held while we discover your pages. ` +
            `Unused credits are returned automatically.`,
          "cyan",
        );
        dispatch(fetchCreditAccount());
      }

      setJobId(data.session_id);
      pushLog(`Job ID Assigned: ${data.job_id}`, "cyan");

      // A dropped socket used to end the live view for good, and the server
      // took the drop as a cancel and killed the crawl. The crawl now carries
      // on, so reconnect. The server sends a "cursor" after each batch of log
      // entries; passing it back resumes from there instead of replaying
      // url_report and usage events, which would re-add reports and
      // double-count the credit meter.
      let logCursor = 0;
      let wsAttempt = 0;
      let wsFinished = false;

      const openCheckingSocket = () => {
        const ws = new WebSocket(
          `${WS}/ws/checking/${data.session_id}?from_index=${logCursor}`,
        );
        wsRef.current = ws;

        ws.onmessage = (ev) => {
          const msg = JSON.parse(ev.data);

          // Count the reconnect as good only once data flows: a socket that
          // opens and then fails straight away must keep backing off.
          if (wsAttempt > 0 && msg.type !== "error") {
            pushLog("Live view reconnected.", "green");
            setStatus("running");
            wsAttempt = 0;
          }

          if (msg.parent_session && !parentSessionId) {
            setParentSessionId(msg.parent_session);
            onSessionReady(msg.parent_session);
          }

          if (msg.type === "ping") return;
          if (msg.type === "cursor") {
            logCursor = msg.next;
            return;
          }
          if (msg.final) wsFinished = true;

          // Meter telemetry. Consumed silently — it feeds the credit readout and
          // is deliberately kept out of the activity log, which is for the
          // agent's decisions, not token counts.
          if (msg.type === "usage" || msg.type === "activity") {
            ingestLiveUsage(msg);
            return;
          }

          if (msg.type === "frame") {
            setScreenshot(`data:image/jpeg;base64,${msg.image}`);
            if (msg.current_url)
              setProgress((p) => ({ ...p, current: msg.current_url }));
            if (msg.total) setProgress((p) => ({ ...p, total: msg.total }));
            if (msg.completed !== undefined)
              setProgress((p) => ({ ...p, completed: msg.completed }));
            return;
          }
          if (msg.type === "url_started") {
            pushLog(`🔍 Exploring: ${msg.url}`, "cyan");
            setProgress((p) => ({
              ...p,
              current: msg.url,
              total: msg.total || p.total,
              completed: msg.index - 1,
            }));
            return;
          }
          if (msg.type === "url_report") {
            pushLog(`✓ Indexed: ${msg.url}`, "green");
            setProgress((p) => ({
              ...p,
              completed: msg.completed || p.completed,
              total: msg.total || p.total,
            }));
            if (msg.s3_download_url && msg.excel_filename) {
              onExcelReady(msg.s3_download_url, msg.excel_filename);
              pushLog(`📊 Report ready: ${msg.excel_filename}`, "green");
            }
            if (msg.parent_session && !parentSessionId) {
              setParentSessionId(msg.parent_session);
              onSessionReady(msg.parent_session);
            }
            return;
          }
          if (msg.message)
            pushLog(
              msg.message,
              msg.type === "error"
                ? "red"
                : msg.type === "done"
                  ? "green"
                  : "white",
            );

          if (msg.type === "done") {
            setStatus("done");
            pushLog(
              "✅ Phase 1 Complete — All URLs indexed and reports generated",
              "green",
            );
            if (msg.s3_download_url && msg.excel_filename) {
              onExcelReady(msg.s3_download_url, msg.excel_filename);
            }
            wsFinished = true;
            ws.close();
          }
          if (msg.type === "error") setStatus("error");
        };

        // onerror always fires alongside onclose, so reconnecting is handled
        // there: one drop must not both report an error and give up.
        ws.onerror = () => {};

        ws.onclose = () => {
          if (cancelled || wsFinished) return;  // unmounted, or the run ended
          // A crawl can run for hours and a stalled server can take minutes to
          // come back, so keep trying rather than give up after a few seconds.
          const wait = Math.min(1000 * 2 ** wsAttempt, 15000);
          if (wsAttempt === 0) {
            pushLog(
              "Live view dropped — reconnecting. The crawl is still running on the server.",
              "yellow",
            );
          }
          wsAttempt += 1;
          setTimeout(() => {
            if (cancelled || wsFinished) return;
            openCheckingSocket();
          }, wait);
        };
      };

      openCheckingSocket();
      setStatus("running");
    };

    start().catch((e) => pushLog(String(e), "red"));

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, []);

  useInterval(
    async () => {
      if (!jobId || status !== "running") return;
      try {
        const r = await fetch(`${API}/checking/${jobId}/status`);
        const d = await r.json();
        setProgress((p) => ({
          ...p,
          total: d.total_urls || p.total,
          current: d.current_url || p.current,
        }));
      } catch {}
    },
    status === "running" ? 3000 : null,
  );

  return (
    <div
      className="fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="phase-header">Run · Standard checking</div>
          <div className="phase-title">Discovery & Crawling</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
            Mapping application structure and collecting endpoints.
          </div>
        </div>
        <span
          className={cx(
            "badge",
            status === "running"
              ? "badge-running"
              : status === "done"
                ? "badge-done"
                : "badge-failed",
          )}
        >
          {status === "running" && (
            <span className="spinner" style={{ width: 10, height: 10 }} />
          )}
          {status === "running" ? "Crawling" : status}
        </span>
      </div>

      {/* Model-usage charges accruing ON TOP of this run's capacity credits.
          Exploration is where most model calls happen, so this is the phase
          where it actually moves. */}
      {billsUsage && liveUsage.calls > 0 && (
        <LiveUsageMeter live={liveUsage} account={creditAccount} />
      )}

      <div style={{ width: "100%" }}>
        <ScreenPanel
          src={screenshot}
          scanning={status === "running"}
          label="Agent Viewfinder"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="card">
          <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
            <div>
              <div className="stat-val">{progress.completed}</div>
              <div className="stat-lbl">URLs Processed</div>
            </div>
            <div>
              <div className="stat-val" style={{ color: C.muted }}>
                {progress.total || "—"}
              </div>
              <div className="stat-lbl">Total Discovered</div>
            </div>
          </div>

          {progress.current && (
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: C.muted,
                display: "flex",
                gap: 8,
                wordBreak: "break-all",
                background: C.surface,
                padding: "8px 12px",
                borderRadius: 6,
                border: `1px solid ${C.border}`,
              }}
            >
              <span style={{ color: C.accent }}>●</span>{" "}
              <span className="font-mono">{progress.current}</span>
            </div>
          )}

          {parentSessionId && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 16px",
                borderRadius: 8,
                background: "rgba(12,30,91,0.05)",
                border: "1px solid rgba(12,30,91,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: C.muted,
                  marginBottom: 8,
                }}
              >
                Parent Session ID — use in Phase 3
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    flex: 1,
                    wordBreak: "break-all",
                  }}
                >
                  {parentSessionId}
                </span>
                <CopyButton text={parentSessionId} />
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                Use this ID in the Phase 3 → Validation tab
              </div>
            </div>
          )}
        </div>
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DIRECT PROMPT TEST — Auth → natural-language prompt → realtime execution
// ════════════════════════════════════════════════════════════════════════════
function PhaseDirectPrompt({
  authSessionId,
  apiKey,
  anthropicApiKey,
  onStatusChange,
}) {
  const [prompt, setPrompt] = useState("");
  const [testId, setTestId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [screenshot, setScreenshot] = useState(null);
  const [summary, setSummary] = useState(null);
  const [success, setSuccess] = useState(null);
  const [steps, setSteps] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  const pushLog = (msg, color = "white") =>
    setLogs((p) => [...p, { message: msg, color }]);

  const startRun = async () => {
    if (!prompt.trim()) return;
    setStatus("running");
    setLogs([]);
    setScreenshot(null);
    setSummary(null);
    setSuccess(null);
    setSteps(null);
    pushLog(`Starting prompt test — session: ${authSessionId}`, "cyan");
    pushLog(`Prompt: ${prompt}`, "white");

    let tid;
    try {
      const res = await fetch(`${API}/direct/run/${authSessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          api_key: apiKey || undefined,
          anthropic_api_key: anthropicApiKey || undefined,
        }),
      });
      const data = await res.json();
      if (data.detail) {
        pushLog(`❌ ${data.detail}`, "red");
        setStatus("error");
        return;
      }
      tid = data.test_id;
      setTestId(tid);
      pushLog(`Test ID: ${tid}`, "cyan");
      pushLog(`Running on: ${data.url}`, "cyan");
    } catch (e) {
      pushLog(`❌ Failed to start: ${e}`, "red");
      setStatus("error");
      return;
    }

    const ws = new WebSocket(`${WS}/ws/direct/${tid}`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "ping") return;
      if (msg.type === "frame") {
        setScreenshot(`data:image/png;base64,${msg.image}`);
        return;
      }
      if (msg.type === "log") {
        pushLog(msg.message, msg.color || "white");
        return;
      }
      if (msg.type === "done") {
        setStatus(msg.status === "completed" ? "done" : "error");
        setSuccess(msg.success);
        setSummary(msg.summary);
        setSteps(msg.steps);
        pushLog(
          msg.success
            ? "✅ Test completed successfully"
            : "❌ Test completed with issues",
          msg.success ? "green" : "red",
        );
        ws.close();
        return;
      }
      if (msg.type === "error") {
        pushLog(`❌ ${msg.message}`, "red");
        setStatus("error");
      }
    };

    ws.onerror = () => {
      pushLog("WebSocket connection error", "red");
      setStatus("error");
    };
  };

  const reset = () => {
    wsRef.current?.close();
    setStatus("idle");
    setPrompt("");
    setTestId(null);
    setLogs([]);
    setScreenshot(null);
    setSummary(null);
    setSuccess(null);
    setSteps(null);
  };

  return (
    <div
      className="fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="phase-header">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Prompt Test
          </div>
          <div className="phase-title">Direct Prompt Orchestration</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
            Type what to test — the AI runs it live on the authenticated
            session. No Excel, no exploration.
          </div>
        </div>
        <span
          className={cx(
            "badge",
            status === "running"
              ? "badge-running"
              : status === "done"
                ? "badge-done"
                : status === "error"
                  ? "badge-failed"
                  : "badge-idle",
          )}
        >
          {status === "running" && (
            <span className="spinner" style={{ width: 10, height: 10 }} />
          )}
          {status === "running" ? "Executing" : status}
        </span>
      </div>

      {(status === "idle" || status === "done" || status === "error") && (
        <div
          className="card fade-up"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label className="label">
              Test Prompt <span style={{ color: C.red }}>*</span>
            </label>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
              Describe what the user should do in plain language.
            </div>
            <textarea
              className="input"
              rows={4}
              placeholder={`e.g. Add a product to cart twice, go to checkout, remove one item, apply coupon code SAVE10, then complete the purchase and verify the order confirmation page`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div
            style={{
              fontSize: 12,
              color: C.muted,
              padding: "8px 12px",
              borderRadius: 6,
              background: C.surface,
              border: `1px solid ${C.border}`,
            }}
          >
            <span style={{ color: C.text, fontWeight: 600 }}>Session: </span>
            <span className="font-mono">{authSessionId}</span>
            <span style={{ color: C.muted }}>
              {" "}
              — browser starts on the post-login home page
            </span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: 12 }}
              onClick={startRun}
              disabled={!prompt.trim() || status === "running"}
            >
              ⚡ Run Prompt Test
            </button>
            {(status === "done" || status === "error") && (
              <button
                className="btn"
                style={{ border: `1px solid ${C.border}` }}
                onClick={reset}
              >
                New Test
              </button>
            )}
          </div>
        </div>
      )}

      {status === "running" && (
        <ScreenPanel
          src={screenshot}
          scanning={true}
          label="Live Browser Stream"
        />
      )}

      {(status === "done" || status === "error") && summary && (
        <div
          className="card fade-up"
          style={{
            border: `1px solid ${success ? "rgba(16,185,129,.3)" : "rgba(239,68,68,.3)"}`,
            background: success
              ? "rgba(16,185,129,.03)"
              : "rgba(239,68,68,.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 20 }}>{success ? "✅" : "❌"}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {success ? "Test Passed" : "Test Completed with Issues"}
              </div>
              {steps != null && (
                <div style={{ fontSize: 12, color: C.muted }}>
                  {steps} steps executed
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "#33416e",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {summary}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="btn"
              style={{ border: `1px solid ${C.border}`, fontSize: 12 }}
              onClick={reset}
            >
              Run Another Test
            </button>
          </div>
        </div>
      )}

      {(status === "done" || status === "error") && screenshot && !summary && (
        <ScreenPanel
          src={screenshot}
          scanning={false}
          label="Final Browser State"
        />
      )}

      {(status === "running" || logs.length > 0) && <LogPanel logs={logs} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GUIDED SCENARIOS — user-given steps + expected results, run on screen
// ════════════════════════════════════════════════════════════════════════════
// ── Activity timeline: the run's log read as the agent's decisions ──────────
function readLogLine(message) {
  const t = String(message || "").trim();
  let r;
  if ((r = /^▶\s*\[(\d+)\/(\d+)\]\s*(.*)$/.exec(t))) return { kind: "scenario", index: Number(r[1]), total: Number(r[2]), title: r[3] };
  if ((r = /^📝\s*plan:\s*(.*)$/i.exec(t))) return { kind: "plan", items: r[1].split(/\s+→\s+/).filter(Boolean) };
  if ((r = /^→\s*(.*?)\s*([✓✗])$/.exec(t))) {
    const body = r[1];
    const cut = body.indexOf(" (");
    const what = cut > 0 ? body.slice(0, cut) : body;
    const why = cut > 0 ? body.slice(cut + 2).replace(/\)\s*$/, "").replace(/\)\s*\(/g, "; ") : "";
    return { kind: "action", ok: r[2] === "✓", what, why };
  }
  if ((r = /^→\s*(.*)$/.exec(t))) return { kind: "action", ok: null, what: r[1], why: "" };
  if ((r = /^(✅|❌)\s*step\s+(\d+):\s*(.*?)(?:\s+—\s+(.*))?$/i.exec(t)))
    return { kind: "step", ok: r[1] === "✅", n: r[2], text: r[3], note: r[4] || "" };
  if ((r = /^(✅|❌)\s*check:\s*(.*?)(?:\s+—\s+(.*))?$/i.exec(t)))
    return { kind: "check", ok: r[1] === "✅", text: r[2], evidence: r[3] || "" };
  if ((r = /^⇒\s*(PASSED|FAILED|BLOCKED)/i.exec(t))) return { kind: "verdict", value: r[1].toUpperCase() };
  if ((r = /^⏹\s*(Stopped.*)$/i.exec(t))) return { kind: "stopped", text: r[1] };
  if ((r = /^(?:✗|⏹)\s*(.*)$/.exec(t))) return { kind: "problem", text: r[1] };
  if ((r = /^(?:↩|↪|🔁|↻)\s*(.*)$/.exec(t))) return { kind: "recover", text: r[1] };
  if ((r = /^↳\s*(.*)$/.exec(t))) return { kind: "cause", text: r[1] };
  if ((r = /^⚠️?\s*(.*)$/.exec(t))) return { kind: "notice", text: r[1] };
  if ((r = /^✍️?\s*(.*)$/.exec(t))) return { kind: "wording", text: r[1] };
  if ((r = /^🧹\s*(.*)$/.exec(t))) return { kind: "cleanup", text: r[1] };
  if ((r = /^🏁\s*(.*)$/.exec(t))) return { kind: "finish", text: r[1] };
  return { kind: "info", text: t };
}

function TimelineRow({ ev }) {
  const row = (tone, Icon, label, text, why, extra) => (
    <li className={cx("wt-tl-row", tone)}>
      <span className="wt-tl-dot"><Icon size={12} /></span>
      <div>
        <div className="wt-tl-label">{label}</div>
        {text && <div className="wt-tl-text">{text}</div>}
        {extra}
        {why && <div className="wt-tl-why">{why}</div>}
      </div>
    </li>
  );
  switch (ev.kind) {
    case "plan":
      return row("plan", Sparkles, "Decided what to do", "", "", (
        <div className="wt-tl-plan">{ev.items.map((it, i) => <span key={i}>{it}</span>)}</div>
      ));
    case "action":
      return ev.ok === false
        ? row("bad", X, "Tried, did not work", ev.what, ev.why && `What it saw: ${ev.why}`)
        : row("ok", Check, "Did", ev.what, ev.why && `What it saw: ${ev.why}`);
    case "problem":
      return row("bad", TriangleAlert, "Could not", ev.text);
    case "recover":
      return row("recover", RefreshCw, "Changed approach", ev.text);
    case "cause":
      return row("warn", Search, "Likely cause", ev.text);
    case "notice":
      return row("warn", TriangleAlert, "Noticed", ev.text);
    case "wording":
      return row("warn", PenLine, "Unclear wording in the scenario", ev.text);
    case "cleanup":
      return row("", ClipboardList, "Clean-up", ev.text);
    case "step":
      return row(ev.ok ? "ok milestone" : "bad milestone", Flag, ev.ok ? `Step ${ev.n} reached` : `Step ${ev.n} not reached`, ev.text, ev.note);
    case "check":
      return row(ev.ok ? "ok" : "bad", ev.ok ? CircleCheck : CircleX, ev.ok ? "Check passed" : "Check failed", ev.text, ev.evidence && `Evidence: ${ev.evidence}`);
    case "stopped":
      return row("warn milestone", Square, "Stopped by you", ev.text);
    case "finish":
      return row("milestone", Flag, "Run finished", ev.text);
    default:
      return row("", Activity, "Info", ev.text);
  }
}

function ActivityTimeline({ logs, running }) {
  const [view, setView] = useState("timeline");
  const bodyRef = useRef(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = bodyRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [logs, view]);

  const groups = [];
  const loose = [];
  let actions = 0;
  let recoveries = 0;
  const seen = {};
  for (const l of logs) {
    const ev = readLogLine(l.message);
    if (ev.kind === "action" && ev.ok !== false) actions += 1;
    if (ev.kind === "recover") recoveries += 1;
    if (ev.kind === "scenario") {
      seen[ev.index] = (seen[ev.index] || 0) + 1;
      groups.push({ ...ev, attempt: seen[ev.index], events: [], verdict: "" });
      continue;
    }
    const g = groups[groups.length - 1];
    if (ev.kind === "verdict") {
      if (g) g.verdict = ev.value;
      continue;
    }
    if (g) g.events.push(ev);
    else if (ev.kind !== "info" || ev.text) loose.push(ev);
  }

  return (
    <div className="wt-activity">
      <div className="wt-activity-head">
        <span className="wt-activity-title">
          <span className={cx("wt-dot", running ? "busy" : logs.length > 0 && "on")} /> What the agent is doing
        </span>
        <span className="wt-activity-stats">
          <span className="wt-mini ok">{actions} actions</span>
          {recoveries > 0 && <span className="wt-mini warn">{recoveries} changes of approach</span>}
        </span>
        <div className="wt-seg wt-seg-mini" role="tablist" aria-label="Log view">
          <button type="button" role="tab" aria-selected={view === "timeline"} className={cx(view === "timeline" && "active")} onClick={() => setView("timeline")}>
            Timeline
          </button>
          <button type="button" role="tab" aria-selected={view === "raw"} className={cx(view === "raw" && "active")} onClick={() => setView("raw")}>
            Raw log
          </button>
        </div>
      </div>
      <div
        ref={bodyRef}
        className={cx("wt-activity-body", view === "raw" && "raw")}
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {logs.length === 0 && <div className="wt-activity-empty">Waiting for the agent to start…</div>}
        {view === "raw"
          ? logs.map((l, i) => (
              <div key={i} className={cx("log-line", `log-${l.color || "white"}`)}>
                <span className="log-num">{String(i + 1).padStart(3, "0")}</span>
                {l.message}
              </div>
            ))
          : (
            <>
              {loose.length > 0 && (
                <ul className="wt-tl-list wt-tl-loose">
                  {loose.map((ev, i) => <TimelineRow key={`l${i}`} ev={ev} />)}
                </ul>
              )}
              {groups.map((g, gi) => {
                const last = gi === groups.length - 1;
                const verdict = g.verdict || (running && last ? "RUNNING" : "");
                return (
                  <section key={`g${gi}`} className="wt-tl-group">
                    <div className="wt-tl-group-head">
                      <span className="wt-tl-group-title" title={g.title}>{g.title}</span>
                      <span className="wt-tl-group-sub">
                        Scenario {g.index} of {g.total}{g.attempt > 1 ? ` · attempt ${g.attempt}` : ""}
                      </span>
                      {verdict && (
                        <span className={cx("wt-tl-verdict", verdict)}>
                          {verdict === "RUNNING" ? <LoaderCircle size={11} className="wt-spin" /> : null}
                          {{ PASSED: "Passed", FAILED: "Failed", BLOCKED: "Blocked", RUNNING: "Running" }[verdict]}
                        </span>
                      )}
                    </div>
                    <ul className="wt-tl-list">
                      {g.events.map((ev, i) => <TimelineRow key={i} ev={ev} />)}
                    </ul>
                  </section>
                );
              })}
            </>
          )}
      </div>
    </div>
  );
}

// Mirrors scenarios/format.py so the preview shows what the runner will read.
function parseScenarioText(text) {
  const out = [];
  let cur = null;
  let section = null;
  const add = (item) => {
    if (section === "DATA") {
      if (item.includes("=")) cur.data.push(item);
      return;
    }
    const clean = item.replace(/^(?:[-*•]|\d+[.)])\s*/, "").trim();
    if (clean) cur[section.toLowerCase()].push(clean);
  };
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const head = /^SCENARIO\s*:\s*(.*)$/i.exec(line);
    if (head) {
      cur = { title: head[1].trim(), login: "main", data: [], steps: [], checks: [], cleanup: [] };
      out.push(cur);
      section = null;
      continue;
    }
    if (!cur) continue;
    const sec = /^(LOGIN|DATA|STEPS|CHECKS|CLEANUP)\s*:\s*(.*)$/i.exec(line);
    if (sec) {
      section = sec[1].toUpperCase();
      const rest = sec[2].trim();
      if (section === "LOGIN") cur.login = rest || "main";
      else if (rest) add(rest);
      continue;
    }
    if (section && section !== "LOGIN") add(line);
  }
  return out;
}

// Remove what the runner must not execute: code fences, "None"-style clean-up lines, empty CLEANUP sections.
function tidyScenarioText(raw) {
  const lines = String(raw || "")
    .replace(/```[a-z]*\n?/gi, "")
    .split(/\r?\n/)
    .filter((l) => !/^\s*[-*]\s*(none|n\/a|not needed|nothing|no clean-?up( needed)?)\.?\s*$/i.test(l));
  const out = lines.filter((l, i) => {
    if (!/^\s*CLEANUP\s*:\s*$/i.test(l)) return true;
    const next = lines.slice(i + 1).find((x) => x.trim());
    return !!next && !/^\s*SCENARIO\s*:/i.test(next);
  });
  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function scenarioWarnings(sc) {
  const w = [];
  if (!sc.steps.length) w.push("no steps");
  if (!sc.checks.length) w.push("no checks");
  return w;
}

const ASSIST_EXAMPLES = [
  "Create a record, find it with search, edit it and check the change is saved",
  "Check the form refuses empty required fields and wrong formats",
  "Delete a record and check it no longer appears in the list",
  "Check a user without permission cannot open the admin pages",
];

const SCENARIO_STATUS_STYLE = {
  passed: { label: "Passed", color: "#059669", bg: "rgba(16,185,129,.08)" },
  failed: { label: "Failed", color: "#dc2626", bg: "rgba(239,68,68,.08)" },
  blocked: { label: "Blocked", color: "#b45309", bg: "rgba(245,158,11,.10)" },
  needs_login: { label: "Needs login", color: "#2563eb", bg: "rgba(12,30,91,.08)" },
  error: { label: "Error", color: "#dc2626", bg: "rgba(239,68,68,.08)" },
};

function PhaseScenarios({
  authSessionId,
  targetUrl,
  apiKey,
  anthropicApiKey,
  userId,
  onExcelReady,
  onStatusChange,
  onStageChange,
  onSignInAgain,
  initialText,
}) {
  const [text, setText] = useState(initialText || "");
  const [allowChanges, setAllowChanges] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [status, setStatus] = useState("idle");
  const [drafting, setDrafting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [screenshot, setScreenshot] = useState(null);
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState({});
  const [composeMode, setComposeMode] = useState(initialText ? "write" : "assist");
  const [brief, setBrief] = useState("");
  const [images, setImages] = useState([]);
  const [assisting, setAssisting] = useState(false);
  const [assistError, setAssistError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [runId, setRunId] = useState(null);
  const [stopping, setStopping] = useState(false);
  const stopTimerRef = useRef(null);
  const wsRef = useRef(null);
  const fileRef = useRef(null);
  const excelRef = useRef(null);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const imageRef = useRef(null);
  const editorRef = useRef(null);
  const gutterRef = useRef(null);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  // Scenarios handed over from the Test Case Designer may arrive after mount.
  // Text the user has edited is kept; untouched handed-over text follows changes
  // (e.g. the security checklist being switched on or off).
  const lastInitialRef = useRef(initialText || "");
  useEffect(() => {
    if (!initialText) return;
    const previous = lastInitialRef.current;
    lastInitialRef.current = initialText;
    setText((cur) => (!cur.trim() || cur === previous ? initialText : cur));
    setComposeMode("write");
  }, [initialText]);

  useEffect(() => {
    if (onStageChange) onStageChange(status === "running" ? "running" : result && status !== "idle" ? "results" : "write");
  }, [status, result, onStageChange]);

  const pushLog = (msg, color = "white") =>
    setLogs((p) => [...p, { message: msg, color }]);

  const keys = {
    api_key: apiKey || undefined,
    anthropic_api_key: anthropicApiKey || undefined,
  };

  const loadTemplate = async () => {
    try {
      const res = await fetch(`${API}/scenarios/template`);
      const data = await res.json();
      setText(data.scenarios_text || "");
    } catch (e) {
      pushLog(`❌ Could not load the template: ${e}`, "red");
    }
  };

  // Scenarios written in (or exported to) an Excel sheet are read straight
  // back into the box, so a report can be re-run without retyping anything.
  const loadFromExcel = async (file) => {
    if (!file) return;
    setLoadingExcel(true);
    pushLog(`Reading ${file.name}…`, "cyan");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/scenarios/from-excel`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "could not read that sheet");
      setText(data.scenarios_text || "");
      pushLog(`✅ ${data.count} scenario(s) loaded from ${data.source} — review them before running`, "green");
      if (data.warning) pushLog(`⚠️ ${data.warning}`, "yellow");
    } catch (e) {
      pushLog(`❌ ${e.message || e}`, "red");
    } finally {
      setLoadingExcel(false);
      if (excelRef.current) excelRef.current.value = "";
    }
  };

  const draftFromDocument = async (file) => {
    if (!file) return;
    setDrafting(true);
    pushLog(`Reading ${file.name}…`, "cyan");
    try {
      const form = new FormData();
      form.append("file", file);
      if (userId) form.append("user_id", userId);
      const up = await fetch(`${API}/brd/upload`, { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.detail || "upload failed");
      pushLog("Drafting scenarios from the document…", "cyan");
      const res = await fetch(`${API}/scenarios/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brd_id: upData.brd_id, url: targetUrl, ...keys }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "draft failed");
      setText(data.scenarios_text || "");
      pushLog(`✅ ${data.count} scenario(s) drafted — review and edit them before running`, "green");
    } catch (e) {
      pushLog(`❌ ${e.message || e}`, "red");
      setAssistError(String(e.message || e));
    } finally {
      setDrafting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addImages = (files) => {
    const picked = [...(files || [])].filter((f) => f.type && f.type.startsWith("image/"));
    if (!picked.length) return;
    setImages((prev) =>
      [
        ...prev,
        ...picked.map((file) => ({
          file,
          url: URL.createObjectURL(file),
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        })),
      ].slice(0, 8),
    );
  };

  const removeImage = (id) =>
    setImages((prev) => {
      const hit = prev.find((i) => i.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return prev.filter((i) => i.id !== id);
    });

  // Plain-language description (+ screenshots) → scenarios, streamed into the editor as they are written.
  const writeWithAssistant = async () => {
    if (!brief.trim() && images.length === 0) return;
    const before = text;
    let acc = "";
    setAssisting(true);
    setAssistError("");
    try {
      const form = new FormData();
      form.append("description", brief);
      form.append("url", targetUrl || "");
      if (apiKey) form.append("api_key", apiKey);
      if (anthropicApiKey) form.append("anthropic_api_key", anthropicApiKey);
      if (before.trim()) form.append("current_text", before);
      images.forEach((img) => form.append("images", img.file, img.file.name));
      const res = await fetch(`${API}/scenarios/assist`, { method: "POST", body: form });
      if (!res.ok || !res.body) {
        let detail = "";
        try {
          detail = (await res.json()).detail;
        } catch {
          detail = "";
        }
        throw new Error(detail || `the assistant answered with status ${res.status}`);
      }
      setText("");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc.replace(/```[a-z]*\n?/gi, ""));
      }
      if (acc.includes("[[ERROR]]")) throw new Error(acc.split("[[ERROR]]").pop().trim());
      const finalText = tidyScenarioText(acc);
      setText(finalText);
      pushLog(`✅ The assistant wrote ${parseScenarioText(finalText).length} scenario(s)`, "green");
    } catch (e) {
      setAssistError(String(e.message || e));
      if (!acc.trim() || acc.includes("[[ERROR]]")) setText(before);
    } finally {
      setAssisting(false);
    }
  };

  // Stop after the action in progress; the sign-in is kept, so the scenarios can be edited and run again.
  const backToEditor = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    setStopping(false);
    setResult(null);
    setComposeMode("write");
    setStatus("idle");
    pushLog("⏹ Stopped. Edit the scenarios and run them again — you are still signed in.", "yellow");
  };

  const stopRun = async () => {
    if (!runId || stopping) return;
    setStopping(true);
    try {
      await fetch(`${API}/scenarios/run/${runId}/stop`, { method: "POST" });
    } catch (e) {
      pushLog(`❌ Could not reach the server to stop the run: ${e}`, "red");
    }
    // If the stop is not confirmed in time, return to the editor anyway.
    stopTimerRef.current = setTimeout(() => {
      try {
        if (wsRef.current) wsRef.current.close();
      } catch {
        // already closed
      }
      backToEditor();
    }, 10000);
  };

  const insertToken = (tok) => {
    const el = editorRef.current;
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    const isSection = /:\s?$/.test(tok);
    const piece =
      (isSection && start > 0 && text[start - 1] !== "\n" ? "\n" : "") + tok + (/:$/.test(tok) ? "\n  " : "");
    setText(text.slice(0, start) + piece + text.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + piece.length, start + piece.length);
    });
  };

  // Finished testing: drop the saved sign-in and the screenshots its runs left
  // behind. The scenario text stays in the box, so it can be run again after
  // signing in once more.
  const finishAndCleanUp = async () => {
    if (status === "running" || cleaning) return;

    // Approver logins are saved under the person's name, not this session, so
    // they outlive it. They are real credentials, so say so and let the user
    // decide rather than quietly keeping or quietly deleting them.
    let saved = [];
    try {
      const r = await fetch(`${API}/approvers`);
      if (r.ok) saved = (await r.json()).approvers || [];
    } catch {
      // if the list cannot be read, carry on without offering the choice
    }

    const ok = window.confirm(
      "Finish and clean up? The saved sign-in and the screenshots from this session's runs are deleted. " +
        "Your scenarios stay in the box, but you will need to sign in again to run them.",
    );
    if (!ok) return;

    let alsoApprovers = false;
    if (saved.length) {
      const names = saved.map((a) => a.name).join(", ");
      alsoApprovers = window.confirm(
        `Also delete the ${saved.length} saved approver login(s)? (${names})\n\n` +
          "OK deletes them — they are sign-ins for other people's accounts, so remove them " +
          "if you are finished or this machine is shared.\n\n" +
          "Cancel keeps them, so you do not have to sign in as those people again.",
      );
    }

    setCleaning(true);
    try {
      const res = await fetch(
        `${API}/scenarios/session/${authSessionId}/cleanup?include_approvers=${alsoApprovers}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "clean-up failed");
      const gone = data.approvers_deleted || [];
      pushLog(
        `🧹 Cleaned up — sign-in ${data.auth_deleted ? "deleted" : "already gone"}, ` +
          `${data.run_folders_deleted} run folder(s) removed` +
          (gone.length
            ? `, approver login(s) deleted: ${gone.join(", ")}`
            : saved.length
              ? `, ${saved.length} approver login(s) kept`
              : ""),
        "green",
      );
      if (onSignInAgain) onSignInAgain();
    } catch (e) {
      pushLog(`❌ Could not clean up: ${e.message || e}`, "red");
    } finally {
      setCleaning(false);
    }
  };

  const startRun = async () => {
    if (!text.trim()) return;
    // Belt-and-braces alongside the button's disabled check: a run that starts
    // without an owner consumes credits that can never be charged to anyone,
    // and the engine records it against "unknown" rather than refusing. Cheaper
    // to stop here than to reconcile it afterwards — the September 2026 rows
    // could not be attributed at all after the fact.
    if (!userId) {
      pushLog("❌ Not signed in yet — wait a moment, or sign in again", "red");
      setStatus("error");
      return;
    }
    setStatus("running");
    setLogs([]);
    setScreenshot(null);
    setResult(null);
    let runId;
    try {
      const res = await fetch(`${API}/scenarios/run/${authSessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          scenarios_text: text,
          // Start every scenario from the site the user signed in to, not the
          // post-login page (a deep link a single-page app may answer with 404).
          url: targetUrl || undefined,
          allow_data_changes: allowChanges,
          user_id: userId,
          ...keys,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.detail) {
        pushLog(`❌ ${data.detail || "could not start"}`, "red");
        setStatus("error");
        return;
      }
      runId = data.run_id;
      setRunId(runId);
      pushLog(`Run ${runId} — ${data.scenarios} scenario(s) on ${data.url}`, "cyan");
    } catch (e) {
      pushLog(`❌ Failed to start: ${e}`, "red");
      setStatus("error");
      return;
    }

    // The live view used to freeze silently: the socket had no onclose, so a
    // dropped connection (a blip, a sleeping laptop, a proxy hiccup) left the
    // page showing whatever it last received while the run carried on for
    // several more minutes on the server. Reconnect instead.
    let wsAttempt = 0;
    let wsFinished = false;

    const openScenarioSocket = () => {
      const ws = new WebSocket(`${WS}/ws/scenarios/${runId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        wsAttempt = 0;
      };

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === "ping") return;
        if (msg.type === "frame") {
          setScreenshot(`data:image/png;base64,${msg.image}`);
          return;
        }
        if (msg.type === "log") {
          pushLog(msg.message, msg.color || "white");
          return;
        }
        if (msg.type === "done" && msg.status === "stopped") {
          backToEditor();
          wsFinished = true; ws.close();
          return;
        }
        if (msg.type === "done") {
          setResult(msg.result || null);
          setStatus(msg.status === "completed" ? "done" : "error");
          if (msg.s3_download_url && msg.excel_filename && onExcelReady) {
            const scs = (msg.result && msg.result.scenarios) || [];
            const first = scs[0]?.title || "";
            onExcelReady(msg.s3_download_url, msg.excel_filename, {
              kind: "scenarios",
              totals: msg.result?.totals || {},
              count: scs.length,
              headline: first ? (scs.length > 1 ? `${first} + ${scs.length - 1} more` : first) : "",
            });
          }
          wsFinished = true; ws.close();
          return;
        }
        if (msg.type === "error") {
          pushLog(`❌ ${msg.message}`, "red");
          setStatus("error");
        }
      };

      // onerror always fires alongside onclose, so reconnecting is handled
      // there: one drop must not both report an error and give up.
      ws.onerror = () => {};

      ws.onclose = () => {
        if (wsFinished) return;               // we closed it ourselves
        if (wsAttempt >= 10) {
          pushLog(
            "Lost the live view and could not reconnect. The run is still going on the server — reopen this page to pick it up.",
            "red",
          );
          return;
        }
        const wait = Math.min(1000 * 2 ** wsAttempt, 5000);
        wsAttempt += 1;
        pushLog(`Live view dropped — reconnecting (${wsAttempt})…`, "yellow");
        setTimeout(() => {
          if (wsFinished) return;
          // The server replays this run's log from the start on a new
          // connection, so clear ours first rather than showing it twice.
          setLogs([]);
          openScenarioSocket();
        }, wait);
      };
    };

    openScenarioSocket();
  };

  const editable = status !== "running";
  const totals = result?.totals || {};

  // Live progress, read from the run's own log lines (a retried scenario keeps its last verdict).
  const verdicts = {};
  let total = 0;
  let current = 0;
  let currentTitle = "";
  let lastStep = "";
  for (const l of logs) {
    const line = String(l.message || "").trim();
    const started = /^▶\s*\[(\d+)\/(\d+)\]\s*(.*)$/.exec(line);
    if (started) {
      current = Number(started[1]);
      total = Number(started[2]);
      currentTitle = started[3];
      lastStep = "";
      continue;
    }
    const step = /^(✅|❌)\s*step\s+(\d+):\s*(.*?)(\s+—\s+.*)?$/.exec(line);
    if (step) lastStep = `Step ${step[2]}: ${step[3]}`;
    const verdict = /⇒\s*(PASSED|FAILED|BLOCKED)/.exec(line);
    if (verdict && current) verdicts[current] = verdict[1];
  }
  const finished = Object.keys(verdicts).length;
  const livePassed = Object.values(verdicts).filter((v) => v === "PASSED").length;
  const liveFailed = Object.values(verdicts).filter((v) => v === "FAILED").length;
  const pct = total ? Math.round((finished / total) * 100) : 0;
  const showResults = !!result && status !== "idle";
  const showEditor = editable && !showResults;
  const showWorkspace = status !== "idle";
  const parsed = parseScenarioText(text);
  const lineNumbers = Array.from({ length: Math.max(1, text.split("\n").length) }, (_, i) => i + 1).join("\n");

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="phase-header"><ClipboardList size={14} /> Prompt testing</div>
          <div className="phase-title">
            {status === "running" ? "Running your scenarios" : showResults ? "Results" : "Write the scenarios to run"}
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 8, maxWidth: "72ch" }}>
            {status === "running"
              ? "The agent's browser is on the left and every action it takes is on the right."
              : "Write each scenario as steps and expected results. The agent carries out the steps on the live site and checks every expected result."}
          </div>
        </div>
        <span
          className={cx(
            "badge",
            status === "running" ? "badge-running" : status === "done" ? "badge-done"
              : status === "error" ? "badge-failed" : "badge-idle",
          )}
        >
          {status === "running" && <span className="spinner" style={{ width: 10, height: 10 }} />}
          {status === "running" ? "Running" : status === "done" ? "Finished" : status === "error" ? "Stopped" : "Ready"}
        </span>
      </div>

      {totals.needs_login > 0 && (
        <div className="wt-callout warn fade-up" style={{ alignItems: "center" }}>
          <TriangleAlert size={16} />
          <div style={{ flex: 1 }}>
            <div className="wt-callout-title">The site signed the agent out</div>
            Sign in again, then run the scenarios again.
          </div>
          {onSignInAgain && (
            <button className="btn" onClick={onSignInAgain}>
              <RefreshCw size={14} /> Sign in again
            </button>
          )}
        </div>
      )}

      {showEditor && (
        <div className="wt-compose fade-up">
          <div className="card wt-compose-main">
            <div className="wt-compose-top">
              <div className="wt-seg wt-seg-inline" role="tablist" aria-label="How to create scenarios">
                <button
                  type="button"
                  role="tab"
                  aria-selected={composeMode === "assist"}
                  className={cx(composeMode === "assist" && "active")}
                  onClick={() => setComposeMode("assist")}
                >
                  <Sparkles size={14} /> Describe it
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={composeMode === "write"}
                  className={cx(composeMode === "write" && "active")}
                  onClick={() => setComposeMode("write")}
                >
                  <PenLine size={14} /> Write or edit
                </button>
              </div>
              <div className="wt-compose-tools">
                <button className="btn btn-ghost" onClick={loadTemplate} disabled={assisting}>
                  <ClipboardList size={14} /> Template
                </button>
                <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={drafting || assisting}>
                  {drafting ? (<><span className="spinner" /> Reading document…</>) : (<><FileText size={14} /> From a document</>)}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  style={{ display: "none" }}
                  onChange={(e) => draftFromDocument(e.target.files?.[0])}
                />
                <button className="btn btn-ghost" onClick={() => excelRef.current?.click()} disabled={loadingExcel || drafting || assisting}>
                  {loadingExcel ? (<><span className="spinner" /> Reading sheet…</>) : (<><ClipboardList size={14} /> From an Excel sheet</>)}
                </button>
                <input
                  ref={excelRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  style={{ display: "none" }}
                  onChange={(e) => loadFromExcel(e.target.files?.[0])}
                />
              </div>
            </div>

            {composeMode === "assist" ? (
              <div className="wt-assist">
                <div>
                  <label className="label" htmlFor="wt-brief">What should be tested?</label>
                  <textarea
                    id="wt-brief"
                    className="input wt-brief"
                    rows={7}
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    onPaste={(e) => {
                      const files = [...(e.clipboardData?.files || [])];
                      if (files.length) {
                        e.preventDefault();
                        addImages(files);
                      }
                    }}
                    placeholder={"Explain it in your own words, the way you would to a tester. For example:\n\nAdd a vendor with a name and a phone number, search for it, change the phone and check the list shows the new number. Also check the form refuses a phone like \"abc\"."}
                    disabled={assisting}
                  />
                </div>
                <div className="wt-chips">
                  {ASSIST_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      className="wt-chip-btn"
                      onClick={() => setBrief((b) => (b.trim() ? `${b.trim()}\n${ex}` : ex))}
                      disabled={assisting}
                    >
                      + {ex}
                    </button>
                  ))}
                </div>
                <div
                  className={cx("wt-drop", dragOver && "over")}
                  role="button"
                  tabIndex={0}
                  onClick={() => imageRef.current?.click()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && imageRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    addImages(e.dataTransfer.files);
                  }}
                >
                  <ImagePlus size={22} />
                  <div>
                    <div className="wt-drop-title">Add screenshots of the screens to test (optional)</div>
                    <div className="wt-drop-desc">Drop, paste or choose up to 8 images. The assistant uses the button and field names it sees.</div>
                  </div>
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      addImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
                {images.length > 0 && (
                  <div className="wt-thumbs">
                    {images.map((img) => (
                      <div key={img.id} className="wt-thumb" title={img.file.name}>
                        <img src={img.url} alt={img.file.name} />
                        <button
                          type="button"
                          className="wt-thumb-x"
                          onClick={() => removeImage(img.id)}
                          aria-label={`Remove ${img.file.name}`}
                          disabled={assisting}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {assistError && (
                  <div className="wt-callout warn fade-up" role="alert">
                    <TriangleAlert size={16} />
                    <div>
                      <div className="wt-callout-title">The scenarios could not be written</div>
                      {assistError}
                    </div>
                  </div>
                )}
                <button
                  className="btn btn-primary wt-cta"
                  onClick={writeWithAssistant}
                  disabled={assisting || drafting || (!brief.trim() && images.length === 0)}
                >
                  {assisting ? (
                    <><span className="spinner" /> Writing scenarios…</>
                  ) : (
                    <><Sparkles size={15} /> {text.trim() ? "Rewrite the scenarios" : "Write the scenarios"}</>
                  )}
                </button>
              </div>
            ) : (
              <div className="wt-editor-wrap">
                <div className="wt-insert" aria-label="Insert">
                  {["SCENARIO: ", "LOGIN: main", "DATA:", "STEPS:", "CHECKS:", "CLEANUP:", "{time}", "{digits}"].map((tok) => (
                    <button key={tok} type="button" className="wt-chip-btn mono" onClick={() => insertToken(tok)}>
                      {tok.trim()}
                    </button>
                  ))}
                </div>
                <div className="wt-editor">
                  <pre className="wt-gutter" ref={gutterRef} aria-hidden="true">{lineNumbers}</pre>
                  <textarea
                    ref={editorRef}
                    className="wt-code"
                    spellCheck={false}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onScroll={(e) => {
                      if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
                    }}
                    placeholder={"SCENARIO: Vendor: create and find\nLOGIN: main\nDATA:\n  Company = AT-VENDOR-{digits}\nSTEPS:\n  1. …\nCHECKS:\n  - …"}
                    aria-label="Scenario text"
                  />
                </div>
                <details className="wt-guide">
                  <summary>How to write a scenario the agent runs reliably</summary>
                  <ul>
                    <li><b>One action per step</b>, using the words shown on screen (button and field names).</li>
                    <li><b>Each check says what to look at and the expected value</b>, e.g. the list shows the company with its new phone.</li>
                    <li><b>Unique values:</b> <code>{"{time}"}</code> for names, <code>{"{digits}"}</code> for number-only fields such as phones.</li>
                    <li><b>Respect field limits:</b> a phone field that keeps 14 characters needs a value of 14 or fewer.</li>
                    <li>If a screen shows only a summary (a count on a calendar, a card), add a step that <b>opens the detail</b> before the check.</li>
                    <li>A check written as <code>{'Email: "…" arrives'}</code> is verified in the signed-in user's Outlook.</li>
                  </ul>
                </details>
              </div>
            )}
          </div>

          <aside className="card wt-preview" aria-live="polite">
            <div className="wt-preview-head">
              <div>
                <div className="wt-section-title">Scenarios</div>
                <div className="wt-section-desc">
                  {assisting
                    ? "The assistant is writing them…"
                    : parsed.length
                      ? `${parsed.length} ready to run`
                      : "They appear here as you describe or write them."}
                </div>
              </div>
              {parsed.length > 0 && !assisting && composeMode === "assist" && (
                <button className="btn btn-ghost" onClick={() => setComposeMode("write")}>
                  <PenLine size={14} /> Edit
                </button>
              )}
            </div>
            <div className="wt-preview-list">
              {parsed.length === 0 && !assisting && (
                <div className="wt-preview-empty">
                  <ListChecks size={26} strokeWidth={1.5} />
                  <span>No scenarios yet</span>
                </div>
              )}
              {parsed.map((sc, i) => {
                const warn = scenarioWarnings(sc);
                return (
                  <div key={`${i}-${sc.title}`} className={cx("wt-sc", warn.length > 0 && !assisting && "warn")}>
                    <div className="wt-sc-title">{sc.title || "Untitled scenario"}</div>
                    <div className="wt-sc-meta">
                      <span>{sc.steps.length} step{sc.steps.length === 1 ? "" : "s"}</span>
                      <span>{sc.checks.length} check{sc.checks.length === 1 ? "" : "s"}</span>
                      {sc.cleanup.length > 0 && <span>clean-up</span>}
                      {sc.login && sc.login !== "main" && <span>as {sc.login}</span>}
                    </div>
                    {warn.length > 0 && !assisting && (
                      <div className="wt-sc-warn"><TriangleAlert size={12} /> {warn.join(", ")}</div>
                    )}
                    {sc.checks[0] && (
                      <div className="wt-sc-check"><CircleCheck size={12} /> {sc.checks[0]}</div>
                    )}
                  </div>
                );
              })}
              {assisting && (
                <div className="wt-sc skeleton">
                  <span className="wt-typing"><i /><i /><i /></span> Writing
                </div>
              )}
            </div>
          </aside>

          <div className="card wt-runbar">
            <label className={cx("wt-switch", allowChanges && "on")}>
              <input type="checkbox" checked={allowChanges} onChange={(e) => setAllowChanges(e.target.checked)} />
              <span className="wt-switch-track"><span className="wt-switch-thumb" /></span>
              <span>
                <b>Allow creating and submitting test records</b>
                <span className="wt-switch-desc">
                  Needed for scenarios that save, submit, approve or delete. When off, those steps are reported as blocked and nothing changes.
                </span>
              </span>
            </label>
            <button
              className="btn btn-primary wt-run"
              onClick={startRun}
              // !userId matches the exploration and phase-3 buttons. Without it
              // this was the one flow that could start a run while the app was
              // signed in but had not resolved who the user is, so the request
              // went out with no user_id and the usage was billed to nobody.
              disabled={!text.trim() || !userId || status === "running" || drafting || assisting}
            >
              <Play size={15} /> {parsed.length ? `Run ${parsed.length} scenario${parsed.length === 1 ? "" : "s"}` : "Run scenarios"}
            </button>
          </div>
        </div>
      )}

      {status === "running" && (
        <div className="wt-live fade-up" aria-live="polite">
          <div className="wt-live-main">
            <div className="wt-live-kicker">
              <Activity size={13} /> {total ? `Scenario ${current} of ${total}` : "Starting"}
            </div>
            <div className="wt-live-title">{currentTitle || "Opening the site with the saved session"}</div>
            {lastStep && <div className="wt-live-step">{lastStep}</div>}
          </div>
          <div className="wt-report-chips">
            <span className="wt-mini ok">{livePassed} passed</span>
            <span className="wt-mini bad">{liveFailed} failed</span>
            {total ? <span className="wt-mini">{Math.max(0, total - finished)} to go</span> : null}
          </div>
          <button
            className="btn btn-danger"
            onClick={stopRun}
            disabled={!runId || stopping}
            title="Stop after the current action, keep the sign-in, and go back to editing the scenarios"
          >
            {stopping ? (<><span className="spinner" /> Stopping…</>) : (<><Square size={12} fill="currentColor" /> Stop and edit</>)}
          </button>
          <div className="wt-live-track">
            <div className="wt-live-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {showResults && (
        <div className="card fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {Object.entries(SCENARIO_STATUS_STYLE).map(([k, st]) =>
              totals[k] ? (
                <span
                  key={k}
                  className={cx("wt-mini", k === "passed" ? "ok" : k === "blocked" ? "warn" : k === "needs_login" ? "" : "bad")}
                >
                  {totals[k]} {st.label.toLowerCase()}
                </span>
              ) : null,
            )}
            <button className="btn" style={{ marginLeft: "auto", fontSize: 12.5 }} onClick={() => setStatus("idle")}>
              <PenLine size={14} /> Edit and run again
            </button>
            <button
              className="btn"
              style={{ fontSize: 12.5 }}
              onClick={finishAndCleanUp}
              disabled={cleaning}
              title="Delete the saved sign-in and the screenshots of this session's runs"
            >
              {cleaning ? "Cleaning up…" : "Finish & clean up"}
            </button>
          </div>
          {(result.scenarios || []).map((sc) => {
            const st = SCENARIO_STATUS_STYLE[sc.status] || SCENARIO_STATUS_STYLE.error;
            const isOpen = !!open[sc.id];
            return (
              <div key={sc.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setOpen((o) => ({ ...o, [sc.id]: !o[sc.id] }))}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 12, padding: "10px 14px", background: st.bg, border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    {sc.id} · {sc.title}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>
                    {st.label} {isOpen ? <ChevronUp size={14} className="wt-inline-icon" /> : <ChevronDown size={14} className="wt-inline-icon" />}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "10px 14px", fontSize: 12.5, lineHeight: 1.6 }}>
                    {sc.note && <div style={{ color: C.muted, marginBottom: 6 }}>{sc.note}</div>}
                    {(sc.steps || []).map((s, i) => (
                      <div key={`s${i}`}>
                        <StatusIcon ok={s.status === "done"} blocked={s.status === "blocked"} /> Step {i + 1}: {s.text}
                        {s.note && <span style={{ color: C.muted }}> — {s.note}</span>}
                      </div>
                    ))}
                    {(sc.checks || []).map((c, i) => (
                      <div key={`c${i}`} style={{ marginTop: 4 }}>
                        <StatusIcon ok={c.passed} /> <b>Check:</b> {c.text}
                        <div style={{ color: C.muted, marginLeft: 20 }}>{c.evidence}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showWorkspace && (
        <div className="wt-workspace">
          <ScreenPanel
            src={screenshot}
            scanning={status === "running"}
            url={targetUrl}
            label={
              <div className="wt-panel-head">
                <span>Live browser</span>
                <span className={cx("badge", status === "running" ? "badge-running" : "badge-idle")}>
                  {status === "running" ? "Live" : "Last screen"}
                </span>
              </div>
            }
          />
          <ActivityTimeline logs={logs} running={status === "running"} />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE REVIEW — Human review of Expected Results before Phase 3
// ════════════════════════════════════════════════════════════════════════════
function PhaseReview({
  defaultParentSessionId = "",
  authorization,
  onAuthorized,
}) {
  const { user } = useSelector((state) => state.profile);
 // const userId = "68e8de5e3691291828e4ac8e";
 const userId = user?._id;
  const [parentSessionId, setParentSessionId] = useState(
    defaultParentSessionId,
  );
  const [status, setStatus] = useState("idle");
  const [sheets, setSheets] = useState([]);
  const [edits, setEdits] = useState({});
  const [saveMsg, setSaveMsg] = useState(null);

  // Credit estimate for this run. Priced entirely server-side from what the
  // AI engine wrote to Mongo — nothing here is sent to the server as input.
  const [estimate, setEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState(null);

  // Every plan is quoted and approved on the capacity charge. Managed plans
  // additionally pay for the model calls the run makes, so their quote is a
  // floor rather than a total — the panel says so.
  const billsUsage = !!user?.creditAccount?.billsUsage;

  useEffect(() => {
    if (defaultParentSessionId && userId) {
      loadReview(defaultParentSessionId, userId);
    }
  }, [defaultParentSessionId, userId]);

  const fetchEstimate = async (pid) => {
    if (!pid) return;
    setEstimateLoading(true);
    setEstimateError(null);
    const result = await getCreditEstimate(pid);
    setEstimateLoading(false);
    if (result.ok) {
      setEstimate(result.data);
    } else {
      setEstimate(null);
      setEstimateError(result.message);
    }
  };

  const loadReview = async (pid = parentSessionId, uid = userId) => {
    if (!pid || !uid || !pid.trim() || !uid.trim()) return;
    setStatus("loading");
    setSheets([]);
    setSaveMsg(null);
    setEdits({});
    try {
      const r = await fetch(
        `${API}/phase-review/${encodeURIComponent(pid)}?user_id=${encodeURIComponent(uid)}`,
      );
      const d = await r.json();
      if (!r.ok) {
        setStatus("error");
        setSaveMsg({ type: "error", text: d.detail || "Failed to load" });
        return;
      }
      setSheets(d.sheets || []);
      setStatus((d.sheets || []).length > 0 ? "loaded" : "empty");

      // Price the run once the engine has reported its story counts. This also
      // reconciles the discovery hold down to the real URL count, returning
      // whatever was over-held.
      //
      // Every plan is quoted. On Managed the quote covers the capacity charge
      // and model usage is added on top as it runs — see CreditEstimatePanel.
      if ((d.sheets || []).length > 0) {
        await fetchEstimate(pid);
      }
    } catch (e) {
      setStatus("error");
      setSaveMsg({ type: "error", text: `Load failed: ${e}` });
    }
  };

  const handleEdit = (session_id, row_num, value) => {
    setEdits((prev) => ({ ...prev, [`${session_id}__${row_num}`]: value }));
  };

  const saveChanges = async () => {
    const updates = Object.entries(edits).map(([key, expected_result]) => {
      const [session_id, row_num_str] = key.split("__");
      return {
        session_id,
        row_num: parseInt(row_num_str, 10),
        expected_result,
      };
    });
    if (updates.length === 0) {
      setSaveMsg({ type: "error", text: "No changes to save." });
      return;
    }
    setStatus("saving");
    setSaveMsg(null);
    try {
      const r = await fetch(
        `${API}/phase-review/${encodeURIComponent(parentSessionId)}/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          // user_id comes from the token now; the server ignores it in the body.
          body: JSON.stringify({ updates }),
        },
      );
      const d = await r.json();
      if (!r.ok) {
        setStatus("loaded");
        setSaveMsg({ type: "error", text: d.detail || "Save failed" });
        return;
      }
      if (d.errors?.length > 0) {
        setSaveMsg({
          type: "error",
          text: `Saved with errors: ${d.errors.map((e) => e.error).join(", ")}`,
        });
        setStatus("loaded");
      } else {
        setSaveMsg({
          type: "success",
          text: `✅ ${updates.length} change${updates.length !== 1 ? "s" : ""} saved to S3.`,
        });
        setEdits({});
        await loadReview();
      }
    } catch (e) {
      setStatus("loaded");
      setSaveMsg({ type: "error", text: `Save failed: ${e}` });
    }
  };

  const dirtyCount = Object.keys(edits).length;

  return (
    <div
      className="fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div>
        <div className="phase-header">Review</div>
        <div className="phase-title">Review & Edit Expected Results</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
          Inspect the test stories generated by Phase 2 and correct expected
          results before running Phase 3 validation.
        </div>
      </div>

      <div className="card fade-up" style={{ maxWidth: 600 }}>
        <label className="label">
          Parent Session ID <span style={{ color: C.red }}>*</span>
        </label>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
          Enter the session_id from a completed Phase 2 run.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            className="input"
            placeholder="e.g. 20240326_143022"
            value={parentSessionId}
            onChange={(e) => setParentSessionId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadReview()}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={() => loadReview()}
            disabled={
              !parentSessionId.trim() || !userId || status === "loading"
            }
          >
            {status === "loading" ? "Loading…" : "Load"}
          </button>
        </div>
      </div>

      {/* Cost first, before the user scrolls through the story tables. */}
      {(status === "loaded" || status === "saving") && (
        <CreditEstimatePanel
          estimate={estimate}
          loading={estimateLoading}
          error={estimateError}
          billsUsage={billsUsage}
          onRefresh={() => fetchEstimate(parentSessionId)}
        />
      )}

      {(status === "loaded" || status === "saving") &&
        sheets.map((sheet) => (
          <div key={sheet.session_id} className="card fade-up">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                {sheet.page_url}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.muted,
                  fontFamily: "monospace",
                }}
              >
                {sheet.session_id}
              </div>
              {sheet.review_updated_at && (
                <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>
                  Last reviewed:{" "}
                  {new Date(sheet.review_updated_at).toLocaleString()}
                </div>
              )}
              {sheet.error && (
                <div style={{ fontSize: 12, color: C.red, marginTop: 4 }}>
                  ⚠ {sheet.error}
                </div>
              )}
            </div>

            {sheet.rows?.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: C.surface,
                        borderBottom: `2px solid ${C.border}`,
                      }}
                    >
                      {[
                        "Feature / Context",
                        "Test Steps",
                        "Expected Result",
                        "Data",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 12px",
                            textAlign: "left",
                            fontWeight: 600,
                            color: C.muted,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.map((row, i) => {
                      const editKey = `${sheet.session_id}__${row.row_num}`;
                      const currentValue =
                        editKey in edits ? edits[editKey] : row.expected_result;
                      const isDirty =
                        editKey in edits &&
                        edits[editKey] !== row.expected_result;
                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: `1px solid ${C.border}`,
                            background: isDirty ? "#fffbeb" : "white",
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              maxWidth: 200,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 500,
                                wordBreak: "break-word",
                              }}
                            >
                              {row.feature}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              maxWidth: 280,
                              color: C.muted,
                              fontFamily: "monospace",
                              fontSize: 11,
                              wordBreak: "break-word",
                            }}
                          >
                            {row.test_steps}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              minWidth: 240,
                            }}
                          >
                            <textarea
                              rows={3}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                border: `1px solid ${isDirty ? C.yellow : C.border}`,
                                borderRadius: 6,
                                fontSize: 13,
                                fontFamily: "inherit",
                                resize: "vertical",
                                background: isDirty ? "#fffbeb" : "white",
                                outline: "none",
                                cursor: "text",
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = C.accent;
                                e.target.style.boxShadow = `0 0 0 2px ${C.accent}22`;
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = isDirty
                                  ? C.yellow
                                  : C.border;
                                e.target.style.boxShadow = "none";
                              }}
                              value={currentValue}
                              onChange={(e) =>
                                handleEdit(
                                  sheet.session_id,
                                  row.row_num,
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              verticalAlign: "top",
                              fontSize: 12,
                              color: C.muted,
                              maxWidth: 160,
                              wordBreak: "break-word",
                            }}
                          >
                            {row.data || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.muted }}>
                No EXPLORE rows found in this sheet.
              </div>
            )}
          </div>
        ))}

      {(status === "loaded" || status === "saving") && (
        <div
          className="card fade-up"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: dirtyCount > 0 ? C.yellow : C.muted,
              fontWeight: dirtyCount > 0 ? 600 : 400,
            }}
          >
            {dirtyCount > 0
              ? `${dirtyCount} unsaved change${dirtyCount !== 1 ? "s" : ""}`
              : "No unsaved changes"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {saveMsg && (
              <div
                style={{
                  fontSize: 13,
                  color: saveMsg.type === "success" ? C.green : C.red,
                  fontWeight: 500,
                }}
              >
                {saveMsg.text}
              </div>
            )}
            <button
              className="btn"
              onClick={saveChanges}
              disabled={dirtyCount === 0 || status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Save Changes"}
            </button>

            {/* Edit → save → approve, in reading order, in one bar. Every plan
                approves its capacity charge before Phase 3 runs. */}
            <RunApprovalGate
              estimate={estimate}
              parentSessionId={parentSessionId}
              authorization={authorization}
              onAuthorized={onAuthorized}
            />
          </div>
        </div>
      )}

      {status === "empty" && (
        <div className="card fade-up" style={{ fontSize: 14, color: C.muted }}>
          No Excel sheets found for this session. Make sure Phase 2 has
          completed successfully.
        </div>
      )}

      {status === "error" && saveMsg && (
        <div className="card fade-up" style={{ fontSize: 13, color: C.red }}>
          {saveMsg.text}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CREDIT GATE — price the run, then get explicit approval before spending
//
// These three components live in this file (rather than components/UI) on
// purpose: this page uses an inline `C` palette and inline styles, not the
// Tailwind used elsewhere in the app. A Tailwind component dropped in here
// would look spliced on.
// ════════════════════════════════════════════════════════════════════════════

/**
 * Live model-usage meter — Managed plans only.
 *
 * This is NOT the price of the run. The run's capacity credits were quoted and
 * approved on the Review tab; this shows the model usage being charged ON TOP
 * of them, as it accrues. Fed by the `usage` and `activity` events the engine
 * pushes over the existing WebSocket.
 *
 * The credit figure here is CLIENT-SIDE and optimistic — it converts streamed
 * token counts at the same published rates the server uses, so the number moves
 * immediately instead of waiting on the billing pass. The authoritative balance
 * arrives separately over `credits:update` and overrides it. A brief
 * disagreement of hundredths of a credit is expected and harmless; showing a
 * frozen number for 20 seconds is not.
 */
function LiveUsageMeter({ live, account }) {
  const spent = live.credits;
  const balance = account?.balance;

  return (
    <div className="card fade-up" style={{ borderLeft: `3px solid ${C.cyan}` }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
            Model usage this run{" "}
            <span style={{ opacity: 0.8 }}>(on top of capacity credits)</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>
            {spent.toFixed(2)}
            <span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>
              {" "}
              credits
            </span>
          </div>
        </div>

        {typeof balance === "number" && !account?.unlimited && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
              Balance remaining
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: balance <= 0 ? C.red : C.text,
              }}
            >
              {balance.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {live.action && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
            fontSize: 13,
            color: C.text,
          }}
        >
          <span style={{ color: C.cyan }}>▸</span> {live.action}
          {live.model && (
            <span style={{ color: C.muted, fontSize: 12 }}> · {live.model}</span>
          )}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: C.muted }}>
        {live.calls.toLocaleString()} model call
        {live.calls === 1 ? "" : "s"} ·{" "}
        {(live.inputTokens + live.outputTokens).toLocaleString()} tokens
        {balance <= 0 && (
          <span style={{ color: C.yellow }}>
            {" "}
            · Balance exhausted — this run will finish and the difference will be
            billed as overage.
          </span>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: C.muted, opacity: 0.75 }}>
        Live figure — settles to the exact amount when the run completes.
      </div>
    </div>
  );
}

/** Per-URL cost breakdown, shown before the user scrolls through the stories. */
function CreditEstimatePanel({ estimate, loading, error, billsUsage, onRefresh }) {
  if (loading) {
    return (
      <div className="card fade-up" style={{ fontSize: 13, color: C.muted }}>
        Calculating credit cost…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card fade-up" style={{ fontSize: 13, color: C.yellow }}>
        Could not load the credit estimate: {error}
        {onRefresh && (
          <button
            className="btn"
            style={{ marginLeft: 12 }}
            onClick={onRefresh}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!estimate) return null;

  const {
    perUrl = [],
    totalStories,
    totalCredits,
    alreadyHeld,
    topUpRequired,
    balance,
    balanceAfterRun,
    estimateIncomplete,
    oversizedUrls = [],
    enforced,
  } = estimate;

  return (
    <div className="card fade-up">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>
          {billsUsage ? "Capacity cost for this run" : "Credit cost for this run"}
        </div>
        <div style={{ fontSize: 12, color: C.muted }}>
          {perUrl.length} page{perUrl.length !== 1 ? "s" : ""} · {totalStories} test
          stor{totalStories === 1 ? "y" : "ies"}
        </div>
      </div>

      {/* On a Managed plan this quote is a FLOOR, not the total — the model
          calls are charged on top. Saying so here is what stops the first
          invoice reading as a bait-and-switch. */}
      {billsUsage && (
        <div
          style={{
            marginBottom: 14,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(6,182,212,0.06)",
            border: `1px solid ${C.border}`,
            fontSize: 12,
            color: C.muted,
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: C.text, fontWeight: 600 }}>
            Plus model usage.
          </span>{" "}
          Your plan includes the AI provider cost, so the OpenAI / Claude calls
          this run makes are charged in addition to the credits below. That part
          is metered as it runs and shown live.
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: C.muted, fontSize: 12 }}>
              <th style={{ padding: "6px 8px", fontWeight: 600 }}>Page</th>
              <th style={{ padding: "6px 8px", fontWeight: 600, width: 90 }}>Stories</th>
              <th style={{ padding: "6px 8px", fontWeight: 600, width: 80 }}>Credits</th>
            </tr>
          </thead>
          <tbody>
            {perUrl.map((line) => (
              <tr
                key={line.sessionId || line.pageUrl}
                style={{ borderTop: `1px solid ${C.border}` }}
              >
                <td
                  style={{
                    padding: "8px",
                    color: C.text,
                    maxWidth: 420,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={line.pageUrl}
                >
                  {line.pageUrl || line.sessionId}
                  {line.oversized && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.yellow,
                      }}
                    >
                      NEEDS APPROVAL
                    </span>
                  )}
                  {!line.storyCountKnown && (
                    <span
                      style={{ marginLeft: 8, fontSize: 11, color: C.muted }}
                    >
                      (estimated)
                    </span>
                  )}
                </td>
                <td style={{ padding: "8px", color: C.muted }}>{line.storyCount}</td>
                <td style={{ padding: "8px", color: C.text, fontWeight: 600 }}>
                  {line.credits}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `2px solid ${C.border}` }}>
              <td style={{ padding: "10px 8px", fontWeight: 700, color: C.text }}>
                Total
              </td>
              <td style={{ padding: "10px 8px", fontWeight: 700, color: C.text }}>
                {totalStories}
              </td>
              <td style={{ padding: "10px 8px", fontWeight: 700, color: C.text }}>
                {totalCredits}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          fontSize: 13,
        }}
      >
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase" }}>
            Already held
          </div>
          <div style={{ fontWeight: 700, color: C.text }}>{alreadyHeld}</div>
        </div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase" }}>
            Charged now
          </div>
          <div style={{ fontWeight: 700, color: C.accent }}>{topUpRequired}</div>
        </div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase" }}>
            Balance
          </div>
          <div style={{ fontWeight: 700, color: C.text }}>{balance}</div>
        </div>
        <div>
          <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase" }}>
            After this run
          </div>
          <div
            style={{
              fontWeight: 700,
              color: balanceAfterRun < 0 ? C.red : C.green,
            }}
          >
            {balanceAfterRun}
          </div>
        </div>
      </div>

      {/* Credits already held during discovery are a down payment on the same
          total, not an extra charge — say so, or "Already held" looks like
          double billing. */}
      <div style={{ marginTop: 12, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        Credits held while we discovered your pages count towards this total — you're
        only charged the difference.
      </div>

      {estimateIncomplete && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.yellow }}>
          Some pages haven't been counted yet, so they're priced at the maximum. Load
          this review screen again for an exact quote.
        </div>
      )}

      {oversizedUrls.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.yellow }}>
          {oversizedUrls.length} page{oversizedUrls.length !== 1 ? "s" : ""} produced an
          unusually large number of test stories and will need your explicit approval.
        </div>
      )}

      {enforced === false && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
          Credit enforcement is currently disabled — this is an estimate only.
        </div>
      )}
    </div>
  );
}

/** Blocking modal for HTTP 402. */
function InsufficientCreditsModal({ detail, onClose }) {
  if (!detail) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,30,91,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{ maxWidth: 440, width: "100%", textAlign: "center" }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Not enough credits
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
          {detail.message}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ color: C.muted, fontSize: 11 }}>NEEDED</div>
            <div style={{ fontWeight: 700, color: C.text }}>{detail.required}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11 }}>AVAILABLE</div>
            <div style={{ fontWeight: 700, color: C.text }}>{detail.available}</div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11 }}>SHORT BY</div>
            <div style={{ fontWeight: 700, color: C.red }}>{detail.shortfall}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <Link to="/upgrade-plan" className="btn btn-primary">
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Per-URL confirmation for HTTP 409 (a page produced too many stories).
 *
 * Layout: title and "select all" on top, the page list scrolls in the middle,
 * and the buttons stay pinned at the bottom of the dialog. The buttons used to
 * sit after the list inside one scrolling card, so with six pages they were
 * below the fold - and the dimmed "Approve" button of the page behind looked
 * like the one to press.
 */
function OversizedApprovalModal({ detail, onConfirm, onClose, busy }) {
  const urls = detail?.oversizedUrls || [];
  const [acked, setAcked] = useState({});
  const ackedCount = urls.filter((u) => acked[u.sessionId]).length;
  const allAcked = urls.length > 0 && ackedCount === urls.length;
  const totalStories = urls.reduce((n, u) => n + (u.storyCount || 0), 0);

  if (!detail) return null;

  const setAll = (checked) =>
    setAcked(Object.fromEntries(urls.map((u) => [u.sessionId, checked])));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="oversized-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(12,30,91,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 560,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{ padding: "20px 20px 12px" }}>
          <div id="oversized-title" style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            Confirm large pages
          </div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>
            {detail.message} Approve each one to continue.
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              color: C.text,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={allAcked}
              onChange={(e) => setAll(e.target.checked)}
            />
            Select all {urls.length} pages ({totalStories} stories)
          </label>
          {/* the action, right at the top too: never below the fold */}
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!allAcked || busy}
            style={{ width: "100%", marginTop: 14, padding: "12px 16px", fontSize: 15, fontWeight: 700 }}
          >
            {busy
              ? "Authorizing…"
              : allAcked
                ? `✅ Approve & charge ${detail.topUpRequired} credits`
                : `Tick all ${urls.length} pages to approve (${ackedCount} of ${urls.length})`}
          </button>
        </div>

        {/* scrolling list */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {urls.map((u) => (
            <label
              key={u.sessionId}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: 12,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={!!acked[u.sessionId]}
                onChange={(e) =>
                  setAcked((prev) => ({ ...prev, [u.sessionId]: e.target.checked }))
                }
                style={{ marginTop: 3 }}
              />
              <span style={{ fontSize: 13, color: C.text, minWidth: 0 }}>
                <span style={{ display: "block", wordBreak: "break-all" }}>
                  {u.pageUrl || u.sessionId}
                </span>
                <span style={{ color: C.muted, fontSize: 12 }}>
                  I approve running {u.storyCount} test stories for this page (
                  {u.credits} credits)
                </span>
              </span>
            </label>
          ))}
        </div>

        {/* pinned footer: always visible, never scrolls away */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: allAcked ? C.text : C.muted, marginRight: "auto" }}>
            {allAcked
              ? `All ${urls.length} pages approved`
              : `${ackedCount} of ${urls.length} approved - tick every page to continue`}
          </span>
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!allAcked || busy}
            title={allAcked ? "" : "Tick every page (or Select all) first"}
          >
            {busy
              ? "Authorizing…"
              : `Approve & charge ${detail.topUpRequired} credits`}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The approval action itself.
 *
 * NOTE: this is a client-side gate only. The browser talks to the FastAPI
 * engine directly with no auth, so a determined user can still POST
 * /phase3/start by hand. The real fix is proxying that call through Express;
 * until then this stops accidents, not attackers.
 */
function RunApprovalGate({ estimate, parentSessionId, authorization, onAuthorized }) {
  const [busy, setBusy] = useState(false);
  const [insufficient, setInsufficient] = useState(null);
  const [oversized, setOversized] = useState(null);
  const [message, setMessage] = useState(null);

  const authorized =
    !!authorization && authorization.parentSession === parentSessionId;

  const submit = async (acknowledgedOversized) => {
    setBusy(true);
    setMessage(null);
    const result = await authorizeRun(parentSessionId, { acknowledgedOversized });
    setBusy(false);

    if (result.ok) {
      setOversized(null);
      setInsufficient(null);
      setMessage(result.message);
      onAuthorized({ ...result.data, parentSession: parentSessionId });
      return;
    }

    if (result.code === "INSUFFICIENT_CREDITS") {
      setInsufficient(result.data);
    } else if (result.code === "OVERSIZED_URL_REQUIRES_APPROVAL") {
      setOversized(result.data);
    } else {
      setMessage(result.message);
    }
  };

  if (!estimate) return null;

  if (authorized) {
    return (
      <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
        ✓ Run authorized — {authorization.creditsHeld} credit
        {authorization.creditsHeld === 1 ? "" : "s"} held. Continue to Validation.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {message && (
          <span style={{ fontSize: 13, color: C.red }}>{message}</span>
        )}
        <button
          className="btn btn-primary"
          onClick={() => submit(false)}
          disabled={busy || estimate.urlCount === 0}
          title={
            estimate.sufficient === false
              ? "Not enough credits — contact your administrator"
              : undefined
          }
        >
          {busy
            ? "Authorizing…"
            : `Approve & charge ${estimate.topUpRequired} credit${
                estimate.topUpRequired === 1 ? "" : "s"
              }`}
        </button>
      </div>

      <InsufficientCreditsModal
        detail={insufficient}
        onClose={() => setInsufficient(null)}
      />
      <OversizedApprovalModal
        detail={oversized}
        busy={busy}
        onClose={() => setOversized(null)}
        onConfirm={() => submit(true)}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE 3 — MongoDB-Driven Validation (Manual Trigger)
// ════════════════════════════════════════════════════════════════════════════
function PhaseValidationMongoDB({
  onStatusChange,
  parentSessionId,
  setParentSessionId,
  authorization,
}) {
  const [status, setStatus] = useState("idle");
  const [sessions, setSessions] = useState([]);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  //const userId = "68e8de5e3691291828e4ac8e";
  const userId = user?._id;

  // Managed plans pay model usage on top of the approved capacity charge, so
  // they get a running total of that additional spend during the run.
  const billsUsage = !!user?.creditAccount?.billsUsage;
  const {
    live: liveUsage,
    ingest: ingestLiveUsage,
    reset: resetLiveUsage,
  } = useLiveUsage();

  const [progress, setProgress] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0,
  });

  const [taskProgress, setTaskProgress] = useState({ done: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const [screenshot, setScreenshot] = useState(null);
  // Keyed by `${session_id}:${file_type}` while a download is in flight.
  const [downloading, setDownloading] = useState({});
  const [globalBatchReport, setGlobalBatchReport] = useState(null);
  const wsRef = useRef(null);

  const activeSessionItem = sessions.find(
    (s) => s.phase3_status === "in_progress",
  );
  const activeSessionId = activeSessionItem?.session_id || null;

  // Pull the file through fetch rather than navigating to it, so we know when
  // it has actually arrived. A plain <a href> gives no completion signal, which
  // left the link on screen after the server had already consumed the file —
  // so the next click returned "already downloaded".
  const downloadReport = async (session, fileType) => {
    const key = `${session.session_id}:${fileType}`;
    if (downloading[key]) return;
    setDownloading((p) => ({ ...p, [key]: true }));

    const clearLink = () => {
      const field =
        fileType === "test_report" ? "s3_download_url" : "final_s3_url";
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === session.session_id ? { ...s, [field]: null } : s,
        ),
      );
    };

    try {
      const res = await fetch(
        `${API}/excel/${session.session_id}/download/${fileType}`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        pushLog(`❌ ${body.detail || `Download failed (${res.status})`}`, "red");
        // 404/410 mean the file is genuinely gone — retire the link so it
        // stops offering something that cannot be delivered.
        if (res.status === 410 || res.status === 404) clearLink();
        return;
      }

      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename =
        (match && match[1]) || `${fileType}_${session.session_id}.xlsx`;

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);

      pushLog(`📥 Downloaded ${filename}`, "green");

      // The server deletes only once Phase 3 has finished; mirror that rule
      // so the link survives a mid-run download of the test report.
      if (session.phase3_status === "completed") clearLink();
    } catch (err) {
      pushLog(`❌ Download error: ${err.message}`, "red");
    } finally {
      setDownloading((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (onStatusChange) onStatusChange(status);
  }, [status, onStatusChange]);

  const pushLog = (msg, color = "white") =>
    setLogs((p) => [...p, { message: msg, color }]);

  useInterval(
    async () => {
      if (!parentSessionId || status !== "running") return;
      try {
        const r = await fetch(`${API}/phase3/status/${parentSessionId}`);
        const d = await r.json();

        if (d.sessions) {
          setSessions(d.sessions);
          setProgress({
            pending: d.pending || 0,
            in_progress: d.in_progress || 0,
            completed: d.completed || 0,
            failed: d.failed || 0,
          });
        }
      } catch (e) {
        console.warn(`Status poll failed: ${e}`);
      }
    },
    status === "running" ? 5000 : null,
  );

  const startPhase3 = async () => {
    if (!parentSessionId.trim()) {
      pushLog("❌ Please enter a parent session ID", "red");
      return;
    }

    // Credit gate. Client-side only: the browser calls the AI engine directly
    // with no auth, so this stops accidents rather than determined bypass.
    // Proxying /phase3/start through Express is the real fix.
    //
    // Every plan needs its capacity charge approved first.
    if (!authorization || authorization.parentSession !== parentSessionId) {
      pushLog(
        "❌ This run hasn't been authorized. Approve the credit estimate on the Review tab first.",
        "red",
      );
      setStatus("error");
      return;
    }

    setStatus("running");
    setLogs([]);
    setSessions([]);
    setTaskProgress({ done: 0, total: 0 });
    setGlobalBatchReport(null);
    setScreenshot(null);
    resetLiveUsage();

    pushLog(`🚀 Starting Phase 3 for session: ${parentSessionId}`, "cyan");

    try {
      const res = await fetch(`${API}/phase3/start/${parentSessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          anthropic_api_key: anthropicKey || undefined,
          api_key: openaiKey || undefined,
          user_id: userId || undefined,
        }),
      });

      const data = await res.json();

      if (data.error || res.status !== 200) {
        pushLog(
          `❌ Start Error: ${data.error || "Failed to initiate phase 3"}`,
          "red",
        );
        setStatus("error");
        return;
      }

      pushLog(
        `✓ ${data.message || `Found ${data.total_tasks} tasks to run`}`,
        "green",
      );

      const ws = new WebSocket(`${WS}/ws/phase3/${parentSessionId}`);
      wsRef.current = ws;

      ws.onopen = () => pushLog("✅ Connected to Phase 3 stream", "green");

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);

        switch (msg.type) {
          case "status":
            setSessions(msg.sessions || []);
            setProgress({
              pending: msg.pending || 0,
              in_progress: msg.in_progress || 0,
              completed: msg.completed || 0,
              failed: msg.failed || 0,
            });
            break;

          case "log":
            pushLog(msg.message, msg.color || "white");
            break;

          // Spend and activity from the engine. Display only — the
          // authoritative balance arrives separately over credits:update.
          case "usage":
          case "activity":
            ingestLiveUsage(msg);
            break;

          case "task_progress":
            setTaskProgress({ done: msg.tasks_done, total: msg.tasks_total });
            break;

          case "frame":
            const imgSrc =
              msg.image.startsWith("http") || msg.image.startsWith("data:")
                ? msg.image
                : `data:image/jpeg;base64,${msg.image}`;
            setScreenshot(imgSrc);
            break;

          case "batch_done":
            setStatus("done");
            setTaskProgress((p) => ({
              ...p,
              done: p.total > 0 ? p.total : 1,
              total: p.total > 0 ? p.total : 1,
            }));

            const summary = `(Passed: ${msg.completed || 0}, Failed: ${msg.failed || 0})`;
            pushLog(`🎉 Phase 3 complete ${summary}`, "green");

            // Settle the held credits now rather than making the customer
            // wait for the reconciler's next sweep. Safe to fire and forget:
            // settlement is idempotent and re-derives everything server-side.
            dispatch(settleRun(parentSessionId));

            if (msg.message === "Phase 3 complete" && msg.s3_download_url) {
              setGlobalBatchReport(msg.s3_download_url);
              pushLog(
                `📄 Batch Report generated: ${msg.excel_filename}`,
                "cyan",
              );
            }

            ws.close();
            wsRef.current = null;
            break;

          default:
            if (msg.message) {
              pushLog(msg.message, msg.type === "error" ? "red" : "white");
            }
            break;
        }
      };

      ws.onerror = () => pushLog("❌ WebSocket error", "red");

      ws.onclose = () => {
        if (wsRef.current !== null && status === "running") {
          pushLog("🔌 Connection closed unexpectedly", "yellow");
        }
        wsRef.current = null;
      };
    } catch (e) {
      pushLog(`❌ Start failed: ${e.message}`, "red");
      setStatus("error");
    }
  };

  const totalSess = sessions.length;
  const doneSess = progress.completed + progress.failed;
  const sessionPct =
    totalSess > 0 ? Math.round((doneSess / totalSess) * 100) : 0;

  const pct =
    taskProgress.total > 0
      ? Math.round((taskProgress.done / taskProgress.total) * 100)
      : sessionPct;

  return (
    <div
      className="fade-up"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div>
        <div className="phase-header">Validate</div>
        <div className="phase-title">MongoDB-Driven Test Execution</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>
          Run Phase 3 tests for any completed Phase 2 session
        </div>
      </div>

      {/* Model-usage charges accruing on top of this run's approved capacity
          credits. */}
      {billsUsage && (status === "running" || liveUsage.calls > 0) && (
        <LiveUsageMeter live={liveUsage} account={user?.creditAccount} />
      )}

      {status === "idle" && (
        <div className="card fade-up" style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">
              Anthropic API Key{" "}
              <span style={{ color: C.muted, fontWeight: 400 }}>
                (recommended)
              </span>
            </label>
            <input
              className="input"
              type="password"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">
              OpenAI API Key{" "}
              <span style={{ color: C.muted, fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <input
              className="input"
              type="password"
              placeholder="sk-proj-..."
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
          </div>

          <div style={{ height: 1, background: C.border, margin: "20px 0" }} />

          <label className="label">
            Parent Session ID <span style={{ color: C.red }}>*</span>
          </label>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
            Enter the parent session ID (e.g. 57d5b0ba) from Phase 2.
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              className="input"
              placeholder="e.g. 57d5b0ba"
              value={parentSessionId}
              onChange={(e) => setParentSessionId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startPhase3()}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={startPhase3}
              disabled={
                !parentSessionId.trim() ||
                !userId ||
                (!anthropicKey.trim() && !openaiKey.trim()) ||
                !authorization ||
                authorization.parentSession !== parentSessionId
              }
            >
              Start Phase 3
            </button>
          </div>

          {!anthropicKey.trim() && !openaiKey.trim() && (
            <div style={{ marginTop: 12, fontSize: 12, color: C.red }}>
              At least one API key is required to run validation tests.
            </div>
          )}

          {parentSessionId.trim() &&
            (!authorization || authorization.parentSession !== parentSessionId) && (
              <div style={{ marginTop: 12, fontSize: 12, color: C.yellow }}>
                Approve the credit estimate for this session on the{" "}
                <strong>2. Review</strong> tab before starting validation.
              </div>
            )}

          {authorization && authorization.parentSession === parentSessionId && (
            <div style={{ marginTop: 12, fontSize: 12, color: C.green }}>
              ✓ {authorization.creditsHeld} credit
              {authorization.creditsHeld === 1 ? "" : "s"} held for this run. Unused
              credits are returned automatically if it doesn't complete.
            </div>
          )}
        </div>
      )}

      {(status === "running" || status === "done" || status === "error") && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 13, color: C.muted }}>
              Session:{" "}
              <span className="font-mono" style={{ color: C.text }}>
                {parentSessionId}
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {globalBatchReport && (
                <a
                  href={globalBatchReport}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    background: C.green || "#10b981",
                    color: "white",
                    padding: "6px 12px",
                    fontSize: 13,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Global Batch Report
                </a>
              )}

              <span
                className={cx(
                  "badge",
                  status === "running"
                    ? "badge-running"
                    : status === "error"
                      ? "badge-failed"
                      : "badge-done",
                )}
              >
                {status === "running" && (
                  <span className="spinner" style={{ width: 10, height: 10 }} />
                )}
                {status}
              </span>
            </div>
          </div>

          <ScreenPanel
            src={screenshot}
            scanning={status === "running"}
            label={activeSessionId ? `Running: ${activeSessionId}` : "Idle"}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="card">
              <div style={{ marginBottom: 20 }}>
                <div className="stat-val">{Math.min(pct, 100)}%</div>
                <div className="stat-lbl">Completion Progress</div>
              </div>

              <div
                style={{
                  height: 8,
                  background: "#eef1f7",
                  borderRadius: 999,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: `${Math.min(pct, 100)}%`,
                    background: status === "done" ? C.green : C.accent,
                    transition: "width .5s ease",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                  marginTop: 20,
                }}
              >
                <div>
                  <div
                    className="stat-val"
                    style={{ fontSize: 20, color: C.muted }}
                  >
                    {progress.pending}
                  </div>
                  <div className="stat-lbl">Pending</div>
                </div>
                <div>
                  <div
                    className="stat-val"
                    style={{ fontSize: 20, color: C.accent }}
                  >
                    {progress.in_progress}
                  </div>
                  <div className="stat-lbl">Running</div>
                </div>
                <div>
                  <div
                    className="stat-val"
                    style={{ fontSize: 20, color: C.green }}
                  >
                    {progress.completed}
                  </div>
                  <div className="stat-lbl">Completed</div>
                </div>
                <div>
                  <div
                    className="stat-val"
                    style={{ fontSize: 20, color: C.red }}
                  >
                    {progress.failed}
                  </div>
                  <div className="stat-lbl">Failed</div>
                </div>
              </div>

              {sessions.length > 0 && (
                <div
                  style={{
                    marginTop: 20,
                    maxHeight: 300,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {sessions.map((s, i) => (
                    <div
                      key={i}
                      className={cx(
                        "test-item",
                        s.session_id === activeSessionId ? "active" : "",
                      )}
                      style={{
                        padding: "8px 12px",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          overflow: "hidden",
                        }}
                      >
                        {s.phase3_status === "completed" ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={C.green}
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : s.phase3_status === "failed" ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={C.red}
                            strokeWidth="3"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        ) : s.phase3_status === "in_progress" ? (
                          <span
                            className="spinner"
                            style={{
                              width: 10,
                              height: 10,
                              borderWidth: "2px",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: C.muted,
                            }}
                          />
                        )}

                        <span
                          className="font-mono"
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.page_url}
                        </span>

                        <span
                          className={cx(
                            "badge",
                            s.phase3_status === "completed"
                              ? "badge-done"
                              : s.phase3_status === "failed"
                                ? "badge-failed"
                                : s.phase3_status === "in_progress"
                                  ? "badge-running"
                                  : "badge-idle",
                          )}
                          style={{ fontSize: 9, padding: "2px 6px" }}
                        >
                          {s.phase3_status}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
                        {s.s3_download_url && (
                          <button
                            // Streams through the API, which deletes the file
                            // only after the bytes have been sent. The old
                            // presigned-URL + onClick-confirm pair raced, and
                            // the delete usually won — so the first download
                            // came back as an S3 error document.
                            onClick={() => downloadReport(s, "test_report")}
                            disabled={
                              !!downloading[`${s.session_id}:test_report`]
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              background: "rgba(107, 114, 128, 0.1)",
                              color: C.muted,
                              borderRadius: 6,
                              textDecoration: "none",
                              fontWeight: 600,
                              border: `1px solid rgba(107, 114, 128, 0.2)`,
                              transition: "all 0.2s ease",
                              cursor: "pointer",
                            }}
                            title="Download Initial Test Report"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {downloading[`${s.session_id}:test_report`]
                              ? "Downloading..."
                              : "Test Report"}
                          </button>
                        )}

                        {s.final_s3_url && (
                          <button
                            // Same streaming endpoint as the test report —
                            // delivery first, deletion after.
                            onClick={() => downloadReport(s, "final_report")}
                            disabled={
                              !!downloading[`${s.session_id}:final_report`]
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              background: "rgba(16, 185, 129, 0.1)",
                              color: C.green || "#10b981",
                              borderRadius: 6,
                              textDecoration: "none",
                              fontWeight: 600,
                              border: `1px solid rgba(16, 185, 129, 0.2)`,
                              transition: "all 0.2s ease",
                              cursor: "pointer",
                            }}
                            title="Download Final Validation Report"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {downloading[`${s.session_id}:final_report`]
                              ? "Downloading..."
                              : "Final Report"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <LogPanel logs={logs} />
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [phase, setPhase] = useState("login");
  const [activePhaseStatus, setActivePhaseStatus] = useState("idle");
  const [targetUrl, setTargetUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [mode, setMode] = useState("checking");
  const { user } = useSelector((state) => state.profile);
  //const userId = "68e8de5e3691291828e4ac8e";
  const userId = user?._id;
  const [activeSessionId, setActiveSessionId] = useState("");

  const [isTerminating, setIsTerminating] = useState(false);
  const [phase3SessionId, setPhase3SessionId] = useState("");

  // Credit authorization for the current run. Lifted to the root because
  // PhaseReview (which obtains it) and PhaseValidationMongoDB (which requires
  // it) are siblings, not nested.
  const [runAuthorization, setRunAuthorization] = useState(null);
  const dispatch = useDispatch();

  // Keep the header balance pill honest across holds and settles.
  useEffect(() => {
    dispatch(fetchCreditAccount());
  }, [dispatch]);

  const creditAccount = user?.creditAccount;

  const [excelReports, setExcelReports] = useState([]);
  const [authSessionId, setAuthSessionId] = useState("");
  const [scenarioStage, setScenarioStage] = useState("write");

  // "Run validation" from the Test Case Designer: /web-testing?specRun=<run_id>.
  // The designed test cases' Test Steps become the Prompt testing scenarios.
  const location = useLocation();
  const specRunId = new URLSearchParams(location.search).get("specRun") || "";
  const [specScenarios, setSpecScenarios] = useState(null); // { loading, error, text, count, skipped, securityExcluded, doc }
  // The generic security checklist rarely fits the site under test, so it is opt-in.
  const [includeSecurity, setIncludeSecurity] = useState(false);
  useEffect(() => {
    if (!specRunId) {
      setSpecScenarios(null);
      return undefined;
    }
    let cancelled = false;
    setSpecScenarios({ loading: true });
    (async () => {
      try {
        const res = await fetch(
          `${SPEC_API}/spec/${encodeURIComponent(specRunId)}/scenarios?include_security=${includeSecurity}`,
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setSpecScenarios({ error: data.detail || `Could not load the test cases (HTTP ${res.status}).` });
          return;
        }
        setSpecScenarios({
          text: data.scenarios_text || "",
          count: data.count || 0,
          skipped: data.skipped || 0,
          securityExcluded: data.security_excluded || 0,
          doc: data.doc_filename || "",
        });
      } catch {
        if (!cancelled) setSpecScenarios({ error: "Could not reach the Test Case Designer service." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [specRunId, includeSecurity]);

  const isProcessing = ["connecting", "starting", "running"].includes(
    activePhaseStatus,
  );

  useEffect(() => {
    if (isProcessing) {
      localStorage.setItem("autopilotRunning", "true");
    } else {
      localStorage.setItem("autopilotRunning", "false");
    }
  }, [isProcessing]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue =
          "Processing is ongoing. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isProcessing]);

  useEffect(() => {
    const handleUnload = () => {
      const idToTerminate =
        phase === "phase3" ? phase3SessionId : activeSessionId;
      if (isProcessing && idToTerminate) {
        navigator.sendBeacon(`${API}/terminate/${idToTerminate}`);
      }
    };
    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);
  }, [isProcessing, activeSessionId, phase, phase3SessionId]);

  // Belt and braces: if the user walks away after authorizing but before the
  // run starts, ask for the credits back immediately rather than waiting for
  // the reservation to time out. The server-side reconciler is the actual
  // guarantee — this just makes the common case feel instant.
  useEffect(() => {
    const handleUnload = () => {
      if (runAuthorization && !isProcessing) {
        dispatch(releaseRun(runAuthorization.parentSession));
      }
    };
    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);
  }, [runAuthorization, isProcessing, dispatch]);

  const handleTerminateClick = async () => {
    // 1. Immediately show the terminating overlay
    setIsTerminating(true);

    const idToTerminate =
      phase === "phase3" ? phase3SessionId : activeSessionId;

    try {
      // 2. If we have an ID, tell the backend to gracefully kill it
      if (idToTerminate) {
        await fetch(`${API}/terminate/${idToTerminate}`, {
          method: "POST",
        });
      } else {
        // 3. If no ID (like during Auth), we just rely on the reload to drop the WS connection
        console.warn(
          "No active session ID. Force reloading to terminate connection.",
        );
      }
    } catch (error) {
      console.error("Termination error:", error);
    } finally {
      // 4. Always reload the page to reset the UI and drop all connections
      window.location.reload();
    }
  };

  const handleTabClick = (p) => {
    if (p === phase) return;
    if (isProcessing) return;
    setPhase(p);
  };

  const handleLoginDone = (
    url,
    selectedMode,
    openaiKey,
    antKey,
    selectedGoal,
    uid,
    loginSessionId,
  ) => {
    localStorage.setItem("targetUrl", url);
    localStorage.setItem("autopilotRunning", "true");
    setTargetUrl(url);
    setApiKey(openaiKey);
    setAnthropicApiKey(antKey);
    setActiveSessionId(loginSessionId || "");
    setMode(selectedMode);

    setAuthSessionId(loginSessionId || "");
    setScenarioStage("write");
    setPhase("phase2");
  };

  const handleExcelReady = (urlOrB64, name, meta = {}) => {
    setExcelReports((prev) => [...prev, { urlOrB64, name, site: targetUrl, at: new Date(), ...meta }]);
  };

  // Back to the sign-in panel (after a failed or expired sign-in, or to switch site).
  const signInAgain = () => {
    if (isProcessing) return;
    setScenarioStage("write");
    setPhase("login");
  };

  const signedIn = phase !== "login" && !!targetUrl;
  const flowSteps = (FLOWS[mode] || FLOWS.checking).map((s) =>
    s.id === "login" && signedIn ? { ...s, hint: siteHost(targetUrl) } : s,
  );
  const flowActive = phase === "login" ? "login" : mode === "scenarios" ? scenarioStage : phase;
  const stepDisabled = (p) => {
    if (isProcessing) return p !== phase;
    if ((p === "phase2" || p === "review" || p === "phase3") && !targetUrl) return true;
    if (p === "review" && mode !== "checking") return true;
    if ((p === "review" || p === "phase3") && (mode === "direct" || mode === "scenarios")) return true;
    // Validation stays locked until the run's cost has been approved on the Review tab.
    if (p === "phase3" && mode === "checking" && !runAuthorization) return true;
    return false;
  };

  return (
    <SubscriptionGuard>
      <>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <div className="wt">
          <div className="wt-shell">
            <header className="wt-header">
              <div>
                <h1 className="wt-title">
                  <span className="wt-title-icon"><Globe size={19} /></span>
                  Web Testing
                </h1>
                <p className="wt-sub">
                  AI agents sign in to your web app, explore it and test it while you watch.
                </p>
              </div>

              <div className="wt-actions">
                {creditAccount && !creditAccount.unlimited && (
                  <span
                    className="wt-chip"
                    title={
                      creditAccount.reserved > 0
                        ? `${creditAccount.reserved} credit(s) reserved for a run in progress`
                        : "Available credits"
                    }
                  >
                    <Coins size={15} color={creditAccount.balance <= 0 ? C.red : C.accent} />
                    <strong style={{ color: creditAccount.balance <= 0 ? C.red : C.text }}>
                      {Number(creditAccount.balance ?? 0).toLocaleString()}
                    </strong>
                    credits
                    {creditAccount.reserved > 0 && (
                      <span style={{ color: C.yellow, fontWeight: 600 }}>
                        · {creditAccount.reserved} held
                      </span>
                    )}
                  </span>
                )}

                <span className="wt-chip" title={targetUrl || "No site connected yet"}>
                  <span className={cx("wt-dot", targetUrl && (isProcessing ? "busy" : "on"))} />
                  <span className="wt-truncate">{targetUrl || "No site connected"}</span>
                </span>

                <button
                  className={cx("btn", isProcessing && "btn-danger")}
                  onClick={handleTerminateClick}
                  title={isProcessing ? "Stop the running session and reset this page" : "Reset this page"}
                >
                  <Square size={12} color={C.red} fill={C.red} /> Terminate
                </button>
              </div>
            </header>

            <FlowTracker
              steps={flowSteps}
              activeId={flowActive}
              busy={isProcessing}
              onSelect={(id) => (id === "login" ? signInAgain() : mode === "checking" && handleTabClick(id))}
              isDisabled={(id) =>
                id === "login" ? isProcessing || phase === "login" : mode === "checking" ? stepDisabled(id) : true
              }
            />

            {signedIn && (
              <div className="wt-session fade-up">
                <span className="wt-session-icon"><ShieldCheck size={16} /></span>
                <div className="wt-session-body">
                  <div className="wt-session-title">Signed in to {siteHost(targetUrl)}</div>
                  <div className="wt-session-desc">
                    {{ scenarios: "Prompt testing", direct: "Prompt test" }[mode] || "Standard checking"} · the agent reuses this session for every run
                  </div>
                </div>
                <button className="btn" onClick={signInAgain} disabled={isProcessing} title="Open the sign-in panel again">
                  <RefreshCw size={14} /> Sign in again
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="wt-callout warn" role="status">
                <TriangleAlert size={16} />
                <div>
                  <div className="wt-callout-title">A test is running</div>
                  Keep this page open until it finishes. Refreshing or leaving stops the agent.
                </div>
              </div>
            )}

            {specRunId && specScenarios && (
              <div className={cx("wt-callout", specScenarios.error ? "warn" : "info")} role="status">
                {specScenarios.error ? <TriangleAlert size={16} /> : <FileSpreadsheet size={16} />}
                <div>
                  <div className="wt-callout-title">Validating designed test cases</div>
                  {specScenarios.loading
                    ? "Loading the test steps from the Test Case Designer…"
                    : specScenarios.error
                      ? specScenarios.error
                      : `${specScenarios.count} scenario${specScenarios.count === 1 ? "" : "s"} from ${specScenarios.doc || "the specification"}${
                          specScenarios.skipped ? ` (${specScenarios.skipped} test case${specScenarios.skipped === 1 ? "" : "s"} had no runnable steps)` : ""
                        }. Sign in to the site with Prompt testing selected; the steps load into the editor to review, then run them in order.`}
                  {!specScenarios.loading && (includeSecurity || specScenarios.securityExcluded > 0) && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={includeSecurity}
                        disabled={isProcessing}
                        onChange={(e) => setIncludeSecurity(e.target.checked)}
                      />
                      Include the security checklist
                      {!includeSecurity && ` (${specScenarios.securityExcluded} more scenario${specScenarios.securityExcluded === 1 ? "" : "s"})`}
                    </label>
                  )}
                </div>
              </div>
            )}

            {phase === "login" && (
              <PhaseLogin
                initialMode={specRunId ? "scenarios" : undefined}
                onDone={handleLoginDone}
                onStatusChange={setActivePhaseStatus}
                onSessionCreated={setActiveSessionId}
              />
            )}

            {phase === "phase2" && targetUrl && mode === "checking" && (
              <PhaseChecking
                targetUrl={targetUrl}
                apiKey={apiKey}
                anthropicApiKey={anthropicApiKey}
                userId={userId}
                authSessionId={authSessionId}
                onExcelReady={handleExcelReady}
                onSessionReady={(sid) => setActiveSessionId(sid)}
                onStatusChange={setActivePhaseStatus}
              />
            )}

            {phase === "phase2" && mode === "direct" && authSessionId && (
              <PhaseDirectPrompt
                authSessionId={authSessionId}
                apiKey={apiKey}
                anthropicApiKey={anthropicApiKey}
                onStatusChange={setActivePhaseStatus}
              />
            )}

            {phase === "phase2" && mode === "scenarios" && authSessionId && (
              <PhaseScenarios
                authSessionId={authSessionId}
                targetUrl={targetUrl}
                apiKey={apiKey}
                anthropicApiKey={anthropicApiKey}
                userId={userId}
                onExcelReady={handleExcelReady}
                onStatusChange={setActivePhaseStatus}
                onStageChange={setScenarioStage}
                onSignInAgain={signInAgain}
                initialText={specScenarios?.text || ""}
              />
            )}

            {phase === "review" && (
              <PhaseReview
                defaultParentSessionId={activeSessionId}
                authorization={runAuthorization}
                onAuthorized={(auth) => {
                  setRunAuthorization(auth);
                  // Phase 3 reads its own session id; seed it so the user
                  // doesn't have to retype what they just approved.
                  if (auth?.parentSession) setPhase3SessionId(auth.parentSession);
                  dispatch(fetchCreditAccount());
                }}
              />
            )}

            {phase === "phase3" && (
              <PhaseValidationMongoDB
                apiKey={apiKey}
                anthropicApiKey={anthropicApiKey}
                onStatusChange={setActivePhaseStatus}
                parentSessionId={phase3SessionId}
                setParentSessionId={setPhase3SessionId}
                authorization={runAuthorization}
              />
            )}

            <ReportsPanel reports={excelReports} />
          </div>

          {isTerminating && (
            <div className="terminate-overlay" role="alertdialog" aria-live="assertive" aria-label="Stopping the session">
              <div className="terminate-card">
                <div className="terminate-spinner">
                  <svg
                    className="terminate-icon"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <h2>Stopping the session…</h2>
                <p>Please don't refresh. The agent is shutting down cleanly.</p>
              </div>
            </div>
          )}
        </div>
      </>
    </SubscriptionGuard>
  );
}
