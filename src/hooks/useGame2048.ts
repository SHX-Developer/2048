import { useCallback, useEffect, useReducer } from 'react';
import type { TileData, Direction } from '../utils/gameLogic';
import { createInitialTiles, addRandomTile, moveTiles, hasMovesAvailable } from '../utils/gameLogic';

// ─── Constants ───────────────────────────────────────────────────────────────

const SLIDE_MS = 200;   // CSS transition duration for tile movement
const POP_MS   = 220;   // merge-pop animation duration

const BEST_KEY = '2048_best';
const loadBest = (): number => {
  try { return parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
};
const saveBest = (n: number) => {
  try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* ignore */ }
};

// ─── State / Reducer ─────────────────────────────────────────────────────────

/**
 * Three-phase move sequence:
 *  idle  →  MOVE  →  sliding  →  SETTLE  →  popping  →  CLEANUP  →  idle
 *
 *  sliding : tiles animate from old → new positions, absorbed tiles fly to merge target
 *  popping : absorbed tiles removed, merged tiles play pop animation, new tile spawns
 *  idle    : isMerged / isNew flags cleared on next MOVE (they're cleared before each move)
 */
type Phase = 'idle' | 'sliding' | 'popping';

interface State {
  tiles: TileData[];
  score: number;
  best: number;
  gameOver: boolean;
  phase: Phase;
  seq: number;         // increments each phase change to re-trigger useEffect
  pendingGain: number;
}

type Action =
  | { type: 'MOVE'; direction: Direction }
  | { type: 'SETTLE' }   // slide finished → remove absorbed, spawn new, start pop
  | { type: 'CLEANUP' }  // pop finished  → clear flags, back to idle
  | { type: 'RESTART' };

function init(): State {
  return {
    tiles: createInitialTiles(),
    score: 0,
    best: loadBest(),
    gameOver: false,
    phase: 'idle',
    seq: 0,
    pendingGain: 0,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MOVE': {
      if (state.phase !== 'idle' || state.gameOver) return state;
      // Clear stale animation flags before computing the new move
      const freshTiles = state.tiles.map(t => ({ ...t, isNew: false, isMerged: false }));
      const result = moveTiles(freshTiles, action.direction);
      if (!result.moved) return state;
      return {
        ...state,
        tiles: result.tiles,
        phase: 'sliding',
        seq: state.seq + 1,
        pendingGain: result.scoreGain,
      };
    }

    case 'SETTLE': {
      if (state.phase !== 'sliding') return state;
      // Remove absorbed tiles, spawn new tile (it will animate in)
      const withoutAbsorbed = state.tiles.filter(t => !t.isAbsorbed);
      const withNew = addRandomTile(withoutAbsorbed);
      const newScore = state.score + state.pendingGain;
      const newBest  = Math.max(state.best, newScore);
      if (newBest > state.best) saveBest(newBest);
      return {
        ...state,
        tiles: withNew,
        score: newScore,
        best: newBest,
        phase: 'popping',
        seq: state.seq + 1,
        pendingGain: 0,
      };
    }

    case 'CLEANUP': {
      if (state.phase !== 'popping') return state;
      const cleaned = state.tiles.map(t => ({ ...t, isNew: false, isMerged: false }));
      return {
        ...state,
        tiles: cleaned,
        gameOver: !hasMovesAvailable(cleaned),
        phase: 'idle',
        seq: state.seq + 1,
      };
    }

    case 'RESTART':
      return { ...init(), best: state.best };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGame2048() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  // Drive the phase state machine with timers
  useEffect(() => {
    if (state.phase === 'sliding') {
      const id = setTimeout(() => {
        // Haptic feedback for merges via Telegram Web App API
        if (state.pendingGain > 0) {
          try {
            const tg = (window as any).Telegram?.WebApp?.HapticFeedback;
            if (tg) tg.impactOccurred('light');
          } catch { /* not in Telegram — ignore */ }
        }
        dispatch({ type: 'SETTLE' });
      }, SLIDE_MS + 10);
      return () => clearTimeout(id);
    }
    if (state.phase === 'popping') {
      const id = setTimeout(() => dispatch({ type: 'CLEANUP' }), POP_MS + 10);
      return () => clearTimeout(id);
    }
  }, [state.phase, state.seq, state.pendingGain]);

  const handleMove = useCallback((dir: Direction) => {
    dispatch({ type: 'MOVE', direction: dir });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  // Keyboard
  useEffect(() => {
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
  }, [handleMove]);

  // Touch swipe — also prevents page scroll while playing
  useEffect(() => {
    const MIN = 25;
    let sx = 0, sy = 0;

    const onStart = (e: TouchEvent) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => { e.preventDefault(); };
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
  }, [handleMove]);

  return { tiles: state.tiles, score: state.score, best: state.best, gameOver: state.gameOver, restart };
}
