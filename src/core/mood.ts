// Signals → mascot state. Pure. Priority, highest first:
// alarmed > worried > thinking > sleepy > cozy > happy > idle.

import type { Severity } from './rules'

export type Mood = 'idle' | 'happy' | 'thinking' | 'worried' | 'alarmed' | 'sleepy' | 'cozy'

export const MOODS: readonly Mood[] = ['idle', 'happy', 'thinking', 'worried', 'alarmed', 'sleepy', 'cozy']

/** How long a warning or a positive signal colours the mood. */
export const MOOD_WINDOW_MS = 120_000
/** How long a headpat (/tokens pet or Pet button) keeps Lumi cozy. */
export const PET_WINDOW_MS = 30_000
/** Idle this long counts as sleepy even when the TTL is unknown. */
export const SLEEPY_AFTER_MS = 10 * 60_000

export type MoodInput = {
  now: number
  turnRunning: boolean
  lastHit?: { severity: Severity; at: number }
  /** Main context fill, 0..1; null when unknown. */
  ctxRatio: number | null
  contextWarn: number
  contextStrong: number
  lastPositiveAt?: number
  lastPetAt?: number
  lastRequestAt: number | null
  ttlMs: number
}

export function moodOf(i: MoodInput): Mood {
  const recent = (at: number | undefined, win = MOOD_WINDOW_MS) => at !== undefined && i.now - at >= 0 && i.now - at < win
  const hitRecent = i.lastHit !== undefined && recent(i.lastHit.at)

  if ((hitRecent && i.lastHit!.severity === 'strong') || (i.ctxRatio !== null && i.ctxRatio >= i.contextStrong)) return 'alarmed'
  if ((hitRecent && i.lastHit!.severity === 'warn') || (i.ctxRatio !== null && i.ctxRatio >= i.contextWarn)) return 'worried'
  if (i.turnRunning) return 'thinking'
  if (i.lastRequestAt !== null) {
    const idle = i.now - i.lastRequestAt
    if (idle >= Math.min(SLEEPY_AFTER_MS, Math.max(0, i.ttlMs - 60_000))) return 'sleepy'
  }
  if (recent(i.lastPetAt, PET_WINDOW_MS)) return 'cozy'
  if (recent(i.lastPositiveAt)) return 'happy'
  return 'idle'
}
