import { useEffect, useRef, useCallback } from 'react';
import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, BOARD_PAD, CELL_SIZE, CELL_GAP } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  t: number;    // progress 0→1 (0=alive, 1=dead)
  dt: number;   // per-frame increment (1/lifetime_frames)
  r: number; g: number; b: number;
  kind: 0 | 1 | 2;  // 0=spark, 1=smoke, 2=ring
  ringR: number;
  ringDR: number;
}

// Hard cap — prevents accumulation on rapid merges from lagging mobile
const MAX_PARTICLES = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
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

  // Sync canvas pixel dimensions with CSS display size
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
  // Optimised: no createRadialGradient (very expensive on mobile).
  // Smoke uses flat fill + globalAlpha instead. Ring and sparks are simple arcs.
  // All state lives in refs — zero React re-renders during animation.
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

      if (p.kind === 0) {
        // ── Spark ──
        p.vx *= 0.92;
        p.vy  = p.vy * 0.92 + 0.2;
        p.x  += p.vx;
        p.y  += p.vy;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * Math.max(alive, 0.15), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(alive * 0.95).toFixed(2)})`;
        ctx.fill();

      } else if (p.kind === 1) {
        // ── Smoke (flat fill — no gradient, cheap on mobile) ──
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy -= 0.035;
        p.vx *= 0.97;
        const radius = p.size * (1 + p.t * 2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(alive * 0.22).toFixed(2)})`;
        ctx.fill();

      } else {
        // ── Ring ──
        p.ringR += p.ringDR;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${(alive * alive * 0.75).toFixed(2)})`;
        ctx.lineWidth = 3 * alive;
        ctx.stroke();
      }
    }

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

    const W = canvas.width;
    const H = canvas.height;
    const ps = particles.current;
    const s  = W / 400; // scale factor (reference = 400px board)

    for (const tile of mergedTiles) {
      // Hard cap — skip new bursts if already at limit
      if (ps.length >= MAX_PARTICLES) break;

      const { x: px, y: py } = tileCenterPct(tile.row, tile.col);
      const cx = (px / 100) * W;
      const cy = (py / 100) * H;
      const { bg } = TILE_COLORS[tile.value] ?? TILE_DEFAULT;
      const [r, g, b] = hexToRgb(bg);

      // Scale spark count with tile value (more = more epic), but keep it cheap
      const sparkCount = Math.min(6 + Math.log2(tile.value) * 2, 16) | 0;
      const room = Math.max(0, MAX_PARTICLES - ps.length);
      const sparks = Math.min(sparkCount, room);

      // Sparks
      for (let i = 0; i < sparks; i++) {
        const angle = (Math.PI * 2 * i) / sparks + (Math.random() - 0.5) * 0.8;
        const speed = (1.5 + Math.random() * 3.5) * s;
        ps.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (2 + Math.random() * 3) * s,
          t: 0, dt: 1 / (28 + Math.random() * 20),
          r, g, b, kind: 0,
          ringR: 0, ringDR: 0,
        });
      }

      // Smoke puffs — fixed 4 per merge (cheap, still looks great)
      const smokes = Math.min(4, Math.max(0, MAX_PARTICLES - ps.length));
      for (let i = 0; i < smokes; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random() * 1.2) * s;
        ps.push({
          x: cx + (Math.random() - 0.5) * W * 0.035,
          y: cy + (Math.random() - 0.5) * H * 0.035,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (6 + Math.random() * 10) * s,
          t: 0, dt: 1 / (30 + Math.random() * 20),
          r, g, b, kind: 1,
          ringR: 0, ringDR: 0,
        });
      }

      // Shockwave ring — 1 per merge
      if (ps.length < MAX_PARTICLES) {
        const ringMaxR = (W / 100) * CELL_SIZE * 0.8;
        ps.push({
          x: cx, y: cy,
          vx: 0, vy: 0, size: 0,
          t: 0, dt: 1 / 20,
          r, g, b, kind: 2,
          ringR: 0, ringDR: ringMaxR / 20,
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
