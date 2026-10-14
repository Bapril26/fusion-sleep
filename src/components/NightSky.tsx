import { useEffect, useRef } from 'react';

/** Subtle twinkling star field. Throttled to ~20 fps and paused when hidden. */
export function NightSky({ animate = true, density = 0.00028 }: { animate?: boolean; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: { x: number; y: number; r: number; p: number; s: number }[] = [];
    let shoot: { x: number; y: number; t: number } | null = null;
    let nextShoot = performance.now() + 9000;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(w * h * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.1 + 0.25,
        p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const a = animate ? 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(st.p + t * 0.001 * st.s)) : 0.6;
        ctx.globalAlpha = a;
        ctx.fillStyle = st.r > 1 ? '#cfe3ff' : '#ffffff';
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      }
      if (animate) {
        if (!shoot && t > nextShoot) shoot = { x: Math.random() * w * 0.6 + w * 0.2, y: Math.random() * h * 0.3, t };
        if (shoot) {
          const k = (t - shoot.t) / 1100;
          if (k > 1) { shoot = null; nextShoot = t + 14000 + Math.random() * 16000; }
          else {
            const x = shoot.x - k * 160, y = shoot.y + k * 70;
            const g = ctx.createLinearGradient(x, y, x + 60, y - 26);
            g.addColorStop(0, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalAlpha = Math.sin(k * Math.PI);
            ctx.strokeStyle = g; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y - 26); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 50 || document.hidden) return;
      last = t; draw(t);
    };

    resize();
    draw(performance.now());
    if (animate) raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => { resize(); draw(performance.now()); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [animate, density]);

  return <canvas ref={ref} aria-hidden="true" />;
}
