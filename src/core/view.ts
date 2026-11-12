// Tracker → LensView, the plain JSON the pane and band draw from. Pure.

import type { LensLang, LensTheme, LensTip, LensView } from '../../types'
import { buildPulse } from './pulse'
import type { Tip } from './rules'
import type { Tracker } from './tracker'

const MAX_TOOLS = 12
const TOP_CALLS = 5

const tipOf = (t: Tip): LensTip => ({
  key: t.key, rule: t.rule, severity: t.severity, variant: t.variant, params: { ...t.params }, count: t.count,
})

export function buildView(tr: Tracker, lang: LensLang, now: number, theme: LensTheme = tr.cfg.theme): LensView {
  const agg = tr.ledger.aggregates()
  const life = tr.persisted()
  const tips = tr.tips.list()
  const lastMain = tr.lastMain
  const warning = tips.find(t => t.severity !== 'info')
  const pulse = buildPulse({
    history: tr.history.toArray(),
    peakCtx: tr.peakCtx,
    sessionMain: agg.totals.main,
    lastHitRatio: lastMain?.hitRatio,
    lifetimeMain: life.totals.main,
    lifetimeSub: life.totals.sub,
    cleanStreak: tr.cleanStreak,
    targetedSearches: tr.targetedSearches,
    smallEdits: tr.smallEdits,
    warnings: tr.warningHits,
    pets: tr.pets,
  })
  return {
    lang,
    theme,
    mood: tr.mood(now),
    ctx: tr.mainCtx,
    window: tr.windowTokens,
    windowKnown: tr.windowKnown,
    contextWarn: tr.cfg.thresholds.contextWarn,
    contextStrong: tr.cfg.thresholds.contextStrong,
    ttlKnown: tr.ttlKnown,
    ttlMinutes: Math.round(tr.ttlMs / 60_000),
    last: lastMain?.exact
      ? {
          input: lastMain.exact.input,
          output: lastMain.exact.output,
          cacheRead: lastMain.exact.cacheRead,
          cacheCreation: lastMain.exact.cacheCreation,
          hitRatio: lastMain.hitRatio,
        }
      : null,
    turn: tr.turn(),
    session: agg.totals,
    tools: tr.ledger.topTools().slice(0, MAX_TOOLS).map(({ tool, agg: a }) => ({ tool, calls: a.calls, estTokens: a.estTokens, errors: a.errors })),
    topCalls: tr.ledger.topCalls(TOP_CALLS).map(e => ({ tool: e.tool, label: e.label, estTokens: e.estTokens })),
    tips: tips.map(tipOf),
    lastWarning: warning ? tipOf(warning) : null,
    pulse,
    muted: tr.governor.muted,
    animate: tr.cfg.animation,
  }
}

/** A text bar of `width` cells for a 0..1 ratio: full cells, then empty ones. */
export function bar(ratio: number | null, width: number): string {
  const w = Math.max(4, Math.min(80, Math.floor(width)))
  if (ratio === null || !Number.isFinite(ratio)) return '░'.repeat(w)
  const full = Math.max(0, Math.min(w, Math.round(Math.min(1, Math.max(0, ratio)) * w)))
  return '█'.repeat(full) + '░'.repeat(w - full)
}
