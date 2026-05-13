/**
 * Board sizing is grid-size-aware so we can support 3×3, 4×4, and 5×5 boards
 * from the same components. All values are expressed as percentages of the
 * board's bounding box so the board scales fluidly with its CSS size.
 */

export type GridSize = 3 | 4 | 5;
export const GRID_SIZES: readonly GridSize[] = [3, 4, 5] as const;

// Board layout — fixed paddings/gaps
export const BOARD_PAD = 1.875; // padding around the grid
export const CELL_GAP  = 1.875; // gap between cells

/** Cell side length (%) for the given grid size. */
export function cellSize(gridSize: number): number {
  return (100 - 2 * BOARD_PAD - (gridSize - 1) * CELL_GAP) / gridSize;
}

/** Left/top offset (%) for the n-th cell along an axis. */
export function cellOffset(n: number, gridSize: number): number {
  return BOARD_PAD + n * (cellSize(gridSize) + CELL_GAP);
}

/**
 * Step ratio for transform-based tile positioning.
 * All tiles share left=BOARD_PAD%, top=BOARD_PAD% as base.
 * Then translate(col*STEP_RATIO%, row*STEP_RATIO%) places them correctly.
 * % in translate() is relative to the element itself, so:
 *   stepRatio = (cellSize + CELL_GAP) / cellSize * 100
 */
export function stepRatio(gridSize: number): number {
  const cs = cellSize(gridSize);
  return ((cs + CELL_GAP) / cs) * 100;
}

/**
 * Font size for a tile, scaled by grid size. The 4×4 board is the design
 * reference; on 3×3 the cells are larger so fonts grow, on 5×5 they shrink.
 */
export function tileFontSize(value: number, gridSize: number = 4): string {
  if (gridSize === 3) {
    if (value >= 1000) return 'clamp(22px, 5.0vw, 32px)';
    if (value >= 100)  return 'clamp(28px, 6.5vw, 42px)';
    if (value >= 10)   return 'clamp(34px, 8.0vw, 50px)';
    return 'clamp(40px, 10vw, 60px)';
  }
  if (gridSize === 5) {
    if (value >= 1000) return 'clamp(12px, 2.6vw, 17px)';
    if (value >= 100)  return 'clamp(15px, 3.4vw, 22px)';
    if (value >= 10)   return 'clamp(19px, 4.4vw, 28px)';
    return 'clamp(22px, 5.5vw, 34px)';
  }
  // 4×4 (default reference)
  if (value >= 1000) return 'clamp(16px, 3.5vw, 22px)';
  if (value >= 100)  return 'clamp(20px, 4.5vw, 28px)';
  if (value >= 10)   return 'clamp(24px, 5.5vw, 34px)';
  return 'clamp(28px, 7vw, 42px)';
}
