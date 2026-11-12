// Text faces for the mascot: the band's compact form and the fallback where
// no sprite can be drawn. Each mood also has a word (mood.* in i18n), so
// neither color nor shape is ever the only signal.

import type { LensMood } from '../../types'

export const FACE: Record<LensMood, string> = {
  idle: '(=^･ω･^=)',
  happy: '(=^‿^=)✧',
  thinking: '(•ﻌ•)?',
  worried: '(•︵•;)',
  alarmed: '(°□°;)!',
  sleepy: '(=-ω-=)z',
  cozy: '( ˘ ◡ ˘ )♡',
}
