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

export type ThemeId = 'classic' | 'aesthetic' | 'ocean' | 'peach' | 'fire' | 'ice';

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
  /** Single signature color used for selection rings, badges, etc. */
  accent: string;
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
  accent:        '#8f7a66',

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
  accent:        '#ff6ec4',

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

// ─── Ocean (Cool / Daylight) ──────────────────────────────────────────────────

export const OCEAN: Theme = {
  id: 'ocean',
  name: 'Ocean',
  tagline: 'Cool waves with a sunset on the horizon.',

  pageBg: 'linear-gradient(160deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
  pageAccent: 'radial-gradient(circle at 25% 15%, rgba(255,255,255,0.55) 0%, transparent 45%), radial-gradient(circle at 80% 90%, rgba(252,211,77,0.25) 0%, transparent 55%)',
  boardBg: 'rgba(255, 255, 255, 0.45)',
  cellBg:  'rgba(255, 255, 255, 0.55)',
  boardShadow: '0 14px 40px rgba(14, 116, 144, 0.22), inset 0 0 0 1px rgba(255,255,255,0.6)',

  titleColor: '#0c4a6e',
  textColor:  '#075985',
  subtleText: '#475569',

  buttonBg:      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  buttonBgHover: 'linear-gradient(135deg, #22d3ee 0%, #60a5fa 100%)',
  buttonFg:      '#ffffff',
  accent:        '#06b6d4',

  scoreBoxBg:    'rgba(255, 255, 255, 0.6)',
  scoreBoxLabel: '#0369a1',
  scoreBoxValue: '#0c4a6e',

  modalOverlay: 'rgba(186, 230, 253, 0.72)',
  modalText:    '#0c4a6e',

  tileDefault: { bg: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', fg: '#ffffff', glow: 'rgba(15,23,42,0.45)' },
  tiles: {
    2:    { bg: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)', fg: '#0c4a6e', glow: 'rgba(254,243,199,0.55)' },
    4:    { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', fg: '#0c4a6e', glow: 'rgba(186,230,253,0.6)' },
    8:    { bg: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)', fg: '#ffffff', glow: 'rgba(56,189,248,0.55)' },
    16:   { bg: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)', fg: '#ffffff', glow: 'rgba(14,165,233,0.6)' },
    32:   { bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', fg: '#ffffff', glow: 'rgba(2,132,199,0.65)' },
    64:   { bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', fg: '#ffffff', glow: 'rgba(8,145,178,0.65)' },
    128:  { bg: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)', fg: '#ffffff', glow: 'rgba(20,184,166,0.65)' },
    256:  { bg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', fg: '#ffffff', glow: 'rgba(16,185,129,0.65)' },
    512:  { bg: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', fg: '#ffffff', glow: 'rgba(245,158,11,0.7)' },
    1024: { bg: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', fg: '#ffffff', glow: 'rgba(234,88,12,0.75)' },
    2048: { bg: 'linear-gradient(135deg, #fde047 0%, #f97316 50%, #db2777 100%)', fg: '#ffffff', glow: 'rgba(249,115,22,0.85)' },
  },

  tileShadow: '0 4px 14px rgba(14, 116, 144, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
  particleColors: ['#06b6d4', '#3b82f6', '#14b8a6', '#fcd34d', '#f97316'],
  ambient: true,
};

// ─── Peach (Beige / Blush / Coral Aesthetic) ─────────────────────────────────

export const PEACH: Theme = {
  id: 'peach',
  name: 'Peach',
  tagline: 'Soft sunset blush — beige, pink and coral.',

  pageBg: 'linear-gradient(160deg, #fef3e7 0%, #fde0d2 40%, #fcc5b4 80%, #f8b4d9 100%)',
  pageAccent: 'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.55) 0%, transparent 50%), radial-gradient(circle at 82% 88%, rgba(255, 190, 165, 0.45) 0%, transparent 55%)',
  boardBg: 'rgba(255, 255, 255, 0.45)',
  cellBg:  'rgba(255, 255, 255, 0.55)',
  boardShadow: '0 14px 36px rgba(231, 132, 113, 0.25), inset 0 0 0 1px rgba(255,255,255,0.55)',

  titleColor: '#7a3826',
  textColor:  '#9f5544',
  subtleText: '#b87a6b',

  buttonBg:      'linear-gradient(135deg, #ff9eb1 0%, #ff7eb6 100%)',
  buttonBgHover: 'linear-gradient(135deg, #ffb1c0 0%, #ff9eca 100%)',
  buttonFg:      '#ffffff',
  accent:        '#ff7eb6',

  scoreBoxBg:    'rgba(255, 255, 255, 0.55)',
  scoreBoxLabel: '#9f5544',
  scoreBoxValue: '#7a3826',

  modalOverlay: 'rgba(254, 226, 213, 0.78)',
  modalText:    '#7a3826',

  tileDefault: { bg: 'linear-gradient(135deg, #8a4334 0%, #5d2715 100%)', fg: '#ffffff', glow: 'rgba(138, 67, 52, 0.5)' },
  tiles: {
    2:    { bg: 'linear-gradient(135deg, #fff9f3 0%, #fef0e0 100%)', fg: '#7a3826', glow: 'rgba(254, 240, 224, 0.6)' },
    4:    { bg: 'linear-gradient(135deg, #ffe4d4 0%, #ffd1b8 100%)', fg: '#7a3826', glow: 'rgba(255, 209, 184, 0.6)' },
    8:    { bg: 'linear-gradient(135deg, #ffc9b3 0%, #ffaf91 100%)', fg: '#ffffff', glow: 'rgba(255, 175, 145, 0.6)' },
    16:   { bg: 'linear-gradient(135deg, #ffb1a8 0%, #ff9a98 100%)', fg: '#ffffff', glow: 'rgba(255, 154, 152, 0.6)' },
    32:   { bg: 'linear-gradient(135deg, #ff9eb1 0%, #ff7eb6 100%)', fg: '#ffffff', glow: 'rgba(255, 126, 182, 0.65)' },
    64:   { bg: 'linear-gradient(135deg, #ff8aa8 0%, #ec6f9b 100%)', fg: '#ffffff', glow: 'rgba(236, 111, 155, 0.7)' },
    128:  { bg: 'linear-gradient(135deg, #ffa18a 0%, #ff7a5e 100%)', fg: '#ffffff', glow: 'rgba(255, 122, 94, 0.7)' },
    256:  { bg: 'linear-gradient(135deg, #ff9168 0%, #ff6f3c 100%)', fg: '#ffffff', glow: 'rgba(255, 111, 60, 0.75)' },
    512:  { bg: 'linear-gradient(135deg, #fbb464 0%, #f59b3d 100%)', fg: '#ffffff', glow: 'rgba(245, 155, 61, 0.75)' },
    1024: { bg: 'linear-gradient(135deg, #f0a87a 0%, #c97b51 100%)', fg: '#ffffff', glow: 'rgba(201, 123, 81, 0.75)' },
    2048: { bg: 'linear-gradient(135deg, #fdd49a 0%, #ff9eb1 50%, #d97053 100%)', fg: '#ffffff', glow: 'rgba(255, 158, 177, 0.85)' },
  },

  tileShadow: '0 4px 12px rgba(231, 132, 113, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  particleColors: ['#ff9eb1', '#ff7eb6', '#ffb091', '#fdd49a', '#ff6f3c'],
  ambient: true,
};

// ─── Fire (Flames / Embers) ──────────────────────────────────────────────────

export const FIRE: Theme = {
  id: 'fire',
  name: 'Fire',
  tagline: 'Embers, sparks, and burning gold.',

  pageBg: 'linear-gradient(180deg, #1a0500 0%, #2a0a02 30%, #421708 60%, #6e2509 100%)',
  pageAccent: 'radial-gradient(circle at 50% 105%, rgba(255, 80, 0, 0.55) 0%, transparent 55%), radial-gradient(circle at 80% 18%, rgba(255, 180, 0, 0.22) 0%, transparent 45%)',
  boardBg: 'rgba(20, 5, 0, 0.55)',
  cellBg:  'rgba(60, 22, 12, 0.55)',
  boardShadow: '0 14px 48px rgba(255, 80, 0, 0.4), inset 0 0 0 1px rgba(255, 130, 40, 0.18)',

  titleColor: '#ffd070',
  textColor:  '#ffcfa0',
  subtleText: '#d99560',

  buttonBg:      'linear-gradient(135deg, #ffae3a 0%, #ff5722 55%, #c81d00 100%)',
  buttonBgHover: 'linear-gradient(135deg, #ffbf57 0%, #ff6a3a 55%, #d92800 100%)',
  buttonFg:      '#ffffff',
  accent:        '#ff5722',

  scoreBoxBg:    'rgba(40, 12, 6, 0.55)',
  scoreBoxLabel: '#ffb070',
  scoreBoxValue: '#ffd9a0',

  modalOverlay: 'rgba(20, 5, 0, 0.82)',
  modalText:    '#ffd9a0',

  tileDefault: { bg: 'linear-gradient(135deg, #1a0500 0%, #000 100%)', fg: '#ffd070', glow: 'rgba(0, 0, 0, 0.5)' },
  tiles: {
    2:    { bg: 'linear-gradient(135deg, #5a2616 0%, #3e1408 100%)', fg: '#ffd9a0', glow: 'rgba(150, 50, 20, 0.55)' },
    4:    { bg: 'linear-gradient(135deg, #8b3920 0%, #5a1d0c 100%)', fg: '#ffe4b8', glow: 'rgba(180, 70, 30, 0.6)' },
    8:    { bg: 'linear-gradient(135deg, #c84a1f 0%, #8b2e0c 100%)', fg: '#fff5dc', glow: 'rgba(220, 90, 40, 0.65)' },
    16:   { bg: 'linear-gradient(135deg, #f56b1f 0%, #c44a0c 100%)', fg: '#ffffff', glow: 'rgba(245, 107, 31, 0.7)' },
    32:   { bg: 'linear-gradient(135deg, #ff8a1f 0%, #ed5a0c 100%)', fg: '#ffffff', glow: 'rgba(255, 138, 31, 0.75)' },
    64:   { bg: 'linear-gradient(135deg, #ffaa2a 0%, #ff7019 100%)', fg: '#ffffff', glow: 'rgba(255, 170, 42, 0.8)' },
    128:  { bg: 'linear-gradient(135deg, #ffc843 0%, #ff8a14 100%)', fg: '#ffffff', glow: 'rgba(255, 200, 67, 0.85)' },
    256:  { bg: 'linear-gradient(135deg, #ffe05a 0%, #ffa019 100%)', fg: '#ffffff', glow: 'rgba(255, 224, 90, 0.9)' },
    512:  { bg: 'linear-gradient(135deg, #fff09a 0%, #ffba2a 100%)', fg: '#5a1d0c', glow: 'rgba(255, 240, 154, 0.9)' },
    1024: { bg: 'linear-gradient(135deg, #ffffff 0%, #ffe89a 50%, #ff9a1c 100%)', fg: '#5a1d0c', glow: 'rgba(255, 240, 200, 0.95)' },
    2048: { bg: 'linear-gradient(135deg, #ffffff 0%, #aef2ff 30%, #fff09a 60%, #ff5722 100%)', fg: '#5a1d0c', glow: 'rgba(255, 200, 100, 1)' },
  },

  tileShadow: '0 4px 18px rgba(255, 90, 0, 0.4), inset 0 1px 0 rgba(255, 200, 100, 0.35)',
  particleColors: ['#ff5722', '#ffae3a', '#ffd070', '#ff8a1f', '#fff09a'],
  ambient: true,
};

// ─── Ice (Frost / Crystal) ───────────────────────────────────────────────────

export const ICE: Theme = {
  id: 'ice',
  name: 'Ice',
  tagline: 'Frozen blues and crystal shine.',

  pageBg: 'linear-gradient(180deg, #e8f4fb 0%, #c9e3f1 40%, #a3cee6 80%, #7eb6d6 100%)',
  pageAccent: 'radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.7) 0%, transparent 50%), radial-gradient(circle at 80% 82%, rgba(190, 220, 240, 0.55) 0%, transparent 55%)',
  boardBg: 'rgba(255, 255, 255, 0.4)',
  cellBg:  'rgba(255, 255, 255, 0.55)',
  boardShadow: '0 14px 40px rgba(70, 120, 170, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.7)',

  titleColor: '#1d3a5c',
  textColor:  '#2e5a82',
  subtleText: '#6080a3',

  buttonBg:      'linear-gradient(135deg, #a7d8f0 0%, #5fb3dc 50%, #2e89c9 100%)',
  buttonBgHover: 'linear-gradient(135deg, #b8e0f2 0%, #76bfde 50%, #3995d3 100%)',
  buttonFg:      '#ffffff',
  accent:        '#5fb3dc',

  scoreBoxBg:    'rgba(255, 255, 255, 0.55)',
  scoreBoxLabel: '#3a6890',
  scoreBoxValue: '#1d3a5c',

  modalOverlay: 'rgba(232, 244, 251, 0.78)',
  modalText:    '#1d3a5c',

  tileDefault: { bg: 'linear-gradient(135deg, #1d3a5c 0%, #0d1f3a 100%)', fg: '#ffffff', glow: 'rgba(29, 58, 92, 0.5)' },
  tiles: {
    2:    { bg: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)', fg: '#1d3a5c', glow: 'rgba(255, 255, 255, 0.75)' },
    4:    { bg: 'linear-gradient(135deg, #e8f4fb 0%, #d4e9f5 100%)', fg: '#1d3a5c', glow: 'rgba(212, 233, 245, 0.7)' },
    8:    { bg: 'linear-gradient(135deg, #c9e3f1 0%, #a7d8f0 100%)', fg: '#1d3a5c', glow: 'rgba(167, 216, 240, 0.7)' },
    16:   { bg: 'linear-gradient(135deg, #a3cee6 0%, #7eb6d6 100%)', fg: '#ffffff', glow: 'rgba(126, 182, 214, 0.75)' },
    32:   { bg: 'linear-gradient(135deg, #7eb6d6 0%, #5fa0c8 100%)', fg: '#ffffff', glow: 'rgba(95, 160, 200, 0.75)' },
    64:   { bg: 'linear-gradient(135deg, #5fb3dc 0%, #3995d3 100%)', fg: '#ffffff', glow: 'rgba(57, 149, 211, 0.8)' },
    128:  { bg: 'linear-gradient(135deg, #6dd5e6 0%, #2cb6cf 100%)', fg: '#ffffff', glow: 'rgba(44, 182, 207, 0.8)' },
    256:  { bg: 'linear-gradient(135deg, #82e6dc 0%, #2bbbb1 100%)', fg: '#ffffff', glow: 'rgba(43, 187, 177, 0.8)' },
    512:  { bg: 'linear-gradient(135deg, #b0e6f5 0%, #5acff1 100%)', fg: '#ffffff', glow: 'rgba(90, 207, 241, 0.85)' },
    1024: { bg: 'linear-gradient(135deg, #d0eff8 0%, #88c8e7 50%, #5b86c6 100%)', fg: '#ffffff', glow: 'rgba(136, 200, 231, 0.85)' },
    2048: { bg: 'linear-gradient(135deg, #ffffff 0%, #a8e6ff 40%, #6ec6ec 70%, #4a82d4 100%)', fg: '#1d3a5c', glow: 'rgba(168, 230, 255, 0.95)' },
  },

  tileShadow: '0 4px 14px rgba(70, 120, 170, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
  particleColors: ['#a7d8f0', '#5fb3dc', '#82e6dc', '#ffffff', '#6dd5e6'],
  ambient: true,
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const THEMES: Record<ThemeId, Theme> = {
  classic:   CLASSIC,
  aesthetic: AESTHETIC,
  ocean:     OCEAN,
  peach:     PEACH,
  fire:      FIRE,
  ice:       ICE,
};

export const THEME_LIST: Theme[] = [CLASSIC, AESTHETIC, OCEAN, PEACH, FIRE, ICE];

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
const VALID_IDS: readonly ThemeId[] = ['classic', 'aesthetic', 'ocean', 'peach', 'fire', 'ice'];
export const loadThemeId = (): ThemeId => {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw && (VALID_IDS as readonly string[]).includes(raw)) return raw as ThemeId;
  } catch { /* ignore */ }
  return 'classic';
};
export const saveThemeId = (id: ThemeId) => {
  try { localStorage.setItem(THEME_KEY, id); } catch { /* ignore */ }
};
