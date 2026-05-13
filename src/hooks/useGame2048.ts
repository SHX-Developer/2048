import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { TileData, Direction } from '../utils/gameLogic';
import { createInitialTiles, addRandomTile, moveTiles, hasMovesAvailable } from '../utils/gameLogic';
import { playMerge } from '../utils/sound';

// ─── Timing ──────────────────────────────────────────────────────────────────

// SLIDE_MS must match the transition duration in Tile.tsx.
// After this delay, SETTLE fires: absorbed tiles removed, new tile spawned, queue consumed.
// The merge-pop CSS animation plays independently on the inner div — no React timer needed.
const SLIDE_MS = 320;

// Maximum number of moves to buffer while animating
const QUEUE_MAX = 3;

// ─── Haptic ──────────────────────────────────────────────────────────────────

function triggerHaptic() {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
      return;
    }
    navigator.vibrate?.(40);
  } catch { /* ignore */ }
}

// ─── LocalStorage (per-grid-size best) ───────────────────────────────────────

const bestKey = (gridSize: number) => `2048_best_${gridSize}`;
const loadBest = (gridSize: number): number => {
  try {
    // Forward-compat: read the old `2048_best` key as the 4×4 best if no
    // per-size key exists yet.
    const raw = localStorage.getItem(bestKey(gridSize));
    if (raw !== null) return parseInt(raw, 10) || 0;
    if (gridSize === 4) {
      const legacy = localStorage.getItem('2048_best');
      return legacy ? (parseInt(legacy, 10) || 0) : 0;
    }
    return 0;
  } catch { return 0; }
};
const saveBest = (gridSize: number, n: number) => {
  try { localStorage.setItem(bestKey(gridSize), String(n)); } catch { /* ignore */ }
};

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  gridSize: number;
  tiles: TileData[];
  score: number;
  best: number;
  gameOver: boolean;
  busy: boolean;
  queue: Direction[];
  seq: number;
  pendingGain: number;
  pendingMerges: number;
  pendingMaxMerge: number;
  mergeSeq: number;
}

type Action =
  | { type: 'MOVE'; direction: Direction }
  | { type: 'SETTLE' }
  | { type: 'RESTART'; gridSize?: number };

function clearFlags(tiles: TileData[]): TileData[] {
  return tiles.map(t => ({ ...t, isNew: false, isMerged: false }));
}

function startMove(
  state: State,
  direction: Direction,
  queue: Direction[],
  seq: number,
  mergeSeq: number,
): State | null {
  const fresh = clearFlags(state.tiles);
  const result = moveTiles(fresh, direction, state.gridSize);
  if (!result.moved) return null;

  const mergedTiles = result.tiles.filter(t => t.isMerged);
  const mergeCount  = mergedTiles.length;
  const maxMerge    = mergeCount > 0
    ? Math.max(...mergedTiles.map(t => t.value))
    : 0;

  return {
    ...state,
    tiles: result.tiles,
    busy: true,
    queue,
    seq: seq + 1,
    mergeSeq,
    pendingGain: result.scoreGain,
    pendingMerges: mergeCount,
    pendingMaxMerge: maxMerge,
  };
}

function init(gridSize: number): State {
  return {
    gridSize,
    tiles: createInitialTiles(gridSize),
    score: 0,
    best: loadBest(gridSize),
    gameOver: false,
    busy: false,
    queue: [],
    seq: 0,
    pendingGain: 0,
    pendingMerges: 0,
    pendingMaxMerge: 0,
    mergeSeq: 0,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {

    case 'MOVE': {
      if (state.gameOver) return state;

      if (!state.busy) {
        const next = startMove(state, action.direction, state.queue, state.seq, state.mergeSeq);
        return next ?? state;
      }

      if (state.queue.length >= QUEUE_MAX) return state;
      const last = state.queue[state.queue.length - 1];
      if (last === action.direction) return state;
      return { ...state, queue: [...state.queue, action.direction] };
    }

    case 'SETTLE': {
      if (!state.busy) return state;

      const withoutAbsorbed = state.tiles.filter(t => !t.isAbsorbed);
      const withNew         = addRandomTile(withoutAbsorbed, state.gridSize);
      const newScore        = state.score + state.pendingGain;
      const newBest         = Math.max(state.best, newScore);
      if (newBest > state.best) saveBest(state.gridSize, newBest);

      const remainingQueue = [...state.queue];
      while (remainingQueue.length > 0) {
        const nextDir   = remainingQueue.shift()!;
        const nextState = startMove(
          { ...state, tiles: withNew, score: newScore, best: newBest, gameOver: false },
          nextDir,
          remainingQueue,
          state.seq,
          state.mergeSeq,
        );
        if (nextState) return nextState;
      }

      const idleTiles = withNew.map(t => ({ ...t, isAbsorbed: false }));
      const newMergeSeq = state.pendingMerges > 0 ? state.mergeSeq + 1 : state.mergeSeq;
      return {
        ...state,
        tiles: idleTiles,
        score: newScore,
        best: newBest,
        gameOver: !hasMovesAvailable(idleTiles, state.gridSize),
        busy: false,
        queue: [],
        seq: state.seq + 1,
        mergeSeq: newMergeSeq,
        pendingGain: 0,
        pendingMerges: 0,
        pendingMaxMerge: 0,
      };
    }

    case 'RESTART': {
      const nextSize = action.gridSize ?? state.gridSize;
      // Preserve the persisted best for the new size (different per mode).
      return init(nextSize);
    }

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseGame2048Options {
  /** Active grid size (3, 4, or 5). */
  gridSize: number;
  /** When false, keyboard / swipe input listeners are not registered. */
  inputEnabled?: boolean;
}

export function useGame2048(options: UseGame2048Options) {
  const { gridSize, inputEnabled = true } = options;
  const [state, dispatch] = useReducer(reducer, gridSize, init);

  // If gridSize changes externally (e.g. user picks a new mode from the menu),
  // restart with the new size. This re-loads `best` for the new mode.
  useEffect(() => {
    if (state.gridSize !== gridSize) {
      dispatch({ type: 'RESTART', gridSize });
    }
  }, [gridSize, state.gridSize]);

  const pendingRef = useRef({ merges: 0, maxMerge: 0 });
  pendingRef.current = { merges: state.pendingMerges, maxMerge: state.pendingMaxMerge };

  useEffect(() => {
    if (!state.busy) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        const { merges, maxMerge } = pendingRef.current;
        if (merges > 0) {
          playMerge(merges, maxMerge);
          triggerHaptic();
        }
        dispatch({ type: 'SETTLE' });
      }, SLIDE_MS);
    });
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [state.busy, state.seq]);

  const handleMove = useCallback((dir: Direction) => {
    dispatch({ type: 'MOVE', direction: dir });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  // Keyboard
  useEffect(() => {
    if (!inputEnabled) return;
    const map: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = map[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove, inputEnabled]);

  // Touch swipe — intercepts ALL touch movement to prevent Telegram's
  // swipe-down-to-close gesture from firing during gameplay.
  useEffect(() => {
    if (!inputEnabled) return;
    const MIN = 20;
    let sx = 0, sy = 0;

    const onStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < MIN) return;
      handleMove(ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: false });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
    };
  }, [handleMove, inputEnabled]);

  return {
    tiles:    state.tiles,
    score:    state.score,
    best:     state.best,
    gameOver: state.gameOver,
    busy:     state.busy,
    mergeSeq: state.mergeSeq,
    gridSize: state.gridSize,
    restart,
  };
}
