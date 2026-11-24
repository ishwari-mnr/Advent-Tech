import React, { useEffect, useRef } from "react";

const COUNT = 1100;
const NAVY = [12, 30, 91];
const ORANGE = [249, 115, 22];

export default function HeroSphere({ className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      const jitter = 1 + (Math.random() - 0.5) * 0.06;
      pts.push({
        x: Math.cos(t) * r * jitter,
        y: y * jitter,
        z: Math.sin(t) * r * jitter,
        heat: 0,
        size: 0.7 + Math.random() * 1.1,
      });
    }
    const sats = Array.from({ length: 5 }, (_, i) => ({ a: (i / 5) * Math.PI * 2, s: 0.5 + i * 0.07 }));

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    // Resizing clears the canvas; with reduced motion nothing else repaints it.
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(performance.now());
    });
    ro.observe(canvas);

    let tiltX = 0;
    let tiltY = 0;
    let targetTX = 0;
    let targetTY = 0;
    const onMove = (e) => {
      targetTY = (e.clientX / window.innerWidth - 0.5) * 0.6;
      targetTX = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = null;
    let visible = true;
    let start = performance.now();

    const draw = (now) => {
      const t = (now - start) / 1000;
      tiltX += (targetTX - tiltX) * 0.04;
      tiltY += (targetTY - tiltY) * 0.04;

      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.38;
      const rotY = t * 0.18 + tiltY;
      const rotX = -0.25 + tiltX;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const scanY = ((t % 4.5) / 4.5) * 2.6 - 1.3;

      const g = ctx.createRadialGradient(cx, cy - R * 0.2, R * 0.1, cx, cy, R * 1.5);
      g.addColorStop(0, "rgba(249,115,22,0.20)");
      g.addColorStop(0.55, "rgba(249,115,22,0.05)");
      g.addColorStop(1, "rgba(249,115,22,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const ringTilt = 0.32;
      const drawRing = (front) => {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.04) {
          const z = Math.sin(a);
          if (front ? z < 0 : z >= 0) continue;
          const x = cx + Math.cos(a) * R * 1.32;
          const y = cy + Math.sin(a) * R * 1.32 * ringTilt;
          ctx.moveTo(x, y);
          ctx.arc(x, y, 0.6, 0, Math.PI * 2);
        }
        ctx.fillStyle = front ? "rgba(12,30,91,0.45)" : "rgba(12,30,91,0.18)";
        ctx.fill();
      };
      drawRing(false);

      const proj = pts.map((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const persp = 1 / (1.9 - z2 * 0.6);
        const ny = y1 * persp * 1.9;
        if (Math.abs(ny - scanY) < 0.06) p.heat = 1;
        else p.heat *= reduce ? 1 : 0.982;
        return { p, sx: cx + x1 * R * persp * 1.9, sy: cy + ny * R, z: z2, persp };
      });
      proj.sort((a, b) => a.z - b.z);

      for (const q of proj) {
        const depth = (q.z + 1) / 2;
        const heat = q.p.heat;
        const c = [
          NAVY[0] + (ORANGE[0] - NAVY[0]) * heat,
          NAVY[1] + (ORANGE[1] - NAVY[1]) * heat,
          NAVY[2] + (ORANGE[2] - NAVY[2]) * heat,
        ];
        const alpha = 0.12 + depth * 0.78;
        const size = q.p.size * (0.55 + depth * 0.9) * (1 + heat * 0.6);
        ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (Math.abs(scanY) < 1.05) {
        const ly = cy + scanY * R;
        const half = Math.sqrt(Math.max(0, 1 - scanY * scanY)) * R * 1.08;
        const lg = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
        lg.addColorStop(0, "rgba(249,115,22,0)");
        lg.addColorStop(0.5, "rgba(249,115,22,0.9)");
        lg.addColorStop(1, "rgba(249,115,22,0)");
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - half, ly);
        ctx.lineTo(cx + half, ly);
        ctx.stroke();
      }

      drawRing(true);

      for (const s of sats) {
        const a = s.a + t * s.s;
        const z = Math.sin(a);
        const x = cx + Math.cos(a) * R * 1.32;
        const y = cy + Math.sin(a) * R * 1.32 * ringTilt;
        const front = z >= 0;
        ctx.beginPath();
        ctx.arc(x, y, front ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = front ? "rgba(249,115,22,1)" : "rgba(249,115,22,0.35)";
        ctx.fill();
        if (front) {
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(249,115,22,0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    const loop = (now) => {
      draw(now);
      raf = visible ? requestAnimationFrame(loop) : null;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(canvas);

    if (reduce) {
      start = performance.now() - 1200;
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
