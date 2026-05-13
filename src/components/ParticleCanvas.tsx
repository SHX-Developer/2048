import { useEffect, useRef, useCallback } from 'react';
import type { TileData } from '../utils/gameLogic';
import { BOARD_PAD, CELL_GAP, cellSize } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { tileParticleColor, type ThemeId } from '../utils/themes';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Particle kinds:
 *  0 spark   — radial burst (always)
 *  1 smoke   — soft fade puff (default)
 *  2 ring    — expanding circle (always)
 *  3 star    — 4-point twinkle (aesthetic / peach / ice)
 *  4 ember   — bright dot rising upward, slow fade (fire)
 *  5 bubble  — hollow stroked circle rising upward (ocean)
 */
type Kind = 0 | 1 | 2 | 3 | 4 | 5;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  t: number;   // 0→1 (0=alive, 1=dead)
  dt: number;  // per-frame step
  color: string;
  kind: Kind;
  ringR: number;
  ringDR: number;
  /** Optional rotation for some particle kinds. */
  rot: number;
  drot: number;
}

// Cap is generous but bounded — sparks fade fast, embers/bubbles linger longer.
const MAX_PARTICLES = 90;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  if (hex.startsWith('rgb')) return hex;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgb(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255})`;
}

function tileCenterPct(row: number, col: number, gridSize: number) {
  const cs = cellSize(gridSize);
  return {
    x: BOARD_PAD + col * (cs + CELL_GAP) + cs / 2,
    y: BOARD_PAD + row * (cs + CELL_GAP) + cs / 2,
  };
}

/** Quick blank Particle factory — fills the unused fields with defaults. */
function makeParticle(p: Partial<Particle> & Pick<Particle, 'x' | 'y' | 'color' | 'kind'>): Particle {
  return {
    vx: 0, vy: 0, size: 1, t: 0, dt: 0.05,
    ringR: 0, ringDR: 0, rot: 0, drot: 0,
    ...p,
  } as Particle;
}

function isDarkTheme(id: ThemeId): boolean {
  return id === 'aesthetic' || id === 'fire';
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ParticleCanvasProps {
  mergedTiles: TileData[];
  mergeSeq: number;
  gridSize: number;
}

export function ParticleCanvas({ mergedTiles, mergeSeq, gridSize }: ParticleCanvasProps) {
  const theme = useTheme();
  const gridSizeRef = useRef(gridSize);
  gridSizeRef.current = gridSize;
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const rafRef     = useRef<number>(0);
  const runningRef = useRef(false);

  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Sync canvas pixel size with CSS size (DPR-aware)
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
    const ps   = particles.current;
    const id   = themeRef.current.id;
    const dark = isDarkTheme(id);

    // Additive blending on dark themes = neon glow.
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.t += p.dt;
      if (p.t >= 1) { ps.splice(i, 1); continue; }
      const alive = 1 - p.t;

      ctx.fillStyle   = p.color;
      ctx.strokeStyle = p.color;

      switch (p.kind) {

        case 0: { // ── Spark ──
          p.vx *= 0.91;
          p.vy  = p.vy * 0.91 + 0.22;
          p.x  += p.vx;
          p.y  += p.vy;
          ctx.globalAlpha = alive * (dark ? 0.85 : 0.9);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * Math.max(alive, 0.1), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 1: { // ── Smoke ──
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy -= 0.03;
          p.vx *= 0.97;
          ctx.globalAlpha = alive * (dark ? 0.12 : 0.18);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + p.t * 2), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 2: { // ── Ring ──
          p.ringR += p.ringDR;
          ctx.globalAlpha = alive * alive * (dark ? 0.85 : 0.7);
          ctx.lineWidth   = (dark ? 3 : 2.5) * alive;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.ringR, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case 3: { // ── Star sparkle ── (twinkling 4-point cross)
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy *= 0.99;
          p.rot += p.drot;
          const tw = 0.55 + Math.sin(p.t * Math.PI * 4) * 0.45;
          ctx.globalAlpha = alive * tw * 0.95;
          const r = p.size * Math.max(alive, 0.2);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
          ctx.moveTo(0, -r); ctx.lineTo(0, r);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case 4: { // ── Ember ── (rising bright dot, flickers)
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy += 0.02;          // slight gravity but vy starts strongly negative
          p.vx *= 0.985;
          // Flicker — multiplies alpha
          const flicker = 0.7 + 0.3 * Math.sin(p.t * Math.PI * 10 + p.rot);
          ctx.globalAlpha = alive * flicker;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * Math.max(alive, 0.3), 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 5: { // ── Bubble ── (hollow stroked circle, rises)
          p.x  += p.vx;
          p.y  += p.vy;
          p.vy *= 0.995;        // tiny deceleration
          p.vx += Math.sin(p.t * Math.PI * 2 + p.rot) * 0.04;  // gentle horizontal sway
          ctx.globalAlpha = alive * alive * 0.85;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 + p.t * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (ps.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      runningRef.current = false;
      ctx.clearRect(0, 0, W, H);
    }
  }, []);

  // ── Spawn on every merge ────────────────────────────────────────────────────
  useEffect(() => {
    if (mergeSeq === 0 || mergedTiles.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W  = canvas.offsetWidth;
    const H  = canvas.offsetHeight;
    const ps = particles.current;
    const s  = W / 400;
    const id   = themeRef.current.id;
    const dark = isDarkTheme(id);
    const room = () => MAX_PARTICLES - ps.length;

    // Track the average position for a possible chain-merge bonus ring.
    let cxSum = 0, cySum = 0;

    for (const tile of mergedTiles) {
      if (room() <= 0) break;

      const { x: px, y: py } = tileCenterPct(tile.row, tile.col, gridSizeRef.current);
      const cx = (px / 100) * W;
      const cy = (py / 100) * H;
      cxSum += cx; cySum += cy;
      const color = hexToRgb(tileParticleColor(themeRef.current, tile.value));

      // ── Sparks — count grows with tile value, capped per theme ──
      const baseCount  = dark ? 7 : 5;
      const stepFactor = dark ? 1.9 : 1.6;
      const sparkCap   = dark ? 20 : 16;
      // Milestone bonus: tiles ≥256 get an extra burst of sparks.
      const milestoneBoost = tile.value >= 256 ? 4 : 0;
      const sparkCount = Math.min(
        baseCount + Math.log2(tile.value) * stepFactor + milestoneBoost,
        sparkCap,
      ) | 0;
      const sparks = Math.min(sparkCount, room());

      for (let i = 0; i < sparks; i++) {
        const angle = (Math.PI * 2 * i) / sparks + (Math.random() - 0.5) * 0.7;
        const speed = (1.4 + Math.random() * 3) * s;
        ps.push(makeParticle({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (2 + Math.random() * 2.5) * s,
          dt: 1 / (22 + Math.random() * 16),
          color, kind: 0,
        }));
      }

      // ── Smoke — only on non-fire (fire replaces this with embers) ──
      if (id !== 'fire') {
        const smokes = Math.min(3, room());
        for (let i = 0; i < smokes; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.3 + Math.random() * 1) * s;
          ps.push(makeParticle({
            x: cx + (Math.random() - 0.5) * W * 0.03,
            y: cy + (Math.random() - 0.5) * H * 0.03,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: (5 + Math.random() * 8) * s,
            dt: 1 / (25 + Math.random() * 15),
            color, kind: 1,
          }));
        }
      }

      // ── Ring — 1 per merge ──
      if (room() > 0) {
        const maxR = (W / 100) * cellSize(gridSizeRef.current) * 0.75;
        ps.push(makeParticle({
          x: cx, y: cy,
          dt: 1 / 18,
          color, kind: 2,
          ringDR: maxR / 18,
        }));
      }

      // ── Theme-specific bonus layer ───────────────────────────────────────
      if (id === 'fire') {
        // Embers — bright dots rising upward in a fan
        const embers = Math.min(6, room());
        for (let i = 0; i < embers; i++) {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // upward fan
          const speed = (1.5 + Math.random() * 2.2) * s;
          // 70% tile color, 30% bright yellow/white tip for hot embers
          const useHot = Math.random() < 0.35;
          const emberColor = useHot ? 'rgb(255, 230, 130)' : color;
          ps.push(makeParticle({
            x: cx + (Math.random() - 0.5) * W * 0.04,
            y: cy + (Math.random() - 0.5) * H * 0.02,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed,
            size: (2 + Math.random() * 2) * s,
            dt: 1 / (38 + Math.random() * 20),
            color: emberColor, kind: 4,
            rot: Math.random() * Math.PI * 2,
          }));
        }
      } else if (id === 'ocean') {
        // Bubbles — hollow circles rising slowly
        const bubbles = Math.min(5, room());
        for (let i = 0; i < bubbles; i++) {
          const speed = (0.6 + Math.random() * 1.0) * s;
          ps.push(makeParticle({
            x: cx + (Math.random() - 0.5) * W * 0.06,
            y: cy + (Math.random() - 0.5) * H * 0.03,
            vx: (Math.random() - 0.5) * 0.4 * s,
            vy: -speed,
            size: (3 + Math.random() * 4) * s,
            dt: 1 / (40 + Math.random() * 20),
            color: 'rgb(255,255,255)', kind: 5,
            rot: Math.random() * Math.PI * 2,
          }));
        }
      } else if (id === 'ice') {
        // Crystal sparkles — like aesthetic but slower, blue-tinted
        const crystals = Math.min(5, room());
        for (let i = 0; i < crystals; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.4 + Math.random() * 1.0) * s;
          ps.push(makeParticle({
            x: cx + (Math.random() - 0.5) * W * 0.05,
            y: cy + (Math.random() - 0.5) * H * 0.05,
            vx: Math.cos(angle) * speed * 0.4,
            vy: Math.sin(angle) * speed * 0.4 + 0.1 * s, // slight downward drift
            size: (3.5 + Math.random() * 3) * s,
            dt: 1 / (35 + Math.random() * 18),
            color: 'rgb(220, 240, 255)', kind: 3,
            rot: Math.random() * Math.PI * 2,
            drot: (Math.random() - 0.5) * 0.08,
          }));
        }
      } else if (id === 'aesthetic') {
        // Stars — existing twilight twinkle
        const stars = Math.min(4, room());
        for (let i = 0; i < stars; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.5 + Math.random() * 1.4) * s;
          ps.push(makeParticle({
            x: cx + (Math.random() - 0.5) * W * 0.04,
            y: cy + (Math.random() - 0.5) * H * 0.04,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed * 0.5 - 0.4 * s,
            size: (3 + Math.random() * 3) * s,
            dt: 1 / (30 + Math.random() * 18),
            color: 'rgb(255,255,255)', kind: 3,
            rot: Math.random() * Math.PI * 2,
            drot: (Math.random() - 0.5) * 0.06,
          }));
        }
      } else if (id === 'peach') {
        // Soft pink sparkles — warm twinkle
        const sparkles = Math.min(3, room());
        for (let i = 0; i < sparkles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.5 + Math.random() * 1.2) * s;
          ps.push(makeParticle({
            x: cx + (Math.random() - 0.5) * W * 0.04,
            y: cy + (Math.random() - 0.5) * H * 0.04,
            vx: Math.cos(angle) * speed * 0.4,
            vy: Math.sin(angle) * speed * 0.4 - 0.3 * s,
            size: (2.5 + Math.random() * 2.5) * s,
            dt: 1 / (32 + Math.random() * 16),
            color: 'rgb(255, 190, 215)', kind: 3,
            rot: Math.random() * Math.PI * 2,
            drot: (Math.random() - 0.5) * 0.05,
          }));
        }
      }
    }

    // ── Chain-merge bonus: when ≥2 tiles merge in one move, spawn a big
    // celebratory ring at their centroid. ────────────────────────────────────
    if (mergedTiles.length >= 2 && room() > 0) {
      const ccx = cxSum / mergedTiles.length;
      const ccy = cySum / mergedTiles.length;
      const maxR = (W / 100) * cellSize(gridSizeRef.current) * 1.1;
      ps.push(makeParticle({
        x: ccx, y: ccy,
        dt: 1 / 28,
        color: dark ? 'rgb(255, 240, 200)' : 'rgb(255, 255, 255)',
        kind: 2,
        ringDR: maxR / 28,
      }));
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
        borderRadius: theme.id === 'classic' ? '6px' : '14px',
      }}
    />
  );
}
