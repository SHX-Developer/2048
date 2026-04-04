import { memo, useMemo } from 'react';
import type { TileData } from '../utils/gameLogic';
import { Tile } from './Tile';
import { GameOverModal } from './GameOverModal';
import { ParticleCanvas } from './ParticleCanvas';
import { GRID_SIZE, BOARD_BG, CELL_BG, CELL_SIZE, cellOffset } from '../utils/constants';

interface GameBoardProps {
  tiles: TileData[];
  score: number;
  gameOver: boolean;
  onRestart: () => void;
  mergeSeq: number;
}

// Static background — memoized so it never re-renders
const BoardBackground = memo(function BoardBackground() {
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
              backgroundColor: CELL_BG,
              borderRadius: '3px',
            }}
          />
        ))
      )}
    </>
  );
});

export function GameBoard({ tiles, score, gameOver, onRestart, mergeSeq }: GameBoardProps) {
  // Only recomputed when `tiles` reference changes — avoids new array on every render
  const mergedTiles = useMemo(() => tiles.filter(t => t.isMerged), [tiles]);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: BOARD_BG,
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <BoardBackground />

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
