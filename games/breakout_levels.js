// Breakout level layouts (1..200). Deterministic: same level number always gives the same shape.
// Used by both breakout.html and the private preview page.
// Characters: '.' = empty, '#' = normal brick, '1'..'9' = ORDERED brick (must be broken in number order: all 1s, then 2s, ...).
const BO_MAX_LEVEL = 200;
const BO_ROWCOL = ['#ef476f', '#f78c6b', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5', '#f15bb5', '#00bbf9'];

const BO_HAND = [
  ['##########', '##########'],                                                                                                                       // 1  rectangle (20 bricks)
  ['....##....', '...####...', '..######..', '.########.', '##########'],                                                                         // 2  pyramid
  ['##########', '.########.', '..######..', '...####...', '....##....'],                                                                         // 3  inverted pyramid
  ['....##....', '...####...', '..######..', '...####...', '....##....'],                                                                         // 4  diamond
  ['#.#.#.#.#.', '.#.#.#.#.#', '#.#.#.#.#.', '.#.#.#.#.#', '#.#.#.#.#.', '.#.#.#.#.#'],                                                       // 5  checkerboard
  ['##########', '..........', '##########', '..........', '##########', '..........', '##########'],                                           // 6  stripes
  ['..##..##..', '.########.', '.########.', '.########.', '..######..', '...####...', '....##....'],                                             // 7  heart
  ['..######..', '.########.', '.##.##.##.', '.########.', '.#.####.#.', '..#....#..', '...####...'],                                             // 8  smiley
  ['##......##', '.##....##.', '..##..##..', '...####...', '...####...', '..##..##..', '.##....##.', '##......##']                                      // 9  X
];

function boRng(seed) {   // mulberry32
  let a = seed | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function boLevel(n) {
  n = Math.max(1, Math.min(BO_MAX_LEVEL, n | 0));
  if (n <= 9) return BO_HAND[n - 1].slice();                              // levels 1-9: hand-made shapes, no ordered bricks

  const rnd = boRng(n * 7919 + 13);
  const boss = n % 10 === 0;                                              // every 10th level: big full-ish board
  const rows = boss ? 8 : Math.max(4, Math.min(8, 4 + Math.floor(n / 50) + (rnd() < 0.5 ? 1 : 0) + (rnd() < 0.3 ? 1 : 0)));
  const dens = boss ? 0.88 : 0.5 + 0.3 * (n / BO_MAX_LEVEL);

  let g = Array.from({ length: rows }, () => Array.from({ length: 5 }, () => (rnd() < dens ? 1 : 0)));
  // one smoothing pass so bricks form blobs instead of noise
  g = g.map((row, r) => row.map((v, c) => {
    const up = r > 0 ? g[r - 1][c] : 0, dn = r < rows - 1 ? g[r + 1][c] : 0, lf = c > 0 ? g[r][c - 1] : g[r][0], rt = c < 4 ? g[r][c + 1] : g[r][4];
    return v * 2 + up + dn + lf + rt >= 3 ? 1 : 0;
  }));
  let out = g.map(row => row.concat([...row].reverse()));                 // mirror left-right
  const count = () => out.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);
  let guard = 0;
  while (count() < 24 && guard++ < 200) { const r = Math.floor(rnd() * rows), c = Math.floor(rnd() * 5); out[r][c] = out[r][9 - c] = 1; }
  while (out.length > 1 && out[0].every(v => !v)) out.shift();            // drop empty rows at the top

  const grid = out.map(row => row.map(v => (v ? '#' : '.')));
  // ordered bricks: numbers 1..m (m grows with level), 1 brick each (2 each from level 100). Never adjacent to each other,
  // so an ordered brick can't be sealed in by locked bricks.
  const m = Math.min(9, 3 + Math.floor(n / 40)), per = n >= 100 ? 2 : 1;
  const nb = (r, c) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
  for (let num = 1; num <= m; num++) for (let k = 0; k < per; k++) {
    const cand = [];
    grid.forEach((row, r) => row.forEach((ch, c) => {
      if (ch === '#' && nb(r, c).every(([y, x]) => !(grid[y] && /[1-9]/.test(grid[y][x] || '')))) cand.push([r, c]);
    }));
    if (!cand.length) break;
    const [r, c] = cand[Math.floor(rnd() * cand.length)];
    grid[r][c] = String(num);
  }
  return grid.map(row => row.join(''));
}
