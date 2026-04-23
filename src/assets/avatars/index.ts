import amara from './avatar-amara.svg'
import david from './avatar-david.svg'
import elena from './avatar-elena.svg'
import kenji from './avatar-kenji.svg'
import luca from './avatar-luca.svg'
import marcus from './avatar-marcus.svg'
import mei from './avatar-mei.svg'
import nadia from './avatar-nadia.svg'
import omar from './avatar-omar.svg'
import priya from './avatar-priya.svg'
import samuel from './avatar-samuel.svg'
import sofia from './avatar-sofia.svg'

export const builtInAvatars: Record<string, string> = {
  amara, david, elena, kenji, luca, marcus, mei, nadia, omar, priya, samuel, sofia,
}

export const builtInAvatarIds = Object.keys(builtInAvatars)

/** Resolve a user-supplied value to a URL suitable for <img src>. */
export function resolveAvatarUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value in builtInAvatars) return builtInAvatars[value]
  return value
}
