import { memo } from 'react';
import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, CELL_SIZE, BOARD_PAD, STEP_RATIO, tileFontSize } from '../utils/constants';

interface TileProps {
  tile: TileData;
}

// Skip re-render when nothing visual changed.
// `busy` intentionally NOT compared — passing it caused all 16 tiles to
// re-render twice per move (on busy:false→true and busy:true→false).
function tilesEqual(prev: TileProps, next: TileProps) {
  const a = prev.tile, b = next.tile;
  return (
    a.row        === b.row        &&
    a.col        === b.col        &&
    a.value      === b.value      &&
    a.isNew      === b.isNew      &&
    a.isMerged   === b.isMerged   &&
    a.isAbsorbed === b.isAbsorbed
  );
}

export const Tile = memo(function Tile({ tile }: TileProps) {
  const { bg, fg } = TILE_COLORS[tile.value] ?? TILE_DEFAULT;
  const fontSize = tileFontSize(tile.value);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${BOARD_PAD}%`,
    top:  `${BOARD_PAD}%`,
    width:  `${CELL_SIZE}%`,
    height: `${CELL_SIZE}%`,
    // Only `transform` changes — GPU-composited, zero layout recalc.
    // 280ms matches SLIDE_MS. ease-out-sine: gentle start, soft landing — no jarring snap.
    transform:  `translate(${tile.col * STEP_RATIO}%, ${tile.row * STEP_RATIO}%)`,
    // ease-in-out-sine: slow start → accelerates mid-way → soft landing.
    // Tiles clearly begin moving (unlike ease-out which rushes instantly to target).
    transition: tile.isNew ? 'none' : 'transform 500ms cubic-bezier(0.37, 0, 0.63, 1)',
    zIndex:     tile.isAbsorbed ? 5 : tile.isMerged ? 20 : 10,
    willChange: 'transform', // keep pre-promoted — 16 small layers is fine on modern phones
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
          position: 'relative',
          borderRadius: '3px',
          backgroundColor: bg,
          color: fg,
          fontWeight: 700,
          fontSize,
          lineHeight: 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          userSelect: 'none',
        }}
      >
        {tile.value}
        {/* White overlay — fades in+scales at merge peak using only opacity+transform.
            Fully GPU-composited: zero repaint cost. */}
        {tile.isMerged && (
          <span className="tile-bright" aria-hidden="true" style={{ fontSize }}>
            {tile.value}
          </span>
        )}
      </div>
    </div>
  );
}, tilesEqual);
