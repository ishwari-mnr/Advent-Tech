import { useEffect } from "react";

// Eased mouse-wheel scrolling. Touch, keyboard and scrollIntoView stay native.
export default function useSmoothScroll({ ease = 0.095 } = {}) {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;

    let target = window.scrollY;
    let current = target;
    let raf = null;

    const maxScroll = () =>
      document.documentElement.scrollHeight - window.innerHeight;

    const innerCanScroll = (el, dy) => {
      while (el && el !== document.body && el !== document.documentElement) {
        const { overflowY } = window.getComputedStyle(el);
        if (/(auto|scroll)/.test(overflowY) && el.scrollHeight > el.clientHeight) {
          if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
          if (dy < 0 && el.scrollTop > 0) return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const tick = () => {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        raf = null;
        return;
      }
      window.scrollTo(0, current);
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (e) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      // A modal is open: never scroll the page behind it.
      if (document.querySelector('[aria-modal="true"]')) {
        if (!innerCanScroll(e.target, e.deltaY)) e.preventDefault();
        return;
      }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (innerCanScroll(e.target, e.deltaY)) return;

      e.preventDefault();
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;

      if (!raf) current = target = window.scrollY;
      target = Math.max(0, Math.min(maxScroll(), target + dy));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!raf) current = target = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ease]);
}
