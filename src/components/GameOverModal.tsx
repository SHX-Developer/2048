interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

export function GameOverModal({ score, onRestart }: GameOverModalProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '6px',
        backgroundColor: 'rgba(238, 228, 218, 0.73)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: 'clamp(36px, 9vw, 60px)',
          fontWeight: 700,
          color: '#776e65',
        }}
      >
        Game over!
      </p>

      <p style={{ margin: '0 0 20px', color: '#776e65', fontSize: '16px' }}>
        Score:&nbsp;<strong>{score}</strong>
      </p>

      <button
        onClick={onRestart}
        style={{
          backgroundColor: '#8f7a66',
          color: '#f9f6f2',
          border: 'none',
          borderRadius: '3px',
          padding: '12px 28px',
          fontSize: '18px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#a08060')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#8f7a66')}
      >
        Try again
      </button>
    </div>
  );
}
