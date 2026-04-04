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
  busy: boolean;
}

// Pre-build the 16 background cell positions once — never re-created
const BG_CELLS = Array.from({ length: GRID_SIZE }, (_, r) =>
  Array.from({ length: GRID_SIZE }, (_, c) => ({ r, c, key: `${r}-${c}` }))
).flat();

export function GameBoard({ tiles, score, gameOver, onRestart, mergeSeq, busy }: GameBoardProps) {
  const mergedTiles = tiles.filter(t => t.isMerged);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
      {/* Board surface */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: BOARD_BG,
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        {/* ── Background cells ── */}
        {BG_CELLS.map(({ r, c, key }) => (
          <div
            key={key}
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
        ))}

        {/* ── Tile layer ── */}
        {tiles.map(tile => (
          <Tile key={tile.id} tile={tile} busy={busy} />
        ))}

        {/* ── Particle effects ── */}
        <ParticleCanvas mergedTiles={mergedTiles} mergeSeq={mergeSeq} />
      </div>

      {/* ── Game-over overlay ── */}
      {gameOver && (
        <GameOverModal score={score} onRestart={onRestart} />
      )}
    </div>
  );
}
