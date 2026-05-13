import { useEffect, useState, useCallback } from 'react';
import { useGame2048 } from './hooks/useGame2048';
import { GameBoard } from './components/GameBoard';
import { ScorePanel } from './components/ScorePanel';
import { MainMenu } from './components/MainMenu';
import { ThemeContext } from './contexts/ThemeContext';
import { THEMES, loadThemeId, saveThemeId, type ThemeId } from './utils/themes';
import { GRID_SIZES, type GridSize } from './utils/constants';

type Screen = 'menu' | 'game';

// ─── Grid-size persistence ────────────────────────────────────────────────────
const GRID_KEY = '2048_grid';
const loadGridSize = (): GridSize => {
  try {
    const raw = parseInt(localStorage.getItem(GRID_KEY) ?? '', 10);
    if (GRID_SIZES.includes(raw as GridSize)) return raw as GridSize;
  } catch { /* ignore */ }
  return 4;
};
const saveGridSize = (s: GridSize) => {
  try { localStorage.setItem(GRID_KEY, String(s)); } catch { /* ignore */ }
};

export default function App() {
  const [screen, setScreen]     = useState<Screen>('menu');
  const [themeId, setThemeId]   = useState<ThemeId>(() => loadThemeId());
  const [gridSize, setGridSize] = useState<GridSize>(() => loadGridSize());
  const theme                   = THEMES[themeId];

  const { tiles, score, best, gameOver, mergeSeq, restart } = useGame2048({
    gridSize,
    inputEnabled: screen === 'game',
  });

  // Telegram Mini App initialisation
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
    } catch { /* ignore older Telegram versions */ }
  }, []);

  const handleStart = useCallback((id: ThemeId, size: GridSize) => {
    setThemeId(id);
    saveThemeId(id);
    setGridSize(size);
    saveGridSize(size);
    // The hook will auto-restart when gridSize changes; if it's the same,
    // explicitly restart so a stale board from a previous session is reset.
    restart();
    setScreen('game');
  }, [restart]);

  const handleBackToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {screen === 'menu' ? (
        <MainMenu
          initialThemeId={themeId}
          initialGridSize={gridSize}
          onStart={handleStart}
        />
      ) : (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: theme.pageBg,
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.45s ease',
          }}
        >
          {/* Ambient overlay */}
          {theme.ambient && theme.pageAccent && (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background: theme.pageAccent,
                animation: 'ambientShift 12s ease-in-out infinite alternate',
                pointerEvents: 'none',
              }}
            />
          )}

          <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
            <ScorePanel
              score={score}
              best={best}
              onRestart={restart}
              onMenu={handleBackToMenu}
            />
            <GameBoard
              tiles={tiles}
              score={score}
              gameOver={gameOver}
              onRestart={restart}
              mergeSeq={mergeSeq}
              gridSize={gridSize}
            />
          </div>
        </div>
      )}
    </ThemeContext.Provider>
  );
}
