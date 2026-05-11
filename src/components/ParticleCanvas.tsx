import { useEffect, useRef, useCallback } from 'react';
import type { TileData } from '../utils/gameLogic';
import { BOARD_PAD, CELL_SIZE, CELL_GAP } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { tileParticleColor } from '../utils/themes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  t: number;   // 0→1 (0=alive, 1=dead)
  dt: number;  // per-frame step
  color: string; // pre-computed "rgb(r,g,b)" — avoids string alloc in hot loop
  kind: 0 | 1 | 2 | 3; // 0=spark 1=smoke 2=ring 3=star (aesthetic only)
  ringR: number;
  ringDR: number;
}

// Keep it small — cheaper on mobile GPU and main thread
const MAX_PARTICLES = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  // Already rgb()? Pass through.
  if (hex.startsWith('rgb')) return hex;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
}

function tileCenterPct(row: number, col: number) {
  return {
    x: BOARD_PAD + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    y: BOARD_PAD + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ParticleCanvasProps {
  mergedTiles: TileData[];
  mergeSeq: number;
}

export function ParticleCanvas({ mergedTiles, mergeSeq }: ParticleCanvasProps) {
  const theme = useTheme();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const rafRef     = useRef<number>(0);
  const runningRef = useRef(false);

  // Keep the theme reference live across renders without re-binding callbacks
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Sync canvas pixel size with CSS display size (and DPR-aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // ── Render loop ─────────────────────────────────────────────────────────────
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    const ps = particles.current;
    const isAesthetic = themeRef.current.id === 'aesthetic';

    // Additive blending on the aesthetic theme = neon glow.
    ctx.globalCompositeOperation = isAesthetic ? 'lighter' : 'source-over';

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.t += p.dt;
      if (p.t >= 1) { ps.splice(i, 1); continue; }
      const alive = 1 - p.t;

      ctx.fillStyle   = p.color;
      ctx.strokeStyle = p.color;

      if (p.kind === 0) {
        // ── Spark ──
        p.vx *= 0.91;
        p.vy  = p.vy * 0.91 + 0.22;
        p.x  += p.vx;
        p.y  += p.vy;
        ctx.globalAlpha = alive * (isAesthetic ? 0.85 : 0.9);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.max(alive, 0.1), 0, Math.PI * 2);
        ctx.fill();

      } else if (p.kind === 1) {
        // ── Smoke (flat fill, no gradient) ──
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy -= 0.03;
        p.vx *= 0.97;
        ctx.globalAlpha = alive * (isAesthetic ? 0.12 : 0.18);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.t * 2), 0, Math.PI * 2);
        ctx.fill();

      } else if (p.kind === 2) {
        // ── Ring ──
        p.ringR += p.ringDR;
        ctx.globalAlpha = alive * alive * (isAesthetic ? 0.85 : 0.7);
        ctx.lineWidth   = (isAesthetic ? 3 : 2.5) * alive;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringR, 0, Math.PI * 2);
        ctx.stroke();

      } else {
        // ── Star (aesthetic only) — drifts up slowly, twinkles ──
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy *= 0.99;
        const tw = 0.6 + Math.sin(p.t * Math.PI * 4) * 0.4;
        ctx.globalAlpha = alive * tw * 0.95;
        const r = p.size * Math.max(alive, 0.2);
        // Tiny 4-point sparkle: two crossed lines
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - r, p.y);  ctx.lineTo(p.x + r, p.y);
        ctx.moveTo(p.x, p.y - r);  ctx.lineTo(p.x, p.y + r);
        ctx.stroke();
      }
    }

    // Reset for next frame
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (ps.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      runningRef.current = false;
      ctx.clearRect(0, 0, W, H);
    }
  }, []);

  // ── Spawn ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mergeSeq === 0 || mergedTiles.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W  = canvas.offsetWidth;
    const H  = canvas.offsetHeight;
    const ps = particles.current;
    const s  = W / 400;
    const isAesthetic = themeRef.current.id === 'aesthetic';

    for (const tile of mergedTiles) {
      if (ps.length >= MAX_PARTICLES) break;

      const { x: px, y: py } = tileCenterPct(tile.row, tile.col);
      const cx    = (px / 100) * W;
      const cy    = (py / 100) * H;
      const color = hexToRgb(tileParticleColor(themeRef.current, tile.value));

      // Sparks — slightly more on aesthetic for fireworks feel
      const baseCount  = isAesthetic ? 7 : 5;
      const stepFactor = isAesthetic ? 1.8 : 1.5;
      const sparkCount = Math.min(baseCount + Math.log2(tile.value) * stepFactor, isAesthetic ? 18 : 14) | 0;
      const room       = MAX_PARTICLES - ps.length;
      const sparks     = Math.min(sparkCount, room);

      for (let i = 0; i < sparks; i++) {
        const angle = (Math.PI * 2 * i) / sparks + (Math.random() - 0.5) * 0.8;
        const speed = (1.4 + Math.random() * 3) * s;
        ps.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (2 + Math.random() * 2.5) * s,
          t: 0, dt: 1 / (22 + Math.random() * 16),
          color, kind: 0,
          ringR: 0, ringDR: 0,
        });
      }

      // Smoke — 3 puffs per merge
      const smokes = Math.min(3, MAX_PARTICLES - ps.length);
      for (let i = 0; i < smokes; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.3 + Math.random() * 1) * s;
        ps.push({
          x: cx + (Math.random() - 0.5) * W * 0.03,
          y: cy + (Math.random() - 0.5) * H * 0.03,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (5 + Math.random() * 8) * s,
          t: 0, dt: 1 / (25 + Math.random() * 15),
          color, kind: 1,
          ringR: 0, ringDR: 0,
        });
      }

      // Ring — 1 per merge
      if (ps.length < MAX_PARTICLES) {
        const maxR = (W / 100) * CELL_SIZE * 0.75;
        ps.push({
          x: cx, y: cy,
          vx: 0, vy: 0, size: 0,
          t: 0, dt: 1 / 18,
          color, kind: 2,
          ringR: 0, ringDR: maxR / 18,
        });
      }

      // Aesthetic only: a few drifting "star" sparkles
      if (isAesthetic) {
        const stars = Math.min(4, MAX_PARTICLES - ps.length);
        for (let i = 0; i < stars; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.5 + Math.random() * 1.4) * s;
          ps.push({
            x: cx + (Math.random() - 0.5) * W * 0.04,
            y: cy + (Math.random() - 0.5) * H * 0.04,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed * 0.5 - 0.4 * s,
            size: (3 + Math.random() * 3) * s,
            t: 0, dt: 1 / (30 + Math.random() * 18),
            color: 'rgb(255,255,255)',
            kind: 3,
            ringR: 0, ringDR: 0,
          });
        }
      }
    }

    if (!runningRef.current) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeSeq]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
        borderRadius: theme.id === 'aesthetic' ? '14px' : '6px',
      }}
    />
  );
}
