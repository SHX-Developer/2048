import { memo } from 'react';
import type { TileData } from '../utils/gameLogic';
import { TILE_COLORS, TILE_DEFAULT, CELL_SIZE, BOARD_PAD, STEP_RATIO, tileFontSize } from '../utils/constants';

interface TileProps {
  tile: TileData;
  // Passed from parent when a move is in flight — controls GPU layer promotion
  busy: boolean;
}

// Only re-render when something visual actually changed.
// On a typical move, 12–15 out of 16 tiles are untouched → skip their render entirely.
function tilesEqual(prev: TileProps, next: TileProps) {
  return (
    prev.busy           === next.busy           &&
    prev.tile.row       === next.tile.row       &&
    prev.tile.col       === next.tile.col       &&
    prev.tile.value     === next.tile.value     &&
    prev.tile.isNew     === next.tile.isNew     &&
    prev.tile.isMerged  === next.tile.isMerged  &&
    prev.tile.isAbsorbed=== next.tile.isAbsorbed
  );
}

export const Tile = memo(function Tile({ tile, busy }: TileProps) {
  const { bg, fg } = TILE_COLORS[tile.value] ?? TILE_DEFAULT;
  const fontSize = tileFontSize(tile.value);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${BOARD_PAD}%`,
    top:  `${BOARD_PAD}%`,
    width:  `${CELL_SIZE}%`,
    height: `${CELL_SIZE}%`,
    // GPU-composited: only `transform` changes, no layout recalc
    transform: `translate(${tile.col * STEP_RATIO}%, ${tile.row * STEP_RATIO}%)`,
    transition: tile.isNew ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
    zIndex: tile.isAbsorbed ? 5 : tile.isMerged ? 20 : 10,
    // Promote to GPU layer only while a move is in flight — avoids 16 permanent layers
    willChange: busy ? 'transform' : 'auto',
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
        {/* Bright overlay — white text that fades in/scales at pop peak.
            Uses ONLY opacity + transform → fully GPU-composited, zero repaint. */}
        {tile.isMerged && (
          <span
            className="tile-bright"
            aria-hidden="true"
            style={{ fontSize }}
          >
            {tile.value}
          </span>
        )}
      </div>
    </div>
  );
}, tilesEqual);
