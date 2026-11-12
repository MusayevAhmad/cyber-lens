// token-lens state contract: what the pane and band read through $.state.
// Plain JSON. It holds numbers, tool names and file basenames only: never
// arguments, output, prompts or full paths.

export type LensLang = 'en' | 'az'
export type LensMood = 'idle' | 'happy' | 'thinking' | 'worried' | 'alarmed' | 'sleepy' | 'cozy'
export type LensTheme = 'teal' | 'sakura' | 'lavender' | 'matcha'
export type LensSeverity = 'info' | 'warn' | 'strong'
export type LensTab = 'live' | 'tools' | 'tips' | 'pulse'
export type LensSticker = 'cache-whisperer' | 'sniper-search' | 'tiny-stitch' | 'zero-waste' | 'best-friend'
export type LensGrade = 'sparkling' | 'cozy' | 'steady' | 'warm'

export type LensTotals = { requests: number; input: number; output: number; cacheRead: number; cacheCreation: number }

export type LensTip = {
  key: string
  rule: string
  severity: LensSeverity
  variant?: string
  params: Record<string, string | number>
  count: number
}

export type LensPulse = {
  /** Recent main-context fill ratios (0..1), oldest to newest, up to 16 steps. */
  history: number[]
  /** Peak main context tokens seen this session. */
  peakCtx: number
  /** Net tokens saved by prompt-cache reads vs fresh input (90% of cacheRead). */
  savedTokens: number
  /** Session-wide cache reuse ratio (0..1), or null before any request. */
  sessionHitRatio: number | null
  /** Cozy efficiency score (0..100) from cache reuse, positive habits, and warnings. */
  score: number
  /** Grade key for the score. */
  grade: LensGrade
  /** Consecutive main requests without a warn/strong rule hit. */
  cleanStreak: number
  /** Headpats given to Lumi (session + persisted). */
  pets: number
  /** Unlocked cozy stickers. */
  stickers: LensSticker[]
  /** All-time totals across sessions (persisted in aggregates-v1). */
  lifetime: { requests: number; totalTokens: number; savedTokens: number }
}

export type LensView = {
  lang: LensLang
  theme: LensTheme
  mood: LensMood
  /** Main context in tokens (exact, from the last request); null before one. */
  ctx: number | null
  window: number
  windowKnown: boolean
  /** Context fill ratios that mean warning / strong warning. */
  contextWarn: number
  contextStrong: number
  ttlKnown: boolean
  /** Prompt-cache TTL in minutes (5 assumed unless ttlKnown). */
  ttlMinutes: number
  /** The last main request, exact as the API reported it. */
  last: { input: number; output: number; cacheRead: number; cacheCreation: number; hitRatio: number | null } | null
  /** Exact tokens (context + output) of the running or last turn, by loop. */
  turn: { main: number; sub: number; isRunning: boolean }
  session: { main: LensTotals; sub: LensTotals }
  /** Estimated tokens per tool kind (~). */
  tools: { tool: string; calls: number; estTokens: number; errors: number }[]
  /** Costliest single calls (~): tool kind and basename only. */
  topCalls: { tool: string; label?: string; estTokens: number }[]
  tips: LensTip[]
  lastWarning: LensTip | null
  pulse: LensPulse
  muted: boolean
  /** Whether the mascot animates (the `animation` option). */
  animate: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'token-lens': {
      view: Shaped<LensView | null>
      tab: LensTab
    }
  }
}
