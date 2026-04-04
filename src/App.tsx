import { useEffect } from 'react';
import { useGame2048 } from './hooks/useGame2048';
import { GameBoard } from './components/GameBoard';
import { ScorePanel } from './components/ScorePanel';

export default function App() {
  const { tiles, score, best, gameOver, mergeSeq, restart } = useGame2048();

  // Telegram Mini App initialisation
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    try {
      // 1. Signal the app is ready (unlocks HapticFeedback)
      tg.ready();
      // 2. Force the app to expand to full screen (prevents accidental collapse)
      tg.expand();
      // 3. Disable Telegram's own swipe-down-to-close gesture (Bot API 7.7+)
      //    This is the most direct fix for the "game collapses on downward swipe" issue
      tg.disableVerticalSwipes?.();
    } catch { /* ignore older Telegram versions */ }
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
        <GameBoard tiles={tiles} score={score} gameOver={gameOver} onRestart={restart} mergeSeq={mergeSeq} />
      </div>
    </div>
  );
}
