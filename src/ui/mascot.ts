// "Lumi the Cyber-Lens Drone", lumi-lens's mascot: an ORIGINAL floating
// mechanical lens droid with glowing aperture optics, side stabilizer winglets,
// and anti-gravity ion hover thrusters.
//
// Frames are 16×16 pixel grids built in code from one aerodynamic hull and per-mood
// aperture overlays. They render three ways:
//   - terminal: a 16×8 Raster of half blocks (▀/▄), two pixels per cell,
//     animated by $.ui.blit (no re-render);
//   - desktop / vscode / mobile: one SVG whose frames step by SMIL;
//     everywhere: a text label (mood.* in i18n) beside it.
// Pure: no `$`.

import type { LensMood, LensTheme } from '../../types'

export const SIZE = 16
export const RASTER_COLUMNS = 16
export const RASTER_ROWS = 8

type Px = keyof typeof PALETTE
type Grid = (Px | null)[][]
export type PaletteMap = Record<Px, number>

/** Default mint-cyan aerospace palette (0x00RRGGBB). */
export const PALETTE = {
  o: 0x1e293b, // dark slate titanium outline
  b: 0x3cc6b4, // mint-cyan aero-hull plating
  l: 0xa8f0e4, // hull specular sheen & highlight
  w: 0xffffff, // optic laser glint & focus point
  p: 0x020617, // deep optic glass cavity
  c: 0xf28ba8, // holographic heart & telemetry
  g: 0x38bdf8, // glowing aperture iris reticle
  G: 0xc9971c, // amber diagnostic indicator
  r: 0xe5484d, // red alert hazard laser
  s: 0x7cc7ff, // ion thruster exhaust
  z: 0xe8e8f0, // standby telemetry phosphor
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
    g: 0xf7a1c4,
    G: 0xdb2777,
    s: 0xff5c8a,
  },
  lavender: {
    ...PALETTE,
    o: 0x3d2c6d,
    b: 0xb695f8,
    l: 0xeaddff,
    c: 0xf48fb1,
    g: 0xb695f8,
    G: 0x6366f1,
    s: 0xb695f8,
  },
  matcha: {
    ...PALETTE,
    o: 0x254d32,
    b: 0x7ed99a,
    l: 0xd4fae0,
    c: 0xf598b2,
    g: 0x7ed99a,
    G: 0x16a34a,
    s: 0x7ed99a,
  },
}

export type Sprite = { fps: number; frames: Grid[] }

// ── building blocks ─────────────────────────────────────────────────────

const empty = (): Grid => Array.from({ length: SIZE }, () => Array<Px | null>(SIZE).fill(null))

const set = (g: Grid, pts: readonly (readonly [number, number])[], px: Px | null) => {
  for (const [x, y] of pts) if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) g[y]![x] = px
}

function baseDrone(finMode: 'normal' | 'up' | 'down' = 'normal'): Grid {
  const g = empty()

  // Top optical sensor beacon
  set(g, [[7, 0], [8, 0]], 'w')
  set(g, [[7, 1], [8, 1]], 'o')
  set(g, [[6, 2], [7, 2], [8, 2], [9, 2]], 'o')

  // Main aero-chassis sphere
  for (let x = 4; x <= 11; x += 1) g[3]![x] = x === 4 || x === 11 ? 'o' : 'b'
  g[3]![6] = 'l'
  g[3]![7] = 'l'

  for (let x = 3; x <= 12; x += 1) g[4]![x] = x === 3 || x === 12 ? 'o' : 'b'
  g[4]![5] = 'l'
  g[4]![6] = 'l'

  for (let x = 2; x <= 13; x += 1) {
    if (x === 2 || x === 13) g[5]![x] = 'o'
    else if (x >= 5 && x <= 10) g[5]![x] = 'o'
    else g[5]![x] = 'b'
  }

  for (let y = 6; y <= 9; y += 1) {
    g[y]![2] = 'o'
    g[y]![3] = 'b'
    g[y]![4] = 'o'
    for (let x = 5; x <= 10; x += 1) g[y]![x] = 'p'
    g[y]![11] = 'o'
    g[y]![12] = 'b'
    g[y]![13] = 'o'
  }

  for (let x = 2; x <= 13; x += 1) {
    if (x === 2 || x === 13) g[10]![x] = 'o'
    else if (x >= 5 && x <= 10) g[10]![x] = 'o'
    else g[10]![x] = 'b'
  }

  for (let x = 3; x <= 12; x += 1) g[11]![x] = x === 3 || x === 12 ? 'o' : 'b'
  for (let x = 4; x <= 11; x += 1) g[12]![x] = 'o'

  if (finMode === 'normal') {
    set(g, [[1, 6], [0, 7], [1, 7], [0, 8], [1, 8]], 'o')
    g[7]![1] = 'b'
    g[8]![1] = 'l'
    set(g, [[14, 6], [14, 7], [15, 7], [14, 8], [15, 8]], 'o')
    g[7]![14] = 'b'
    g[8]![14] = 'l'
  } else if (finMode === 'up') {
    set(g, [[0, 5], [1, 5], [0, 6], [1, 6], [1, 7]], 'o')
    g[5]![1] = 'l'
    g[6]![1] = 'b'
    set(g, [[14, 5], [15, 5], [14, 6], [15, 6], [14, 7]], 'o')
    g[5]![14] = 'l'
    g[6]![14] = 'b'
  } else if (finMode === 'down') {
    set(g, [[1, 7], [0, 8], [1, 8], [0, 9], [1, 9]], 'o')
    g[8]![1] = 'b'
    g[9]![1] = 'l'
    set(g, [[14, 7], [14, 8], [15, 8], [14, 9], [15, 9]], 'o')
    g[8]![14] = 'b'
    g[9]![14] = 'l'
  }

  set(g, [[5, 13], [6, 13], [9, 13], [10, 13]], 'o')
  return g
}

function thrusters(g: Grid, power: 'normal' | 'boost' | 'dim' | 'flicker' = 'normal') {
  if (power === 'normal') {
    set(g, [[5, 14], [6, 14], [9, 14], [10, 14]], 's')
    set(g, [[5, 15], [10, 15]], 'w')
  } else if (power === 'boost') {
    set(g, [[5, 14], [6, 14], [9, 14], [10, 14]], 'w')
    set(g, [[4, 15], [5, 15], [6, 15], [9, 15], [10, 15], [11, 15]], 's')
  } else if (power === 'dim') {
    set(g, [[5, 14], [10, 14]], 's')
  } else if (power === 'flicker') {
    set(g, [[6, 14], [9, 14]], 's')
    set(g, [[6, 15]], 'w')
  }
}

function shift(g: Grid, dx: number): Grid {
  const out = empty()
  for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
    const nx = x + dx
    if (nx >= 0 && nx < SIZE) out[y]![nx] = g[y]![x]!
  }
  return out
}

function frame(finMode: 'normal' | 'up' | 'down', build: (g: Grid) => void): Grid {
  const g = baseDrone(finMode)
  build(g)
  return g
}

// ── the moods ──────────────────────────────────────────────────────────

export const SPRITES: Record<LensMood, Sprite> = {
  idle: {
    fps: 2,
    frames: [
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[6, 7], [9, 7]], 'w')
        set(g, [[7, 7], [8, 7], [6, 8], [7, 8], [8, 8], [9, 8]], 'g')
      }),
      frame('normal', g => {
        thrusters(g, 'flicker')
        set(g, [[6, 7], [9, 7]], 'w')
        set(g, [[7, 7], [8, 7], [6, 8], [7, 8], [8, 8], [9, 8]], 'g')
      }),
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[6, 7], [9, 7]], 'w')
        set(g, [[7, 7], [8, 7], [6, 8], [7, 8], [8, 8], [9, 8]], 'g')
      }),
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[6, 8], [7, 8], [8, 8], [9, 8]], 'g')
      }),
    ],
  },
  happy: {
    fps: 3,
    frames: [
      frame('up', g => {
        thrusters(g, 'boost')
        set(g, [[7, 6], [8, 6], [6, 7], [9, 7], [6, 8], [9, 8], [7, 9], [8, 9]], 'g')
        set(g, [[7, 7], [8, 7], [7, 8], [8, 8]], 'w')
      }),
      frame('up', g => {
        thrusters(g, 'normal')
        set(g, [[7, 6], [8, 6], [6, 7], [9, 7], [6, 8], [9, 8], [7, 9], [8, 9]], 'w')
        set(g, [[7, 7], [8, 7], [7, 8], [8, 8]], 'g')
      }),
    ],
  },
  thinking: {
    fps: 4,
    frames: [
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[5, 6], [5, 7], [5, 8], [5, 9]], 'g')
        set(g, [[7, 7], [8, 7]], 'w')
      }),
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[6, 6], [6, 7], [6, 8], [6, 9]], 'g')
        set(g, [[7, 7], [8, 7]], 'w')
      }),
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[9, 6], [9, 7], [9, 8], [9, 9]], 'g')
        set(g, [[7, 7], [8, 7]], 'w')
      }),
      frame('normal', g => {
        thrusters(g, 'normal')
        set(g, [[10, 6], [10, 7], [10, 8], [10, 9]], 'g')
        set(g, [[7, 7], [8, 7]], 'w')
      }),
    ],
  },
  worried: {
    fps: 3,
    frames: [
      frame('down', g => {
        thrusters(g, 'dim')
        set(g, [[6, 7], [7, 6], [8, 6], [9, 7], [6, 8], [9, 8], [7, 9], [8, 9]], 'G')
        set(g, [[7, 8], [8, 8]], 'g')
        set(g, [[14, 4], [14, 5]], 's')
      }),
      frame('down', g => {
        thrusters(g, 'flicker')
        set(g, [[6, 7], [7, 6], [8, 6], [9, 7], [6, 8], [9, 8], [7, 9], [8, 9]], 'g')
        set(g, [[7, 8], [8, 8]], 'G')
        set(g, [[14, 5], [14, 6]], 's')
      }),
    ],
  },
  alarmed: {
    fps: 6,
    frames: [
      frame('up', g => {
        thrusters(g, 'boost')
        set(g, [[7, 6], [8, 6]], 'r')
        set(g, [[6, 7], [7, 7], [8, 7], [9, 7]], 'r')
        set(g, [[5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8]], 'r')
        set(g, [[7, 7], [8, 7]], 'w')
        g[0]![7] = 'r'
        g[0]![8] = 'r'
      }),
      shift(frame('up', g => {
        thrusters(g, 'boost')
        set(g, [[7, 6], [8, 6]], 'r')
        set(g, [[6, 7], [7, 7], [8, 7], [9, 7]], 'r')
        set(g, [[5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8]], 'r')
        set(g, [[7, 7], [8, 7]], 'w')
        g[0]![7] = 'w'
        g[0]![8] = 'w'
      }), 1),
    ],
  },
  sleepy: {
    fps: 2,
    frames: [
      frame('down', g => {
        thrusters(g, 'dim')
        set(g, [[7, 8], [8, 8]], 'z')
        set(g, [[13, 3]], 'z')
      }),
      frame('down', g => {
        thrusters(g, 'dim')
        set(g, [[7, 8], [8, 8]], 'z')
        set(g, [[14, 2]], 'z')
      }),
      frame('down', g => {
        thrusters(g, 'dim')
        set(g, [[7, 8], [8, 8]], 'z')
        set(g, [[14, 0]], 'z')
      }),
    ],
  },
  cozy: {
    fps: 4,
    frames: [
      frame('up', g => {
        thrusters(g, 'normal')
        set(g, [[6, 7], [7, 7], [8, 7], [9, 7], [6, 8], [7, 8], [8, 8], [9, 8], [7, 9], [8, 9]], 'c')
        set(g, [[7, 7], [8, 7]], 'w')
        set(g, [[13, 4]], 'c')
      }),
      frame('up', g => {
        thrusters(g, 'boost')
        set(g, [[6, 6], [7, 6], [8, 6], [9, 6], [6, 7], [7, 7], [8, 7], [9, 7], [7, 8], [8, 8]], 'c')
        set(g, [[7, 6], [8, 6]], 'w')
        set(g, [[13, 2]], 'c')
      }),
      frame('up', g => {
        thrusters(g, 'normal')
        set(g, [[6, 7], [7, 7], [8, 7], [9, 7], [6, 8], [7, 8], [8, 8], [9, 8], [7, 9], [8, 9]], 'c')
        set(g, [[7, 7], [8, 7]], 'w')
        set(g, [[13, 0]], 'c')
      }),
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
