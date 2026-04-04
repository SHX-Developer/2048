import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, CELL_SIZE, cellOffset, tileFontSize } from '../utils/constants';

interface TileProps {
  tile: TileData;
}

export function Tile({ tile }: TileProps) {
  const { bg, fg } = TILE_COLORS[tile.value] ?? TILE_DEFAULT;

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left:   `${cellOffset(tile.col)}%`,
    top:    `${cellOffset(tile.row)}%`,
    width:  `${CELL_SIZE}%`,
    height: `${CELL_SIZE}%`,
    // Smooth movement — duration matches SLIDE_MS in the hook
    // cubic-bezier: ease-out-quad, feels natural and not abrupt
    transition: tile.isNew ? 'none' : 'left 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94), top 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    // Absorbed tiles sit behind the winner
    zIndex: tile.isAbsorbed ? 5 : tile.isMerged ? 20 : 10,
  };

  const innerClass = [
    'tile-inner',
    tile.isNew      ? 'tile-new'    : '',
    tile.isMerged   ? 'tile-merge'  : '',
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
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
          userSelect: 'none',
        }}
      >
        {tile.value}
      </div>
    </div>
  );
}
