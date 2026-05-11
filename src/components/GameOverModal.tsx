import { useTheme } from '../contexts/ThemeContext';

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

export function GameOverModal({ score, onRestart }: GameOverModalProps) {
  const theme = useTheme();
  const isAesthetic = theme.id === 'aesthetic';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: isAesthetic ? '14px' : '6px',
        background: theme.modalOverlay,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.35s ease',
        backdropFilter: isAesthetic ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: isAesthetic ? 'blur(8px)' : undefined,
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 'clamp(36px, 9vw, 60px)',
          fontWeight: 800,
          color: theme.modalText,
          letterSpacing: '-0.02em',
          textShadow: isAesthetic
            ? '0 0 28px rgba(255, 110, 196, 0.5)'
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
          borderRadius: isAesthetic ? '12px' : '3px',
          padding: '12px 28px',
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          boxShadow: isAesthetic
            ? '0 8px 28px rgba(255, 110, 196, 0.45)'
            : 'none',
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
