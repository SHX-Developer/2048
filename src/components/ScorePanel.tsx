import { useTheme } from '../contexts/ThemeContext';

interface ScorePanelProps {
  score: number;
  best: number;
  onRestart: () => void;
  onMenu: () => void;
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  const isClassic = theme.id === 'classic';
  const isDark    = theme.id === 'aesthetic' || theme.id === 'fire';
  return (
    <div
      style={{
        background: theme.scoreBoxBg,
        borderRadius: isClassic ? '3px' : '10px',
        padding: '6px 16px',
        textAlign: 'center',
        minWidth: '72px',
        boxShadow: isDark
          ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
          : (isClassic ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.4)'),
        transition: 'background 0.35s ease',
      }}
    >
      <div
        style={{
          color: theme.scoreBoxLabel,
          fontSize: '12px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'color 0.35s ease',
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: theme.scoreBoxValue,
          fontSize: '22px',
          fontWeight: 800,
          lineHeight: 1.2,
          transition: 'color 0.35s ease',
        }}
      >
        {value}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}

function ActionButton({ label, onClick, variant = 'primary' }: ActionButtonProps) {
  const theme = useTheme();
  const isClassic = theme.id === 'classic';
  const isDark    = theme.id === 'aesthetic' || theme.id === 'fire';

  const baseBg = variant === 'primary'
    ? theme.buttonBg
    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)');
  const hoverBg = variant === 'primary'
    ? theme.buttonBgHover
    : (isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)');
  const fg = variant === 'primary'
    ? theme.buttonFg
    : theme.textColor;

  return (
    <button
      onClick={onClick}
      style={{
        background: baseBg,
        color: fg,
        border: 'none',
        borderRadius: isClassic ? '3px' : '10px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: variant === 'primary' && !isClassic
          ? `0 4px 14px ${theme.accent}55`
          : 'none',
        transition: 'background 0.18s ease, transform 0.15s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = baseBg; }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {label}
    </button>
  );
}

export function ScorePanel({ score, best, onRestart, onMenu }: ScorePanelProps) {
  const theme = useTheme();
  const isDark = theme.id === 'aesthetic' || theme.id === 'fire';

  return (
    <>
      {/* Row 1: title + score boxes */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(48px, 12vw, 72px)',
            fontWeight: 800,
            color: theme.titleColor,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            textShadow: isDark
              ? `0 0 24px ${theme.accent}66, 0 0 48px ${theme.accent}33`
              : 'none',
            transition: 'color 0.35s ease, text-shadow 0.35s ease',
          }}
        >
          2048
        </h1>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <ScoreBox label="Score" value={score} />
          <ScoreBox label="Best"  value={best}  />
        </div>
      </div>

      {/* Row 2: subtitle + new game button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          gap: '8px',
        }}
      >
        <p
          style={{
            margin: 0,
            color: theme.textColor,
            fontSize: '14px',
            flex: 1,
            transition: 'color 0.35s ease',
          }}
        >
          Join the tiles, get to&nbsp;<strong>2048!</strong>
        </p>

        <div style={{ display: 'flex', gap: '6px' }}>
          <ActionButton label="Menu" onClick={onMenu} variant="ghost" />
          <ActionButton label="New Game" onClick={onRestart} variant="primary" />
        </div>
      </div>
    </>
  );
}
