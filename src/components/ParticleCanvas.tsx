import { useEffect, useRef, useCallback } from 'react';
import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, BOARD_PAD, CELL_SIZE, CELL_GAP } from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  t: number;    // progress 0→1
  dt: number;   // per-frame increment
  r: number; g: number; b: number;
  kind: 'spark' | 'smoke' | 'ring';
  ringR: number;
  ringDR: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Center of a tile cell as percentage of board size */
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
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const particles    = useRef<Particle[]>([]);
  const rafRef       = useRef<number>(0);
  const runningRef   = useRef(false);

  // Keep canvas pixel dimensions synced with its CSS size
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

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ps = particles.current;

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.t += p.dt;
      if (p.t >= 1) { ps.splice(i, 1); continue; }
      const alive = 1 - p.t; // 1=fresh → 0=dead

      if (p.kind === 'spark') {
        p.vx *= 0.93;
        p.vy  = p.vy * 0.93 + 0.18; // gravity
        p.x  += p.vx;
        p.y  += p.vy;
        const r = p.size * Math.max(alive, 0.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alive * 0.95})`;
        ctx.fill();

      } else if (p.kind === 'smoke') {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy -= 0.04; // slow upward drift
        p.vx *= 0.98;
        const radius = p.size * (1 + p.t * 2.2);
        const alpha  = alive * 0.28;
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        grd.addColorStop(0,   `rgba(${p.r},${p.g},${p.b},${alpha})`);
        grd.addColorStop(0.5, `rgba(${p.r},${p.g},${p.b},${alpha * 0.5})`);
        grd.addColorStop(1,   `rgba(${p.r},${p.g},${p.b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

      } else if (p.kind === 'ring') {
        p.ringR += p.ringDR;
        // Ring fades quickly after halfway
        const alpha = alive * alive * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.lineWidth = 3.5 * alive;
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

  // Spawn particles whenever a new batch of merges is settled
  useEffect(() => {
    if (mergeSeq === 0 || mergedTiles.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.width;
    const H = canvas.height;
    const ps = particles.current;
    const scale = W / 400; // normalise to 400px reference

    for (const tile of mergedTiles) {
      const { x: px, y: py } = tileCenterPct(tile.row, tile.col);
      const cx = (px / 100) * W;
      const cy = (py / 100) * H;
      const { bg } = TILE_COLORS[tile.value] ?? TILE_DEFAULT;
      const [r, g, b] = hexToRgb(bg);

      // More sparks for higher tiles — feels proportionally epic
      const sparkCount = Math.min(8 + Math.log2(tile.value) * 3, 28) | 0;

      // Sparks
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.9;
        const speed = (1.8 + Math.random() * 4) * scale;
        ps.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (2.5 + Math.random() * 3.5) * scale,
          t: 0, dt: 1 / (30 + Math.random() * 25),
          r, g, b,
          kind: 'spark',
          ringR: 0, ringDR: 0,
        });
      }

      // Smoke puffs — use tile color for colorful smoke
      const smokeCount = 10 + Math.round(Math.log2(tile.value));
      for (let i = 0; i < smokeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.5 + Math.random() * 1.5) * scale;
        ps.push({
          x: cx + (Math.random() - 0.5) * W * 0.04,
          y: cy + (Math.random() - 0.5) * H * 0.04,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: (7 + Math.random() * 14) * scale,
          t: 0, dt: 1 / (45 + Math.random() * 35),
          r, g, b,
          kind: 'smoke',
          ringR: 0, ringDR: 0,
        });
      }

      // Shockwave ring
      const ringMaxR = (W / 100) * CELL_SIZE * 0.85;
      ps.push({
        x: cx, y: cy,
        vx: 0, vy: 0,
        size: 0,
        t: 0, dt: 1 / 22,
        r, g, b,
        kind: 'ring',
        ringR: 0, ringDR: ringMaxR / 22,
      });
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
