export const GRID_SIZE = 15;

// Maximum random placement attempts per word before giving up
const MAX_PLACEMENT_ATTEMPTS = 200;

const WORD_LIST = [
  'GATO',
  'PERRO',
  'CASA',
  'AGUA',
  'LUNA',
  'SOL',
  'LIBRO',
  'MESA',
  'FLOR',
  'ARBOL',
  'CIELO',
  'PLAYA',
  'MONTE',
  'NUBE',
  'PATO',
  'RIO',
  'MAR',
  'ISLA',
  'CIUDAD',
  'VIENTO',
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickWords(count: number): string[] {
  return shuffle(WORD_LIST).slice(0, count);
}

type Direction = {
  dr: number;
  dc: number;
};

const DIRECTIONS: Direction[] = [
  { dr: 0, dc: 1 },   // →
  { dr: 0, dc: -1 },  // ←
  { dr: 1, dc: 0 },   // ↓
  { dr: -1, dc: 0 },  // ↑
  { dr: 1, dc: 1 },   // ↘
];

function canPlace(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: Direction,
  size: number,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + i * dir.dr;
    const c = col + i * dir.dc;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
  }
  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  row: number,
  col: number,
  dir: Direction,
): void {
  for (let i = 0; i < word.length; i++) {
    grid[row + i * dir.dr][col + i * dir.dc] = word[i];
  }
}

export function generateGrid(words: string[], size: number = GRID_SIZE): string[][] {
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill(''),
  );

  for (const word of words) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < MAX_PLACEMENT_ATTEMPTS) {
      attempts++;
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (canPlace(grid, word, row, col, dir, size)) {
        placeWord(grid, word, row, col, dir);
        placed = true;
      }
    }
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return grid;
}
