import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { TileData, Direction } from '../utils/gameLogic';
import { createInitialTiles, addRandomTile, moveTiles, hasMovesAvailable } from '../utils/gameLogic';
import { playMerge } from '../utils/sound';

// ─── Timing ──────────────────────────────────────────────────────────────────

// SLIDE_MS must match the transition duration in Tile.tsx.
// After this delay, SETTLE fires: absorbed tiles removed, new tile spawned, queue consumed.
// The merge-pop CSS animation plays independently on the inner div — no React timer needed.
const SLIDE_MS = 300;

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

// ─── LocalStorage ─────────────────────────────────────────────────────────────

const BEST_KEY = '2048_best';
const loadBest = (): number => {
  try { return parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
};
const saveBest = (n: number) => {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* ignore */ }
};

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  tiles: TileData[];
  score: number;
  best: number;
  gameOver: boolean;
  /** Whether a slide animation is currently in flight. Blocks immediate processing. */
  busy: boolean;
  /** Buffered inputs received while busy */
  queue: Direction[];
  /** Increments each time a new slide starts — lets useEffect re-arm the timer */
  seq: number;
  pendingGain: number;
  /** Number of merges in the current move — for sound richness */
  pendingMerges: number;
  /** Highest merged value in the current move — for sound pitch */
  pendingMaxMerge: number;
  /** Increments every time a SETTLE with merges fires — triggers particle effects */
  mergeSeq: number;
}

type Action =
  | { type: 'MOVE'; direction: Direction }
  | { type: 'SETTLE' }
  | { type: 'RESTART' };

function clearFlags(tiles: TileData[]): TileData[] {
  return tiles.map(t => ({ ...t, isNew: false, isMerged: false }));
}

function startMove(
  tiles: TileData[],
  direction: Direction,
  state: Omit<State, 'tiles' | 'busy' | 'queue' | 'seq' | 'pendingGain' | 'pendingMerges' | 'pendingMaxMerge' | 'mergeSeq'>,
  queue: Direction[],
  seq: number,
  mergeSeq: number,
): State | null {
  const fresh = clearFlags(tiles);
  const result = moveTiles(fresh, direction);
  if (!result.moved) return null;

  // Count merges and find max merged value for sound/haptic metadata
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

function init(): State {
  return {
    tiles: createInitialTiles(),
    score: 0,
    best: loadBest(),
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
        // Free — execute immediately
        const next = startMove(
          state.tiles,
          action.direction,
          { score: state.score, best: state.best, gameOver: state.gameOver },
          state.queue,
          state.seq,
          state.mergeSeq,
        );
        return next ?? state; // invalid move → ignore
      }

      // Busy — buffer if there's room (deduplicate consecutive identical directions)
      if (state.queue.length >= QUEUE_MAX) return state;
      const last = state.queue[state.queue.length - 1];
      if (last === action.direction) return state; // skip duplicate
      return { ...state, queue: [...state.queue, action.direction] };
    }

    case 'SETTLE': {
      if (!state.busy) return state;

      // Finalise current move: remove absorbed tiles, spawn new tile
      const withoutAbsorbed = state.tiles.filter(t => !t.isAbsorbed);
      const withNew         = addRandomTile(withoutAbsorbed);
      const newScore        = state.score + state.pendingGain;
      const newBest         = Math.max(state.best, newScore);
      if (newBest > state.best) saveBest(newBest);

      // Try consuming the next valid move from the queue
      const remainingQueue = [...state.queue];
      while (remainingQueue.length > 0) {
        const nextDir    = remainingQueue.shift()!;
        const nextState  = startMove(
          withNew,
          nextDir,
          { score: newScore, best: newBest, gameOver: false },
          remainingQueue,
          state.seq,
          state.mergeSeq,
        );
        if (nextState) return nextState; // valid queued move found — stay busy
        // else: invalid direction in queue → drop and try next
      }

      // No valid queued move — go idle
      // Keep isMerged: true so CSS pop animation plays on its own (no timer needed)
      const idleTiles = withNew.map(t => ({ ...t, isAbsorbed: false }));
      const newMergeSeq = state.pendingMerges > 0 ? state.mergeSeq + 1 : state.mergeSeq;
      return {
        ...state,
        tiles: idleTiles,
        score: newScore,
        best: newBest,
        gameOver: !hasMovesAvailable(idleTiles),
        busy: false,
        queue: [],
        seq: state.seq + 1,
        mergeSeq: newMergeSeq,
        pendingGain: 0,
        pendingMerges: 0,
        pendingMaxMerge: 0,
      };
    }

    case 'RESTART':
      return { ...init(), best: state.best };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseGame2048Options {
  /** When false, keyboard / swipe input listeners are not registered.
   *  Useful when another screen (e.g. the main menu) is in front of the game. */
  inputEnabled?: boolean;
}

export function useGame2048(options: UseGame2048Options = {}) {
  const { inputEnabled = true } = options;
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Keep a ref to pendingMerges/pendingMaxMerge for the timer callback
  const pendingRef = useRef({ merges: 0, maxMerge: 0 });
  pendingRef.current = { merges: state.pendingMerges, maxMerge: state.pendingMaxMerge };

  // Fire SETTLE after slide animation finishes.
  // IMPORTANT: timer starts from requestAnimationFrame (first paint after React updates DOM),
  // NOT from the dispatch moment. On slow phones React render takes ~80-150ms, so starting
  // the timer from dispatch causes SETTLE to fire before CSS transitions visually complete.
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
  // When inputEnabled is false (e.g. menu screen) we don't attach this listener
  // so the menu can scroll normally.
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
    restart,
  };
}
