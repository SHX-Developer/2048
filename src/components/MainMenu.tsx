import { useState } from 'react';
import { THEME_LIST, type Theme, type ThemeId } from '../utils/themes';
import { GRID_SIZES, type GridSize } from '../utils/constants';

interface MainMenuProps {
  initialThemeId: ThemeId;
  initialGridSize: GridSize;
  onStart: (themeId: ThemeId, gridSize: GridSize) => void;
}

/**
 * Main menu — pick a theme + a board size, then start the game.
 * The menu re-skins instantly when you switch themes so you can preview them.
 */
export function MainMenu({ initialThemeId, initialGridSize, onStart }: MainMenuProps) {
  const [selectedId, setSelectedId] = useState<ThemeId>(initialThemeId);
  const [gridSize, setGridSize]     = useState<GridSize>(initialGridSize);
  const selected = THEME_LIST.find(t => t.id === selectedId) ?? THEME_LIST[0];

  // Themes with dark page backgrounds need light surfaces and vice versa.
  const isDark = selected.id === 'aesthetic' || selected.id === 'fire';

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: selected.pageBg,
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
        transition: 'background 0.45s ease',
      }}
    >
      {/* Ambient gradient overlay */}
      {selected.ambient && selected.pageAccent && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: selected.pageAccent,
            animation: 'ambientShift 12s ease-in-out infinite alternate',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'menuFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(58px, 14vw, 88px)',
              fontWeight: 800,
              color: selected.titleColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              textShadow: isDark
                ? `0 0 32px ${selected.accent}66, 0 0 64px ${selected.accent}33`
                : 'none',
              transition: 'color 0.35s ease, text-shadow 0.35s ease',
            }}
          >
            2048
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '14px',
              color: selected.subtleText,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'color 0.35s ease',
            }}
          >
            Pick your style &amp; size
          </p>
        </div>

        {/* Theme picker */}
        <section style={{ width: '100%' }}>
          <SectionLabel theme={selected}>Theme</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              width: '100%',
            }}
          >
            {THEME_LIST.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                active={theme.id === selectedId}
                onSelect={() => setSelectedId(theme.id)}
              />
            ))}
          </div>
        </section>

        {/* Board size picker */}
        <section style={{ width: '100%' }}>
          <SectionLabel theme={selected}>Board size</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '4px',
              borderRadius: selected.id === 'classic' ? '4px' : '12px',
              background: isDark
                ? 'rgba(255,255,255,0.06)'
                : (selected.id === 'classic'
                    ? 'rgba(0,0,0,0.05)'
                    : 'rgba(255,255,255,0.45)'),
              boxShadow: isDark
                ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
                : 'none',
            }}
          >
            {GRID_SIZES.map(size => (
              <SizePill
                key={size}
                size={size}
                active={size === gridSize}
                theme={selected}
                onSelect={() => setGridSize(size)}
              />
            ))}
          </div>
        </section>

        {/* Play button */}
        <button
          onClick={() => onStart(selectedId, gridSize)}
          className="menu-play-btn"
          style={{
            width: '100%',
            padding: '16px 32px',
            background: selected.buttonBg,
            color: selected.buttonFg,
            border: 'none',
            borderRadius: selected.id === 'classic' ? '4px' : '14px',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: selected.id === 'classic'
              ? '0 2px 6px rgba(0,0,0,0.15)'
              : `0 8px 26px ${selected.accent}66, 0 0 0 1px rgba(255, 255, 255, 0.12) inset`,
            transition: 'transform 0.18s ease, box-shadow 0.25s ease, background 0.35s ease',
          }}
        >
          Play {gridSize}×{gridSize}
        </button>

        {/* Tagline */}
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: selected.subtleText,
            textAlign: 'center',
            transition: 'color 0.35s ease',
            minHeight: '1.4em',
          }}
        >
          {selected.tagline}
        </p>
      </div>
    </div>
  );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function SectionLabel({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: '0 0 8px',
        fontSize: '11px',
        color: theme.subtleText,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        transition: 'color 0.35s ease',
      }}
    >
      {children}
    </div>
  );
}

interface ThemeCardProps {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, active, onSelect }: ThemeCardProps) {
  // Compact preview — 4 representative tiles (2, 32, 256, 2048)
  // chosen so each end of the gradient spectrum is visible at a glance.
  const previewValues = [2, 32, 256, 2048] as const;
  const isClassic = theme.id === 'classic';
  const accent    = theme.accent;

  return (
    <button
      onClick={onSelect}
      className="theme-card"
      style={{
        position: 'relative',
        padding: '8px 6px 10px',
        background: theme.boardBg,
        border: 'none',
        borderRadius: isClassic ? '6px' : '12px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: active
          ? `0 0 0 2px ${accent}, 0 8px 22px ${accent}55`
          : (isClassic
              ? '0 2px 6px rgba(0,0,0,0.12)'
              : '0 4px 14px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255,255,255,0.12)'),
        transition: 'transform 0.18s ease, box-shadow 0.25s ease',
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Mini tile preview row */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
        {previewValues.map(v => {
          const style = theme.tiles[v] ?? theme.tileDefault;
          return (
            <div
              key={v}
              style={{
                flex: 1,
                aspectRatio: '1',
                background: style.bg,
                borderRadius: isClassic ? '3px' : '4px',
                boxShadow: !isClassic && style.glow ? `0 0 6px ${style.glow}` : 'none',
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: theme.titleColor,
          lineHeight: 1.1,
          letterSpacing: '0.01em',
        }}
      >
        {theme.name}
      </div>

      {active && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: accent,
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 8px ${accent}bb`,
          }}
        >
          ✓
        </div>
      )}
    </button>
  );
}

interface SizePillProps {
  size: GridSize;
  active: boolean;
  theme: Theme;
  onSelect: () => void;
}

function SizePill({ size, active, theme, onSelect }: SizePillProps) {
  const isClassic = theme.id === 'classic';
  return (
    <button
      onClick={onSelect}
      className="size-pill"
      aria-pressed={active}
      style={{
        padding: '12px 4px 10px',
        background: active ? theme.buttonBg : 'transparent',
        color: active ? theme.buttonFg : theme.textColor,
        border: 'none',
        borderRadius: isClassic ? '3px' : '10px',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: '15px',
        letterSpacing: '0.02em',
        boxShadow: active && !isClassic ? `0 4px 14px ${theme.accent}55` : 'none',
        transition: 'background 0.2s ease, color 0.2s ease, transform 0.15s ease, box-shadow 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        outline: 'none',
      }}
    >
      <MiniGrid n={size} active={active} theme={theme} />
      <span>{size}×{size}</span>
    </button>
  );
}

/** Tiny visual N×N grid preview rendered with simple divs. */
function MiniGrid({ n, active, theme }: { n: number; active: boolean; theme: Theme }) {
  const dotColor = active
    ? (theme.buttonFg)
    : (theme.id === 'classic' ? theme.titleColor : theme.textColor);
  return (
    <div
      aria-hidden
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${n}, 1fr)`,
        gap: '2px',
        width: '28px',
        height: '28px',
      }}
    >
      {Array.from({ length: n * n }, (_, i) => (
        <div
          key={i}
          style={{
            background: dotColor,
            opacity: active ? 0.8 : 0.45,
            borderRadius: '1.5px',
            transition: 'background 0.2s ease, opacity 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}
