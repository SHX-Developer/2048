/**
 * Theme definitions for 2048.
 *
 * Two styles ship by default:
 *  - "classic"   — the original Gabriele Cirulli palette.
 *  - "aesthetic" — a modern twilight / neon-pastel palette with soft glows.
 *
 * Every component reads from the active theme rather than hard-coded colors,
 * so adding a third theme later is a single-file change.
 */

export type ThemeId = 'classic' | 'aesthetic';

export interface TileStyle {
  /** Background — may be a solid color or a CSS gradient string. */
  bg: string;
  /** Foreground (text) color. */
  fg: string;
  /** Optional outer glow used by the aesthetic theme. */
  glow?: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  tagline: string;

  // Page
  pageBg: string;          // body / outer background (can be gradient)
  pageAccent?: string;     // optional ambient gradient overlay

  // Board
  boardBg: string;
  cellBg: string;
  boardShadow: string;

  // Typography
  titleColor: string;
  textColor: string;
  subtleText: string;

  // UI accents
  buttonBg: string;
  buttonBgHover: string;
  buttonFg: string;
  scoreBoxBg: string;
  scoreBoxLabel: string;
  scoreBoxValue: string;

  // Modal
  modalOverlay: string;
  modalText: string;

  // Tiles
  tileDefault: TileStyle;
  tiles: Record<number, TileStyle>;

  // Effects
  /** Tile shadow CSS (full string). */
  tileShadow: string;
  /** Particle base colors — used when tile color isn't a solid hex. */
  particleColors: string[];
  /** Whether to render an ambient floating-gradient background behind everything. */
  ambient: boolean;
}

// ─── Classic ──────────────────────────────────────────────────────────────────

export const CLASSIC: Theme = {
  id: 'classic',
  name: 'Classic',
  tagline: 'The original look — warm, cozy, familiar.',

  pageBg: '#faf8ef',
  boardBg: '#bbada0',
  cellBg:  '#cdc1b4',
  boardShadow: '0 0 0 transparent',

  titleColor: '#776e65',
  textColor:  '#776e65',
  subtleText: '#9c8c80',

  buttonBg:      '#8f7a66',
  buttonBgHover: '#a08060',
  buttonFg:      '#f9f6f2',

  scoreBoxBg:    '#bbada0',
  scoreBoxLabel: '#eee4da',
  scoreBoxValue: '#f9f6f2',

  modalOverlay: 'rgba(238, 228, 218, 0.73)',
  modalText:    '#776e65',

  tileDefault: { bg: '#3c3a32', fg: '#f9f6f2' },
  tiles: {
    2:    { bg: '#eee4da', fg: '#776e65' },
    4:    { bg: '#ede0c8', fg: '#776e65' },
    8:    { bg: '#f2b179', fg: '#f9f6f2' },
    16:   { bg: '#f59563', fg: '#f9f6f2' },
    32:   { bg: '#f67c5f', fg: '#f9f6f2' },
    64:   { bg: '#f65e3b', fg: '#f9f6f2' },
    128:  { bg: '#edcf72', fg: '#f9f6f2' },
    256:  { bg: '#edcc61', fg: '#f9f6f2' },
    512:  { bg: '#edc850', fg: '#f9f6f2' },
    1024: { bg: '#edc53f', fg: '#f9f6f2' },
    2048: { bg: '#edc22e', fg: '#f9f6f2' },
  },

  tileShadow: '0 2px 6px rgba(0,0,0,0.15)',
  particleColors: ['#edc22e', '#f67c5f', '#f2b179', '#eee4da'],
  ambient: false,
};

// ─── Aesthetic (Twilight Neon) ────────────────────────────────────────────────

export const AESTHETIC: Theme = {
  id: 'aesthetic',
  name: 'Twilight',
  tagline: 'Soft neon glow on a deep night sky.',

  pageBg: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 45%, #1a1b3a 100%)',
  pageAccent: 'radial-gradient(circle at 20% 10%, rgba(255,107,196,0.18) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(94,206,255,0.16) 0%, transparent 50%)',
  boardBg: 'rgba(40, 30, 70, 0.55)',
  cellBg:  'rgba(255, 255, 255, 0.06)',
  boardShadow: '0 12px 48px rgba(120, 60, 200, 0.35), inset 0 0 0 1px rgba(255,255,255,0.08)',

  titleColor: '#ffffff',
  textColor:  '#e7d9ff',
  subtleText: '#a99fc8',

  buttonBg:      'linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%)',
  buttonBgHover: 'linear-gradient(135deg, #ff8fd1 0%, #8a85f7 100%)',
  buttonFg:      '#ffffff',

  scoreBoxBg:    'rgba(255, 255, 255, 0.08)',
  scoreBoxLabel: '#b8a8e0',
  scoreBoxValue: '#ffffff',

  modalOverlay: 'rgba(26, 11, 46, 0.78)',
  modalText:    '#ffffff',

  tileDefault: { bg: 'linear-gradient(135deg, #fff 0%, #ddd 100%)', fg: '#1a0b2e', glow: 'rgba(255,255,255,0.35)' },
  tiles: {
    2:    { bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', fg: '#831843', glow: 'rgba(251,207,232,0.55)' },
    4:    { bg: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)', fg: '#3b1d6e', glow: 'rgba(196,181,253,0.55)' },
    8:    { bg: 'linear-gradient(135deg, #ff9eb5 0%, #ff6ec4 100%)', fg: '#ffffff', glow: 'rgba(255,110,196,0.55)' },
    16:   { bg: 'linear-gradient(135deg, #ff7eb6 0%, #ff4d97 100%)', fg: '#ffffff', glow: 'rgba(255,77,151,0.6)' },
    32:   { bg: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)', fg: '#ffffff', glow: 'rgba(168,85,247,0.6)' },
    64:   { bg: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', fg: '#ffffff', glow: 'rgba(99,102,241,0.65)' },
    128:  { bg: 'linear-gradient(135deg, #5eead4 0%, #2dd4bf 100%)', fg: '#ffffff', glow: 'rgba(45,212,191,0.6)' },
    256:  { bg: 'linear-gradient(135deg, #67e8f9 0%, #06b6d4 100%)', fg: '#ffffff', glow: 'rgba(6,182,212,0.65)' },
    512:  { bg: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', fg: '#ffffff', glow: 'rgba(245,158,11,0.65)' },
    1024: { bg: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', fg: '#ffffff', glow: 'rgba(225,29,72,0.7)' },
    2048: { bg: 'linear-gradient(135deg, #fde047 0%, #ff6ec4 50%, #7873f5 100%)', fg: '#ffffff', glow: 'rgba(255,110,196,0.85)' },
  },

  tileShadow: '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
  particleColors: ['#ff6ec4', '#7873f5', '#5eead4', '#fcd34d', '#67e8f9'],
  ambient: true,
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const THEMES: Record<ThemeId, Theme> = {
  classic:   CLASSIC,
  aesthetic: AESTHETIC,
};

export const THEME_LIST: Theme[] = [CLASSIC, AESTHETIC];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the tile style for a value, falling back to tileDefault. */
export function getTileStyle(theme: Theme, value: number): TileStyle {
  return theme.tiles[value] ?? theme.tileDefault;
}

/**
 * Extract a representative hex color from a tile background.
 * Used by the particle canvas which works in solid colors.
 * If the bg is a gradient, the *last* color stop is returned (the brighter end).
 */
export function tileParticleColor(theme: Theme, value: number): string {
  const style = getTileStyle(theme, value);
  const bg = style.bg;
  if (bg.startsWith('#')) return bg;
  // Pick the last hex/rgb in a gradient string
  const matches = bg.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/g);
  if (matches && matches.length > 0) return matches[matches.length - 1];
  // fallback
  return theme.particleColors[0];
}

// ─── LocalStorage ────────────────────────────────────────────────────────────

const THEME_KEY = '2048_theme';
export const loadThemeId = (): ThemeId => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'classic' || raw === 'aesthetic') return raw;
  } catch { /* ignore */ }
  return 'classic';
};
export const saveThemeId = (id: ThemeId) => {
  try { localStorage.setItem(THEME_KEY, id); } catch { /* ignore */ }
};
