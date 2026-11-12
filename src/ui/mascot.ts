// "Lumi the Star-Puff", lumi-lens's mascot: an ORIGINAL fluffy celestial character.
// A chubby cloud kitten with soft ears, little paws, rosy cheeks, and a floating
// lucky star that twinkles and pulses with your session's token telemetry.
//
// Frames are 16×16 pixel grids built in code from one fluffy body and per-mood face
// overlays. They render three ways:
//   - terminal: a 16×8 Raster of half blocks (▀/▄), two pixels per cell,
//     animated by $.ui.blit (no re-render);
//   - desktop / vscode / mobile: one SVG whose frames step by SMIL;
//   - everywhere: a text label (mood.* in i18n) beside it.
// Pure: no `$`.

import type { LensMood, LensTheme } from '../../types'

export const SIZE = 16
export const RASTER_COLUMNS = 16
export const RASTER_ROWS = 8

type Px = keyof typeof PALETTE
type Grid = (Px | null)[][]
export type PaletteMap = Record<Px, number>

/** Default minty celestial palette (0x00RRGGBB). */
export const PALETTE = {
  o: 0x1e4d57, // dark teal outline
  b: 0x3cc6b4, // fluffy body
  l: 0xa8f0e4, // soft highlight
  w: 0xffffff, // eye sparkle & star core
  p: 0x1b1b2f, // eyes, pupils, mouth
  c: 0xf28ba8, // inner ears, cheeks & floating heart
  g: 0xf5c542, // lucky star
  G: 0xc9971c, // warm gold / dim star
  r: 0xe5484d, // alert star
  s: 0x7cc7ff, // sweat drop
  z: 0xe8e8f0, // sleep bubbles
} as const

/** Fluffy coat palettes: teal (mint), sakura (pink), lavender (lilac), matcha (green). */
export const THEME_PALETTES: Record<LensTheme, PaletteMap> = {
  teal: { ...PALETTE },
  sakura: {
    ...PALETTE,
    o: 0x6e2b4b,
    b: 0xf7a1c4,
    l: 0xffe0ee,
    c: 0xff5c8a,
  },
  lavender: {
    ...PALETTE,
    o: 0x3d2c6d,
    b: 0xb695f8,
    l: 0xeaddff,
    c: 0xf48fb1,
  },
  matcha: {
    ...PALETTE,
    o: 0x254d32,
    b: 0x7ed99a,
    l: 0xd4fae0,
    c: 0xf598b2,
  },
}

export type Sprite = { fps: number; frames: Grid[] }

// ── building blocks ─────────────────────────────────────────────────────

const empty = (): Grid => Array.from({ length: SIZE }, () => Array<Px | null>(SIZE).fill(null))

const set = (g: Grid, pts: readonly (readonly [number, number])[], px: Px | null) => {
  for (const [x, y] of pts) if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) g[y]![x] = px
}

function baseBody(earStyle: 'normal' | 'droop' | 'perked' = 'normal'): Grid {
  const g = empty()
  // Cute fluffy ears
  if (earStyle === 'normal') {
    set(g, [[3, 2], [4, 2], [2, 3], [5, 3], [2, 4], [5, 4]], 'o')
    set(g, [[3, 3], [4, 3], [3, 4], [4, 4]], 'c')
    set(g, [[11, 2], [12, 2], [10, 3], [13, 3], [10, 4], [13, 4]], 'o')
    set(g, [[11, 3], [12, 3], [11, 4], [12, 4]], 'c')
  } else if (earStyle === 'droop') {
    set(g, [[2, 3], [3, 3], [1, 4], [4, 4], [1, 5], [4, 5]], 'o')
    set(g, [[2, 4], [3, 4], [2, 5], [3, 5]], 'c')
    set(g, [[12, 3], [13, 3], [11, 4], [14, 4], [11, 5], [14, 5]], 'o')
    set(g, [[12, 4], [13, 4], [12, 5], [13, 5]], 'c')
  } else if (earStyle === 'perked') {
    set(g, [[3, 1], [4, 1], [2, 2], [5, 2], [2, 3], [5, 3], [2, 4], [5, 4]], 'o')
    set(g, [[3, 2], [4, 2], [3, 3], [4, 3]], 'c')
    set(g, [[11, 1], [12, 1], [10, 2], [13, 2], [10, 3], [13, 3], [10, 4], [13, 4]], 'o')
    set(g, [[11, 2], [12, 2], [11, 3], [12, 3]], 'c')
  }

  // Fluffy marshmallow head and chubby body
  const spans = [
    [5, 2, 13],
    [6, 1, 14],
    [7, 1, 14],
    [8, 0, 15],
    [9, 0, 15],
    [10, 0, 15],
    [11, 1, 14],
    [12, 1, 14],
    [13, 2, 13],
    [14, 3, 12],
  ] as const

  for (const [y, x0, x1] of spans) {
    for (let x = x0; x <= x1; x += 1) {
      const isEdge = x === x0 || x === x1 || y === 14 || (y === 5 && x >= 6 && x <= 9)
      g[y]![x] = isEdge ? 'o' : 'b'
    }
  }

  // Little cute front paws resting at the bottom
  for (let x = 4; x <= 6; x += 1) g[15]![x] = 'o'
  for (let x = 9; x <= 11; x += 1) g[15]![x] = 'o'
  g[14]![5] = 'b'
  g[14]![10] = 'b'

  // Soft forehead shine
  g[6]![7] = 'l'
  g[6]![8] = 'l'
  return g
}

/** Floating celestial lucky star. */
function star(g: Grid, kind: 'full' | 'red' | 'dim' | 'heart' = 'full', drop = 0) {
  const c: Px = kind === 'red' ? 'r' : kind === 'dim' ? 'G' : kind === 'heart' ? 'c' : 'g'
  const core: Px = kind === 'dim' ? 'G' : kind === 'red' ? 'r' : kind === 'heart' ? 'l' : 'w'
  set(g, [[7, 0 + drop], [8, 0 + drop]], c)
  set(g, [[6, 1 + drop], [9, 1 + drop]], c)
  set(g, [[7, 1 + drop], [8, 1 + drop]], core)
  set(g, [[7, 2 + drop], [8, 2 + drop]], c)
}

const eyesOpen = (g: Grid, look: 'fwd' | 'upL' | 'upR' | 'wide') => {
  if (look === 'wide') {
    set(g, [[3, 8], [4, 8], [5, 8], [3, 9], [4, 9], [5, 9]], 'w')
    set(g, [[4, 9]], 'p')
    set(g, [[10, 8], [11, 8], [12, 8], [10, 9], [11, 9], [12, 9]], 'w')
    set(g, [[11, 9]], 'p')
  } else if (look === 'upL') {
    set(g, [[4, 8], [5, 8], [4, 9], [5, 9], [10, 8], [11, 8], [10, 9], [11, 9]], 'p')
    set(g, [[4, 8], [10, 8]], 'w')
  } else if (look === 'upR') {
    set(g, [[4, 8], [5, 8], [4, 9], [5, 9], [10, 8], [11, 8], [10, 9], [11, 9]], 'p')
    set(g, [[5, 8], [11, 8]], 'w')
  } else {
    set(g, [[4, 8], [5, 8], [4, 9], [5, 9], [10, 8], [11, 8], [10, 9], [11, 9]], 'p')
    set(g, [[4, 8], [10, 8]], 'w')
  }
}

const eyesBlink = (g: Grid) => set(g, [[4, 9], [5, 9], [10, 9], [11, 9]], 'p')
const eyesHappy = (g: Grid) => set(g, [[4, 8], [5, 8], [3, 9], [6, 9], [10, 8], [11, 8], [9, 9], [12, 9]], 'p')
const eyesAsleep = (g: Grid) => set(g, [[3, 9], [4, 10], [5, 10], [6, 9], [9, 9], [10, 10], [11, 10], [12, 9]], 'p')
const browsWorried = (g: Grid) => set(g, [[4, 7], [5, 7], [6, 6], [11, 7], [10, 7], [9, 6]], 'p')

const mouthSmile = (g: Grid) => set(g, [[7, 11], [8, 11], [6, 12], [9, 12]], 'p')
const mouthGrin = (g: Grid) => {
  set(g, [[6, 11], [7, 11], [8, 11], [9, 11], [6, 12], [9, 12]], 'p')
  set(g, [[7, 12], [8, 12]], 'c')
}
const mouthHmm = (g: Grid) => set(g, [[8, 12], [9, 12]], 'p')
const mouthFrown = (g: Grid) => set(g, [[6, 12], [7, 11], [8, 11], [9, 12]], 'p')
const mouthOpen = (g: Grid) => set(g, [[7, 11], [8, 11], [7, 12], [8, 12]], 'p')
const mouthSnore = (g: Grid) => set(g, [[8, 12]], 'p')

const cheeks = (g: Grid) => set(g, [[2, 10], [3, 10], [12, 10], [13, 10]], 'c')
const fluffyCheeks = (g: Grid) => set(g, [[1, 10], [2, 10], [3, 10], [12, 10], [13, 10], [14, 10]], 'c')
const heart = (g: Grid, x: number, y: number) => set(g, [[x, y], [x + 2, y], [x, y + 1], [x + 1, y + 1], [x + 2, y + 1], [x + 1, y + 2]], 'c')

function shift(g: Grid, dx: number): Grid {
  const out = empty()
  for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
    const nx = x + dx
    if (nx >= 0 && nx < SIZE) out[y]![nx] = g[y]![x]!
  }
  return out
}

function frame(earStyle: 'normal' | 'droop' | 'perked', build: (g: Grid) => void): Grid {
  const g = baseBody(earStyle)
  build(g)
  return g
}

// ── the moods ──────────────────────────────────────────────────────────

export const SPRITES: Record<LensMood, Sprite> = {
  idle: {
    fps: 2,
    frames: [
      frame('normal', g => { star(g, 'full'); eyesOpen(g, 'fwd'); mouthSmile(g); cheeks(g) }),
      frame('normal', g => { star(g, 'full'); eyesOpen(g, 'fwd'); mouthSmile(g); cheeks(g) }),
      frame('normal', g => { star(g, 'full'); eyesOpen(g, 'fwd'); mouthSmile(g); cheeks(g) }),
      frame('normal', g => { star(g, 'full'); eyesBlink(g); mouthSmile(g); cheeks(g) }),
    ],
  },
  happy: {
    fps: 3,
    frames: [
      frame('normal', g => { star(g, 'full'); eyesHappy(g); mouthGrin(g); fluffyCheeks(g) }),
      frame('normal', g => { star(g, 'full', 1); eyesHappy(g); mouthGrin(g); fluffyCheeks(g) }),
    ],
  },
  thinking: {
    fps: 4,
    frames: [
      frame('normal', g => { star(g, 'full'); eyesOpen(g, 'upL'); mouthHmm(g); cheeks(g) }),
      frame('normal', g => { star(g, 'dim'); eyesOpen(g, 'upL'); mouthHmm(g); cheeks(g) }),
      frame('normal', g => { star(g, 'full'); eyesOpen(g, 'upR'); mouthHmm(g); cheeks(g) }),
      frame('normal', g => { star(g, 'dim'); eyesOpen(g, 'upR'); mouthHmm(g); cheeks(g) }),
    ],
  },
  worried: {
    fps: 3,
    frames: [
      frame('droop', g => { star(g, 'full'); eyesOpen(g, 'fwd'); browsWorried(g); mouthFrown(g); set(g, [[14, 6], [14, 7]], 's') }),
      frame('droop', g => { star(g, 'full'); eyesOpen(g, 'fwd'); browsWorried(g); mouthFrown(g); set(g, [[14, 7], [14, 8]], 's') }),
    ],
  },
  alarmed: {
    fps: 6,
    frames: [
      frame('perked', g => { star(g, 'red'); eyesOpen(g, 'wide'); mouthOpen(g) }),
      shift(frame('perked', g => { star(g, 'full'); eyesOpen(g, 'wide'); mouthOpen(g) }), 1),
    ],
  },
  sleepy: {
    fps: 2,
    frames: [
      frame('droop', g => { star(g, 'dim'); eyesAsleep(g); mouthSnore(g); set(g, [[12, 4]], 'z') }),
      frame('droop', g => { star(g, 'dim'); eyesAsleep(g); mouthSnore(g); set(g, [[13, 2]], 'z') }),
      frame('droop', g => { star(g, 'dim'); eyesAsleep(g); mouthSnore(g); set(g, [[14, 0]], 'z') }),
    ],
  },
  cozy: {
    fps: 4,
    frames: [
      frame('normal', g => { star(g, 'heart'); eyesHappy(g); mouthSmile(g); fluffyCheeks(g); heart(g, 13, 4) }),
      frame('normal', g => { star(g, 'heart', 1); eyesHappy(g); mouthGrin(g); fluffyCheeks(g); heart(g, 13, 2) }),
      frame('normal', g => { star(g, 'heart'); eyesHappy(g); mouthSmile(g); fluffyCheeks(g); heart(g, 13, 0) }),
    ],
  },
}

// ── terminal: half-block Raster cells ──────────────────────────────────

const DEFAULT_COLOR = 0x01000000
const UPPER = 0x2580 // ▀
const LOWER = 0x2584 // ▄
const SPACE = 0x20
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Standard padded base64 (no reliance on host helpers). */
export function base64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!
    const b = i + 1 < bytes.length ? bytes[i + 1]! : 0
    const c = i + 2 < bytes.length ? bytes[i + 2]! : 0
    const n = (a << 16) | (b << 8) | c
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63]! : '='
    out += i + 2 < bytes.length ? B64[n & 63]! : '='
  }
  return out
}

/** 16×16 Grid → 16×8 Raster cells, each cell a half-block or space. */
export function rasterCells(g: Grid, theme: LensTheme = 'teal'): string {
  const pal = THEME_PALETTES[theme] ?? PALETTE
  const words = new Uint32Array(RASTER_COLUMNS * RASTER_ROWS * 3)
  let i = 0
  for (let row = 0; row < RASTER_ROWS; row += 1) {
    const yTop = row * 2
    const yBottom = yTop + 1
    for (let col = 0; col < RASTER_COLUMNS; col += 1) {
      const top = g[yTop]![col]
      const bottom = g[yBottom]![col]
      let cp = SPACE
      let fg = DEFAULT_COLOR
      let bg = DEFAULT_COLOR
      if (top && bottom) {
        if (top === bottom) {
          cp = SPACE
          bg = pal[top]
        } else {
          cp = UPPER
          fg = pal[top]
          bg = pal[bottom]
        }
      } else if (top) {
        cp = UPPER
        fg = pal[top]
      } else if (bottom) {
        cp = LOWER
        fg = pal[bottom]
      }
      words[i++] = cp
      words[i++] = fg
      words[i++] = bg
    }
  }
  const bytes = new Uint8Array(words.length * 4)
  for (let k = 0; k < words.length; k += 1) {
    const w = words[k]!
    bytes[k * 4] = w & 0xff
    bytes[k * 4 + 1] = (w >>> 8) & 0xff
    bytes[k * 4 + 2] = (w >>> 16) & 0xff
    bytes[k * 4 + 3] = (w >>> 24) & 0xff
  }
  return base64(bytes)
}

/** Every frame of every mood in every theme, encoded once at load. */
export const RASTERS_BY_THEME: Record<LensTheme, Record<LensMood, string[]>> = Object.fromEntries(
  (Object.keys(THEME_PALETTES) as LensTheme[]).map(theme => [
    theme,
    Object.fromEntries((Object.keys(SPRITES) as LensMood[]).map(m => [m, SPRITES[m].frames.map(f => rasterCells(f, theme))])) as Record<LensMood, string[]>,
  ]),
) as Record<LensTheme, Record<LensMood, string[]>>

/** Default teal rasters (backward-compatible export). */
export const RASTERS: Record<LensMood, string[]> = RASTERS_BY_THEME.teal

/** Which frame a free-running 8-ticks-per-second clock is on for a mood. */
export function frameAt(mood: LensMood, tick: number): number {
  const s = SPRITES[mood]
  return Math.floor((tick * s.fps) / 8) % s.frames.length
}

export const ANIMATION_TICK_MS = 125 // 8 ticks a second: no mood runs faster

// ── desktop / vscode / mobile: SVG with SMIL frames ────────────────────

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`

function frameRects(g: Grid, pal: PaletteMap): string {
  let out = ''
  for (let y = 0; y < SIZE; y += 1) {
    let x = 0
    while (x < SIZE) {
      const px = g[y]![x]
      if (!px) {
        x += 1
        continue
      }
      let w = 1
      while (x + w < SIZE && g[y]![x + w] === px) w += 1
      out += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${hex(pal[px])}"/>`
      x += w
    }
  }
  return out
}

/** The mood's sprite as one SVG; frames step by SMIL unless `animate` is false. */
export function mascotSvg(mood: LensMood, animate = true, theme: LensTheme = 'teal'): string {
  const pal = THEME_PALETTES[theme] ?? PALETTE
  const s = SPRITES[mood]
  const n = animate ? s.frames.length : 1
  const dur = (s.frames.length / s.fps).toFixed(3)
  const keyTimes = Array.from({ length: n }, (_, i) => (i / n).toFixed(4)).join(';')
  let groups = ''
  for (let i = 0; i < n; i += 1) {
    const values = Array.from({ length: n }, (_, k) => (k === i ? '1' : '0')).join(';')
    const anim = n > 1
      ? `<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>`
      : ''
    groups += `<g opacity="${i === 0 ? 1 : 0}">${anim}${frameRects(s.frames[i]!, pal)}</g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="64" height="64" shape-rendering="crispEdges">${groups}</svg>`
}
