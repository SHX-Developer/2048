import { useEffect, useRef, useCallback } from 'react';
import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, BOARD_PAD, CELL_SIZE, CELL_GAP } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  t: number;   // 0→1 (0=alive, 1=dead)
  dt: number;  // per-frame step
  color: string; // pre-computed "rgb(r,g,b)" — avoids string alloc in hot loop
  kind: 0 | 1 | 2; // 0=spark 1=smoke 2=ring
  ringR: number;
  ringDR: number;
}

// Keep it small — cheaper on mobile GPU and main thread
const MAX_PARTICLES = 45;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
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
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const particles  = useRef<Particle[]>([]);
  const rafRef     = useRef<number>(0);
  const runningRef = useRef(false);

  // Sync canvas pixel size with CSS display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // ── Render loop ─────────────────────────────────────────────────────────────
  // globalAlpha instead of rgba strings → zero string allocation per frame.
  // No createRadialGradient — flat fills only.
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ps = particles.current;

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
        ctx.globalAlpha = alive * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.max(alive, 0.1), 0, Math.PI * 2);
        ctx.fill();

      } else if (p.kind === 1) {
        // ── Smoke (flat fill, no gradient) ──
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy -= 0.03;
        p.vx *= 0.97;
        ctx.globalAlpha = alive * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + p.t * 2), 0, Math.PI * 2);
        ctx.fill();

      } else {
        // ── Ring ──
        p.ringR += p.ringDR;
        ctx.globalAlpha = alive * alive * 0.7;
        ctx.lineWidth   = 2.5 * alive;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Reset globalAlpha for next frame
    ctx.globalAlpha = 1;

    if (ps.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      runningRef.current = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // ── Spawn ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mergeSeq === 0 || mergedTiles.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W  = canvas.width;
    const H  = canvas.height;
    const ps = particles.current;
    const s  = W / 400;

    for (const tile of mergedTiles) {
      if (ps.length >= MAX_PARTICLES) break;

      const { x: px, y: py } = tileCenterPct(tile.row, tile.col);
      const cx    = (px / 100) * W;
      const cy    = (py / 100) * H;
      const color = hexToRgb(TILE_COLORS[tile.value]?.bg ?? TILE_DEFAULT.bg);

      // Sparks — scale count with tile value but keep it cheap
      const sparkCount = Math.min(5 + Math.log2(tile.value) * 1.5, 14) | 0;
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

      // Smoke — 3 puffs per merge (minimal but visible)
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
        borderRadius: '6px',
      }}
    />
  );
}
