import bean from './avatar-bean.svg'
import owl from './avatar-owl.svg'
import elia from './avatar-elia.svg'
import bubble from './avatar-bubble.svg'
import orb from './avatar-orb.png'
import alan from './avatar-alan.svg'
import ben from './avatar-ben.svg'
import bianca from './avatar-bianca.svg'
import celeste from './avatar-celeste.svg'
import claire from './avatar-claire.svg'
import david from './avatar-david.svg'
import diana from './avatar-diana.svg'
import ella from './avatar-ella.svg'
import emma from './avatar-emma.svg'
import ethan from './avatar-ethan.svg'
import eva from './avatar-eva.svg'
import henry from './avatar-henry.svg'
import ian from './avatar-ian.svg'
import kevin from './avatar-kevin.svg'
import lena from './avatar-lena.svg'
import liam from './avatar-liam.svg'
import luke from './avatar-luke.svg'
import mason from './avatar-mason.svg'
import maya from './avatar-maya.svg'
import nathan from './avatar-nathan.svg'
import nora from './avatar-nora.svg'
import samuel from './avatar-samuel.svg'
import sofia from './avatar-sofia.svg'
import stella from './avatar-stella.svg'
import zoe from './avatar-zoe.svg'


export const builtInAvatars: Record<string, string> = {
  alan, ben, bianca, celeste, claire, david, diana, ella,
  emma, ethan, eva, henry, ian, kevin, lena, liam, luke,
  mason, maya, nathan, nora, samuel, sofia, stella, zoe, 
  bean, owl, elia, orb, bubble
}

export const builtInAvatarIds = Object.keys(builtInAvatars)

/** Returns the effective avatar key after resolving fallbacks.
 *  Unknown built-in IDs (e.g. a removed avatar) normalise to 'bubble'.
 *  External URLs are returned as-is. */
export function effectiveAvatarKey(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value in builtInAvatars) return value
  if (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:') || value.startsWith('./')) {
    return value
  }
  return 'bubble'
}

/** Resolve a user-supplied value to a URL suitable for <img src>.
 *  Unknown built-in IDs fall back to the 'bubble' icon. */
export function resolveAvatarUrl(value: string | undefined): string | undefined {
  const key = effectiveAvatarKey(value)
  if (!key) return undefined
  if (key in builtInAvatars) return builtInAvatars[key]
  return key
}
