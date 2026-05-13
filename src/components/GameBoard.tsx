import { memo, useEffect, useMemo, useState } from 'react';
import type { TileData } from '../utils/gameLogic';
import { Tile } from './Tile';
import { GameOverModal } from './GameOverModal';
import { ParticleCanvas } from './ParticleCanvas';
import { ScorePopups } from './ScorePopups';
import { cellSize, cellOffset } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface GameBoardProps {
  tiles: TileData[];
  score: number;
  gameOver: boolean;
  onRestart: () => void;
  mergeSeq: number;
  gridSize: number;
}

interface BoardBackgroundProps {
  gridSize: number;
  cellBg: string;
  radius: string;
}

// Static background — memoized so it only rerenders when grid size / color changes
const BoardBackground = memo(function BoardBackground({ gridSize, cellBg, radius }: BoardBackgroundProps) {
  const cs = cellSize(gridSize);
  return (
    <>
      {Array.from({ length: gridSize }, (_, r) =>
        Array.from({ length: gridSize }, (_, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left:   `${cellOffset(c, gridSize)}%`,
              top:    `${cellOffset(r, gridSize)}%`,
              width:  `${cs}%`,
              height: `${cs}%`,
              background: cellBg,
              borderRadius: radius,
              transition: 'background 0.35s ease',
            }}
          />
        ))
      )}
    </>
  );
});

/** Threshold above which a created tile shakes the board for impact. */
const MILESTONE = 1024;

export function GameBoard({ tiles, score, gameOver, onRestart, mergeSeq, gridSize }: GameBoardProps) {
  const theme = useTheme();
  const mergedTiles = useMemo(() => tiles.filter(t => t.isMerged), [tiles]);

  // Trigger board-shake when a milestone tile (≥1024) is created.
  // shakeTick increments per milestone so the CSS animation re-fires via
  // a className toggle (no remount → tiles & particles keep their state).
  const [shakeTick, setShakeTick] = useState(0);
  const [shaking, setShaking]     = useState(false);
  useEffect(() => {
    if (mergeSeq === 0) return;
    if (mergedTiles.some(t => t.value >= MILESTONE)) {
      setShakeTick(k => k + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeSeq]);
  useEffect(() => {
    if (shakeTick === 0) return;
    setShaking(false);
    // RAF-then-set tick: removes the class for one frame so re-adding it
    // restarts the keyframe animation cleanly.
    const raf = requestAnimationFrame(() => setShaking(true));
    const off = setTimeout(() => setShaking(false), 600);
    return () => { cancelAnimationFrame(raf); clearTimeout(off); };
  }, [shakeTick]);

  const isClassic = theme.id === 'classic';
  const cellRadius  = isClassic ? '3px' : '8px';
  const boardRadius = isClassic ? '6px' : '14px';

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      <div
        className={shaking ? 'board-shake' : undefined}
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.boardBg,
          borderRadius: boardRadius,
          overflow: 'hidden',
          boxShadow: theme.boardShadow,
          backdropFilter: !isClassic ? 'blur(20px)' : undefined,
          WebkitBackdropFilter: !isClassic ? 'blur(20px)' : undefined,
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <BoardBackground gridSize={gridSize} cellBg={theme.cellBg} radius={cellRadius} />

        {tiles.map(tile => (
          <Tile key={tile.id} tile={tile} gridSize={gridSize} />
        ))}

        <ParticleCanvas mergedTiles={mergedTiles} mergeSeq={mergeSeq} gridSize={gridSize} />
        <ScorePopups   mergedTiles={mergedTiles} mergeSeq={mergeSeq} gridSize={gridSize} />
      </div>

      {gameOver && (
        <GameOverModal score={score} onRestart={onRestart} />
      )}
    </div>
  );
}
