import { useEffect, useState } from 'react';
import type { TileData } from '../utils/gameLogic';
import { BOARD_PAD, CELL_GAP, cellSize } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface Popup {
  id: number;
  value: number;
  x: number; // % of board
  y: number;
}

interface ScorePopupsProps {
  mergedTiles: TileData[];
  mergeSeq: number;
  gridSize: number;
}

let _pid = 0;
const POPUP_DURATION = 950;

/**
 * Floating "+N" numbers that drift up and fade out from each merged tile.
 * Spawned once per mergeSeq change. Auto-cleans after the animation finishes
 * (no react-spring / fancy deps — plain CSS keyframes + setTimeout cleanup).
 */
export function ScorePopups({ mergedTiles, mergeSeq, gridSize }: ScorePopupsProps) {
  const theme = useTheme();
  const [popups, setPopups] = useState<Popup[]>([]);

  useEffect(() => {
    if (mergeSeq === 0 || mergedTiles.length === 0) return;
    const cs = cellSize(gridSize);
    const newPopups: Popup[] = mergedTiles.map(t => ({
      id: ++_pid,
      value: t.value,
      x: BOARD_PAD + t.col * (cs + CELL_GAP) + cs / 2,
      y: BOARD_PAD + t.row * (cs + CELL_GAP) + cs / 2,
    }));
    setPopups(prev => [...prev, ...newPopups]);

    const ids = new Set(newPopups.map(p => p.id));
    const t = setTimeout(() => {
      setPopups(prev => prev.filter(p => !ids.has(p.id)));
    }, POPUP_DURATION + 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeSeq]);

  if (popups.length === 0) return null;

  const isDark = theme.id === 'aesthetic' || theme.id === 'fire';
  const color  = isDark ? '#ffffff' : theme.titleColor;
  const shadow = isDark
    ? `0 0 14px ${theme.accent}cc, 0 0 28px ${theme.accent}66`
    : `0 2px 8px rgba(0, 0, 0, 0.22)`;

  return (
    <>
      {popups.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top:  `${p.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 60,
          }}
        >
          <div
            className="score-popup"
            style={{
              color,
              textShadow: shadow,
              fontSize: 'clamp(18px, 4.2vw, 28px)',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            +{p.value}
          </div>
        </div>
      ))}
    </>
  );
}
