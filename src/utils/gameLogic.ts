import { GRID_SIZE } from './constants';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TileData {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;      // triggers spawn animation
  isMerged: boolean;   // triggers pop animation
  isAbsorbed: boolean; // moves to merge target then gets removed
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MoveResult {
  tiles: TileData[];
  scoreGain: number;
  moved: boolean;
}

// ─── ID counter ─────────────────────────────────────────────────────────────

let _id = 0;
function nextId() { return ++_id; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyPositions(tiles: TileData[]): [number, number][] {
  const occupied = new Set(
    tiles.filter(t => !t.isAbsorbed).map(t => `${t.row},${t.col}`)
  );
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (!occupied.has(`${r},${c}`)) empty.push([r, c]);
  return empty;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function createInitialTiles(): TileData[] {
  let t: TileData[] = [];
  t = addRandomTile(t);
  t = addRandomTile(t);
  return t;
}

export function addRandomTile(tiles: TileData[]): TileData[] {
  const empty = emptyPositions(tiles);
  if (!empty.length) return tiles;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  return [
    ...tiles,
    { id: nextId(), value: Math.random() < 0.9 ? 2 : 4, row, col, isNew: true, isMerged: false, isAbsorbed: false },
  ];
}

export function moveTiles(tiles: TileData[], direction: Direction): MoveResult {
  const active = tiles.filter(t => !t.isAbsorbed);

  // Build 2-D grid
  const grid: (TileData | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  for (const tile of active) {
    grid[tile.row][tile.col] = { ...tile, isNew: false, isMerged: false };
  }

  let scoreGain = 0;
  let moved = false;
  const result: TileData[] = [];

  const processLine = (line: (TileData | null)[], reversed: boolean) => {
    const filtered = line.filter(Boolean) as TileData[];
    if (reversed) filtered.reverse();
    return slideAndMerge(filtered);
  };

  if (direction === 'left' || direction === 'right') {
    const rev = direction === 'right';
    for (let r = 0; r < GRID_SIZE; r++) {
      const { slid, gain, absorbed } = processLine(grid[r], rev);
      scoreGain += gain;
      slid.forEach((tile, i) => {
        const newCol = rev ? GRID_SIZE - 1 - i : i;
        if (tile.row !== r || tile.col !== newCol) moved = true;
        result.push({ ...tile, row: r, col: newCol });
      });
      absorbed.forEach(({ tile, targetIdx }) => {
        const targetCol = rev ? GRID_SIZE - 1 - targetIdx : targetIdx;
        result.push({ ...tile, row: r, col: targetCol, isAbsorbed: true });
      });
    }
  } else {
    const rev = direction === 'down';
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = grid.map(row => row[c]);
      const { slid, gain, absorbed } = processLine(col, rev);
      scoreGain += gain;
      slid.forEach((tile, i) => {
        const newRow = rev ? GRID_SIZE - 1 - i : i;
        if (tile.row !== newRow || tile.col !== c) moved = true;
        result.push({ ...tile, row: newRow, col: c });
      });
      absorbed.forEach(({ tile, targetIdx }) => {
        const targetRow = rev ? GRID_SIZE - 1 - targetIdx : targetIdx;
        result.push({ ...tile, row: targetRow, col: c, isAbsorbed: true });
      });
    }
  }

  // A merge (scoreGain > 0) always changes the board even if no tile moved positions
  return { tiles: result, scoreGain, moved: moved || scoreGain > 0 };
}

export function hasMovesAvailable(tiles: TileData[]): boolean {
  const active = tiles.filter(t => !t.isAbsorbed);
  if (active.length < GRID_SIZE * GRID_SIZE) return true; // empty cells exist

  const grid: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(0)
  );
  for (const t of active) grid[t.row][t.col] = t.value;

  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) {
      if (r + 1 < GRID_SIZE && grid[r + 1][c] === grid[r][c]) return true;
      if (c + 1 < GRID_SIZE && grid[r][c + 1] === grid[r][c]) return true;
    }
  return false;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function slideAndMerge(row: TileData[]): {
  slid: TileData[];
  gain: number;
  absorbed: { tile: TileData; targetIdx: number }[];
} {
  const slid: TileData[] = [];
  const absorbed: { tile: TileData; targetIdx: number }[] = [];
  let gain = 0;
  let i = 0;

  while (i < row.length) {
    if (i + 1 < row.length && row[i].value === row[i + 1].value) {
      slid.push({ ...row[i], value: row[i].value * 2, isMerged: true });
      absorbed.push({ tile: row[i + 1], targetIdx: slid.length - 1 });
      gain += row[i].value * 2;
      i += 2;
    } else {
      slid.push({ ...row[i] });
      i++;
    }
  }

  return { slid, gain, absorbed };
}
