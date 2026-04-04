import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, CELL_SIZE, BOARD_PAD, STEP_RATIO, tileFontSize } from '../utils/constants';

interface TileProps {
  tile: TileData;
}

export function Tile({ tile }: TileProps) {
  const { bg, fg } = TILE_COLORS[tile.value] ?? TILE_DEFAULT;

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    // Base anchor — never changes, so no layout recalc per frame
    left: `${BOARD_PAD}%`,
    top:  `${BOARD_PAD}%`,
    width:  `${CELL_SIZE}%`,
    height: `${CELL_SIZE}%`,
    // GPU-composited transform — smooth on any device, zero layout thrash
    transform: `translate(${tile.col * STEP_RATIO}%, ${tile.row * STEP_RATIO}%)`,
    // 220ms must match SLIDE_MS in useGame2048.ts
    // ease-out-expo: smooth glide with a buttery soft landing
    transition: tile.isNew ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: tile.isAbsorbed ? 5 : tile.isMerged ? 20 : 10,
    willChange: 'transform',
  };

  const innerClass = [
    'tile-inner',
    tile.isNew    ? 'tile-new'   : '',
    tile.isMerged ? 'tile-merge' : '',
  ].filter(Boolean).join(' ');

  return (
    <div style={posStyle}>
      <div
        className={innerClass}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '3px',
          backgroundColor: bg,
          color: fg,
          fontWeight: 700,
          fontSize: tileFontSize(tile.value),
          lineHeight: 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          userSelect: 'none',
        }}
      >
        {tile.value}
      </div>
    </div>
  );
}
