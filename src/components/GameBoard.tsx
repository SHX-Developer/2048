import { memo, useMemo } from 'react';
import type { TileData } from '../utils/gameLogic';
import { Tile } from './Tile';
import { GameOverModal } from './GameOverModal';
import { ParticleCanvas } from './ParticleCanvas';
import { GRID_SIZE, CELL_SIZE, cellOffset } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';

interface GameBoardProps {
  tiles: TileData[];
  score: number;
  gameOver: boolean;
  onRestart: () => void;
  mergeSeq: number;
}

interface BoardBackgroundProps {
  cellBg: string;
  radius: string;
}

// Static background — memoized so it never re-renders unless cell color/radius changes
const BoardBackground = memo(function BoardBackground({ cellBg, radius }: BoardBackgroundProps) {
  return (
    <>
      {Array.from({ length: GRID_SIZE }, (_, r) =>
        Array.from({ length: GRID_SIZE }, (_, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left:   `${cellOffset(c)}%`,
              top:    `${cellOffset(r)}%`,
              width:  `${CELL_SIZE}%`,
              height: `${CELL_SIZE}%`,
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

export function GameBoard({ tiles, score, gameOver, onRestart, mergeSeq }: GameBoardProps) {
  const theme = useTheme();
  // Only recomputed when `tiles` reference changes — avoids new array on every render
  const mergedTiles = useMemo(() => tiles.filter(t => t.isMerged), [tiles]);

  const radius = theme.id === 'aesthetic' ? '8px' : '3px';
  const boardRadius = theme.id === 'aesthetic' ? '14px' : '6px';

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: theme.boardBg,
          borderRadius: boardRadius,
          overflow: 'hidden',
          boxShadow: theme.boardShadow,
          backdropFilter: theme.id === 'aesthetic' ? 'blur(20px)' : undefined,
          WebkitBackdropFilter: theme.id === 'aesthetic' ? 'blur(20px)' : undefined,
          transition: 'background 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <BoardBackground cellBg={theme.cellBg} radius={radius} />

        {tiles.map(tile => (
          <Tile key={tile.id} tile={tile} />
        ))}

        <ParticleCanvas mergedTiles={mergedTiles} mergeSeq={mergeSeq} />
      </div>

      {gameOver && (
        <GameOverModal score={score} onRestart={onRestart} />
      )}
    </div>
  );
}
