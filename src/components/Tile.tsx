import { memo } from 'react';
import type { TileData } from '../utils/gameLogic';
import { cellSize, stepRatio, BOARD_PAD, tileFontSize } from '../utils/constants';
import { useTheme } from '../contexts/ThemeContext';
import { getTileStyle } from '../utils/themes';

interface TileProps {
  tile: TileData;
  gridSize: number;
}

// Skip re-render when nothing visual changed.
// `busy` intentionally NOT compared — passing it caused all 16 tiles to
// re-render twice per move (on busy:false→true and busy:true→false).
function tilesEqual(prev: TileProps, next: TileProps) {
  const a = prev.tile, b = next.tile;
  return (
    prev.gridSize === next.gridSize &&
    a.row        === b.row        &&
    a.col        === b.col        &&
    a.value      === b.value      &&
    a.isNew      === b.isNew      &&
    a.isMerged   === b.isMerged   &&
    a.isAbsorbed === b.isAbsorbed
  );
}

export const Tile = memo(function Tile({ tile, gridSize }: TileProps) {
  const theme = useTheme();
  const { bg, fg, glow } = getTileStyle(theme, tile.value);
  const fontSize = tileFontSize(tile.value, gridSize);
  const cs       = cellSize(gridSize);
  const step     = stepRatio(gridSize);

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${BOARD_PAD}%`,
    top:  `${BOARD_PAD}%`,
    width:  `${cs}%`,
    height: `${cs}%`,
    // Only `transform` changes — GPU-composited, zero layout recalc.
    transform:  `translate(${tile.col * step}%, ${tile.row * step}%)`,
    // Weighted easeOutExpo-style curve: gentle acceleration, very soft landing.
    transition: tile.isNew ? 'none' : 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
    zIndex:     tile.isAbsorbed ? 5 : tile.isMerged ? 20 : 10,
    willChange: 'transform',
  };

  const innerClass = [
    'tile-inner',
    tile.isNew    ? 'tile-new'   : '',
    tile.isMerged ? 'tile-merge' : '',
    theme.id === 'aesthetic' ? 'tile-aesthetic' : '',
  ].filter(Boolean).join(' ');

  const shadow = theme.id !== 'classic' && glow
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
          borderRadius: theme.id === 'classic' ? '3px' : '8px',
          background: bg,
          color: fg,
          fontWeight: 800,
          fontSize,
          lineHeight: 1,
          boxShadow: shadow,
          userSelect: 'none',
          transition: 'background 0.35s ease, color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        {tile.value}
        {tile.isMerged && (
          <span className="tile-bright" aria-hidden="true" style={{ fontSize }}>
            {tile.value}
          </span>
        )}
      </div>
    </div>
  );
}, tilesEqual);
