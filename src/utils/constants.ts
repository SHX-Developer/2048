export const GRID_SIZE = 4;

// Board layout — all values as percentage of board dimension
export const BOARD_PAD = 1.875;  // padding around the grid
export const CELL_GAP  = 1.875;  // gap between cells
export const CELL_SIZE = (100 - 2 * BOARD_PAD - (GRID_SIZE - 1) * CELL_GAP) / GRID_SIZE;
// = (100 - 3.75 - 5.625) / 4 = 22.65625 %

/** Left/top offset (%) for the n-th cell along an axis */
export function cellOffset(n: number): number {
  return BOARD_PAD + n * (CELL_SIZE + CELL_GAP);
}

// ─── Palette ────────────────────────────────────────────────────────────────

export const PAGE_BG  = '#faf8ef';
export const BOARD_BG = '#bbada0';
export const CELL_BG  = '#cdc1b4';

export const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
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
};

export const TILE_DEFAULT = { bg: '#3c3a32', fg: '#f9f6f2' };

export function tileFontSize(value: number): string {
  if (value >= 1000) return 'clamp(16px, 3.5vw, 22px)';
  if (value >= 100)  return 'clamp(20px, 4.5vw, 28px)';
  if (value >= 10)   return 'clamp(24px, 5.5vw, 34px)';
  return 'clamp(28px, 7vw, 42px)';
}
