import { useTheme } from '../contexts/ThemeContext';

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

export function GameOverModal({ score, onRestart }: GameOverModalProps) {
  const theme = useTheme();
  const isClassic = theme.id === 'classic';
  const isDark    = theme.id === 'aesthetic' || theme.id === 'fire';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: isClassic ? '6px' : '14px',
        background: theme.modalOverlay,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.35s ease',
        backdropFilter: !isClassic ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: !isClassic ? 'blur(8px)' : undefined,
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 'clamp(36px, 9vw, 60px)',
          fontWeight: 800,
          color: theme.modalText,
          letterSpacing: '-0.02em',
          textShadow: isDark
            ? `0 0 28px ${theme.accent}80`
            : 'none',
        }}
      >
        Game over!
      </p>

      <p style={{ margin: '0 0 20px', color: theme.modalText, fontSize: '16px', opacity: 0.85 }}>
        Score:&nbsp;<strong>{score}</strong>
      </p>

      <button
        onClick={onRestart}
        style={{
          background: theme.buttonBg,
          color: theme.buttonFg,
          border: 'none',
          borderRadius: isClassic ? '3px' : '12px',
          padding: '12px 28px',
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          boxShadow: isClassic ? 'none' : `0 8px 28px ${theme.accent}66`,
          transition: 'background 0.18s ease, transform 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = theme.buttonBgHover; }}
        onMouseLeave={e => { e.currentTarget.style.background = theme.buttonBg; }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        Try again
      </button>
    </div>
  );
}
