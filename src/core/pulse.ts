// Session pulse: context growth sparkline, prompt-cache savings, efficiency
// score, and cozy sticker rules. Pure.

import type { LensGrade, LensPulse, LensSticker, LensTotals } from '../../types'

const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const

/** Turns a sequence of 0..1 fill ratios into a compact Unicode sparkline. */
export function sparkline(ratios: readonly number[]): string {
  if (ratios.length === 0) return ''
  let out = ''
  for (const r of ratios) {
    const clamped = Number.isFinite(r) ? Math.min(1, Math.max(0, r)) : 0
    const idx = Math.min(BARS.length - 1, Math.floor(clamped * BARS.length))
    out += BARS[idx]!
  }
  return out
}

/**
 * Input-equivalent tokens saved by prompt-cache reads.
 * Cached reads cost 10% of standard input tokens, saving 90% of the read volume.
 */
export function savedByCache(cacheRead: number): number {
  const read = Number.isFinite(cacheRead) && cacheRead > 0 ? cacheRead : 0
  return Math.round(read * 0.9)
}

export function sessionHitRatio(main: LensTotals): number | null {
  const ctx = main.input + main.cacheRead + main.cacheCreation
  if (ctx <= 0) return null
  return main.cacheRead / ctx
}

export function gradeOf(score: number): LensGrade {
  if (score >= 88) return 'sparkling'
  if (score >= 72) return 'cozy'
  if (score >= 50) return 'steady'
  return 'warm'
}

export type ScoreInput = {
  requests: number
  hitRatio: number | null
  cleanStreak: number
  positives: number
  warnings: number
}

export function efficiencyScore(i: ScoreInput): { score: number; grade: LensGrade } {
  if (i.requests <= 0) return { score: 85, grade: 'cozy' }
  const cachePoints = i.hitRatio === null ? 45 : Math.round(i.hitRatio * 65)
  const habitPoints = Math.min(20, i.positives * 4)
  const streakPoints = Math.min(15, i.cleanStreak * 3)
  const penalty = i.warnings * 12
  const raw = cachePoints + habitPoints + streakPoints - penalty
  const score = Math.max(10, Math.min(100, raw))
  return { score, grade: gradeOf(score) }
}

export type StickerInput = {
  requests: number
  hitRatio: number | null
  lastHitRatio?: number | null
  targetedSearches: number
  smallEdits: number
  cleanStreak: number
  pets: number
}

type StickerRule = { id: LensSticker; unlocked: (s: StickerInput) => boolean }

const STICKER_RULES: readonly StickerRule[] = [
  {
    id: 'cache-whisperer',
    unlocked: s => s.requests >= 2 && ((s.hitRatio !== null && s.hitRatio >= 0.85) || (s.lastHitRatio !== undefined && s.lastHitRatio !== null && s.lastHitRatio >= 0.85)),
  },
  { id: 'sniper-search', unlocked: s => s.targetedSearches >= 2 },
  { id: 'tiny-stitch', unlocked: s => s.smallEdits >= 2 },
  { id: 'zero-waste', unlocked: s => s.cleanStreak >= 3 },
  { id: 'best-friend', unlocked: s => s.pets >= 1 },
]

export function computeStickers(s: StickerInput): LensSticker[] {
  return STICKER_RULES.filter(r => r.unlocked(s)).map(r => r.id)
}

export type PulseSource = {
  history: number[]
  peakCtx: number
  sessionMain: LensTotals
  lastHitRatio?: number | null
  lifetimeMain: LensTotals
  lifetimeSub: LensTotals
  cleanStreak: number
  targetedSearches: number
  smallEdits: number
  warnings: number
  pets: number
}

export function buildPulse(src: PulseSource): LensPulse {
  const hitRatio = sessionHitRatio(src.sessionMain)
  const effectiveHit = src.lastHitRatio !== undefined && src.lastHitRatio !== null
    ? Math.max(hitRatio ?? 0, src.lastHitRatio)
    : hitRatio
  const savedTokens = savedByCache(src.sessionMain.cacheRead)
  const { score, grade } = efficiencyScore({
    requests: src.sessionMain.requests,
    hitRatio: effectiveHit,
    cleanStreak: src.cleanStreak,
    positives: src.targetedSearches + src.smallEdits,
    warnings: src.warnings,
  })
  const stickers = computeStickers({
    requests: src.sessionMain.requests,
    hitRatio,
    lastHitRatio: src.lastHitRatio,
    targetedSearches: src.targetedSearches,
    smallEdits: src.smallEdits,
    cleanStreak: src.cleanStreak,
    pets: src.pets,
  })
  const lm = src.lifetimeMain
  const ls = src.lifetimeSub
  const lifeTotal =
    lm.input + lm.output + lm.cacheRead + lm.cacheCreation +
    ls.input + ls.output + ls.cacheRead + ls.cacheCreation
  const lifeSaved = savedByCache(lm.cacheRead + ls.cacheRead)
  return {
    history: [...src.history],
    peakCtx: src.peakCtx,
    savedTokens,
    sessionHitRatio: effectiveHit,
    score,
    grade,
    cleanStreak: src.cleanStreak,
    pets: src.pets,
    stickers,
    lifetime: {
      requests: lm.requests + ls.requests,
      totalTokens: lifeTotal,
      savedTokens: lifeSaved,
    },
  }
}
