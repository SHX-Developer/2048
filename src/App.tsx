import { useEffect } from 'react';
import { useGame2048 } from './hooks/useGame2048';
import { GameBoard } from './components/GameBoard';
import { ScorePanel } from './components/ScorePanel';

export default function App() {
  const { tiles, score, best, gameOver, restart } = useGame2048();

  // Signal to Telegram that the Mini App is ready.
  // This is required before HapticFeedback becomes available.
  useEffect(() => {
    try { (window as any).Telegram?.WebApp?.ready(); } catch { /* not in Telegram */ }
  }, []);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: '#faf8ef',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <ScorePanel score={score} best={best} onRestart={restart} />
        <GameBoard tiles={tiles} score={score} gameOver={gameOver} onRestart={restart} />
      </div>
    </div>
  );
}
