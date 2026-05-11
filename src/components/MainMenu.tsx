import { useState } from 'react';
import { THEME_LIST, type Theme, type ThemeId } from '../utils/themes';

interface MainMenuProps {
  initialThemeId: ThemeId;
  onStart: (themeId: ThemeId) => void;
}

/**
 * Main menu — lets the player pick a visual style and start a game.
 * The menu itself uses the *currently-selected* theme for instant preview.
 */
export function MainMenu({ initialThemeId, onStart }: MainMenuProps) {
  const [selectedId, setSelectedId] = useState<ThemeId>(initialThemeId);
  const selected = THEME_LIST.find(t => t.id === selectedId) ?? THEME_LIST[0];

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
      {/* Ambient gradient overlay for the aesthetic theme */}
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
          gap: '28px',
          animation: 'menuFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(64px, 16vw, 96px)',
              fontWeight: 800,
              color: selected.titleColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              textShadow: selected.id === 'aesthetic'
                ? '0 0 32px rgba(255, 110, 196, 0.4), 0 0 64px rgba(120, 115, 245, 0.3)'
                : 'none',
              transition: 'color 0.35s ease, text-shadow 0.35s ease',
            }}
          >
            2048
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '15px',
              color: selected.subtleText,
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transition: 'color 0.35s ease',
            }}
          >
            Choose your style
          </p>
        </div>

        {/* Theme cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
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

        {/* Play button */}
        <button
          onClick={() => onStart(selectedId)}
          className="menu-play-btn"
          style={{
            width: '100%',
            padding: '16px 32px',
            background: selected.buttonBg,
            color: selected.buttonFg,
            border: 'none',
            borderRadius: selected.id === 'aesthetic' ? '14px' : '4px',
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: selected.id === 'aesthetic'
              ? '0 8px 28px rgba(255, 110, 196, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12) inset'
              : '0 2px 6px rgba(0,0,0,0.15)',
            transition: 'transform 0.18s ease, box-shadow 0.25s ease, background 0.35s ease',
          }}
        >
          Play
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

// ─── Theme preview card ───────────────────────────────────────────────────────

interface ThemeCardProps {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
}

function ThemeCard({ theme, active, onSelect }: ThemeCardProps) {
  // Preview sample of 4 tile colors (2, 8, 64, 2048)
  const previewValues = [2, 8, 64, 2048] as const;

  return (
    <button
      onClick={onSelect}
      className="theme-card"
      style={{
        position: 'relative',
        padding: '14px 12px 16px',
        background: theme.boardBg,
        border: 'none',
        borderRadius: theme.id === 'aesthetic' ? '14px' : '6px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: active
          ? (theme.id === 'aesthetic'
              ? '0 0 0 2px #ff6ec4, 0 8px 28px rgba(255, 110, 196, 0.4)'
              : '0 0 0 3px #8f7a66, 0 4px 12px rgba(0,0,0,0.18)')
          : (theme.id === 'aesthetic'
              ? '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255,255,255,0.08)'
              : '0 2px 6px rgba(0,0,0,0.12)'),
        transition: 'transform 0.18s ease, box-shadow 0.25s ease',
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      {/* Mini tile preview row */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {previewValues.map(v => {
          const style = theme.tiles[v] ?? theme.tileDefault;
          return (
            <div
              key={v}
              style={{
                flex: 1,
                aspectRatio: '1',
                background: style.bg,
                color: style.fg,
                borderRadius: theme.id === 'aesthetic' ? '6px' : '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: v >= 1000 ? '9px' : v >= 10 ? '11px' : '12px',
                fontWeight: 800,
                boxShadow: theme.id === 'aesthetic' && style.glow
                  ? `0 0 10px ${style.glow}`
                  : 'none',
              }}
            >
              {v}
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: theme.titleColor,
          marginBottom: '2px',
        }}
      >
        {theme.name}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: theme.subtleText,
          lineHeight: 1.35,
        }}
      >
        {theme.tagline}
      </div>

      {/* Active check badge */}
      {active && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: theme.id === 'aesthetic' ? '#ff6ec4' : '#8f7a66',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.id === 'aesthetic'
              ? '0 0 12px rgba(255, 110, 196, 0.7)'
              : '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          ✓
        </div>
      )}
    </button>
  );
}
