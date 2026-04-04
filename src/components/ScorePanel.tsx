interface ScorePanelProps {
  score: number;
  best: number;
  onRestart: () => void;
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        backgroundColor: '#bbada0',
        borderRadius: '3px',
        padding: '6px 16px',
        textAlign: 'center',
        minWidth: '72px',
      }}
    >
      <div style={{ color: '#eee4da', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ color: '#f9f6f2', fontSize: '22px', fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

export function ScorePanel({ score, best, onRestart }: ScorePanelProps) {
  return (
    <>
      {/* Row 1: title + score boxes */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(48px, 12vw, 72px)',
            fontWeight: 700,
            color: '#776e65',
            lineHeight: 1,
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
        }}
      >
        <p style={{ margin: 0, color: '#776e65', fontSize: '14px' }}>
          Join the tiles, get to&nbsp;<strong>2048!</strong>
        </p>

        <button
          onClick={onRestart}
          style={{
            backgroundColor: '#8f7a66',
            color: '#f9f6f2',
            border: 'none',
            borderRadius: '3px',
            padding: '8px 18px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#a08060')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#8f7a66')}
        >
          New Game
        </button>
      </div>
    </>
  );
}
