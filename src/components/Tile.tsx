import { memo } from 'react';
import type { TileData } from '../utils/gameLogic';
import { CELL_SIZE, BOARD_PAD, STEP_RATIO, tileFontSize } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { getTileStyle } from '../utils/themes';

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
  const theme = useTheme();
  const { bg, fg, glow } = getTileStyle(theme, tile.value);
  const fontSize = tileFontSize(tile.value);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${BOARD_PAD}%`,
    top:  `${BOARD_PAD}%`,
    width:  `${CELL_SIZE}%`,
    height: `${CELL_SIZE}%`,
    // Only `transform` changes — GPU-composited, zero layout recalc.
    transform:  `translate(${tile.col * STEP_RATIO}%, ${tile.row * STEP_RATIO}%)`,
    // Smooth, slightly anticipating curve: starts a touch quick, soft landing.
    transition: tile.isNew ? 'none' : 'transform 230ms cubic-bezier(0.22, 0.61, 0.36, 1)',
    zIndex:     tile.isAbsorbed ? 5 : tile.isMerged ? 20 : 10,
    willChange: 'transform',
  };

  const innerClass = [
    'tile-inner',
    tile.isNew    ? 'tile-new'   : '',
    tile.isMerged ? 'tile-merge' : '',
    theme.id === 'aesthetic' ? 'tile-aesthetic' : '',
  ].filter(Boolean).join(' ');

  // Build the shadow: theme base + (aesthetic only) a colored glow.
  const shadow = theme.id === 'aesthetic' && glow
    ? `${theme.tileShadow}, 0 0 18px ${glow}`
    : theme.tileShadow;

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
          borderRadius: theme.id === 'aesthetic' ? '8px' : '3px',
          background: bg,
          color: fg,
          fontWeight: 800,
          fontSize,
          lineHeight: 1,
          boxShadow: shadow,
          userSelect: 'none',
          // Smooth color/glow transition when switching themes
          transition: 'background 0.35s ease, color 0.35s ease, box-shadow 0.35s ease',
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
