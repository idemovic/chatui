import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChatConfig } from '../types/index.ts'

function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.08)
    osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.16)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Audio not available
  }
}

export function useCta(config: ChatConfig, language: string) {
  const [showCta, setShowCta] = useState(false)
  const shownRef = useRef(false)

  const isWindow = config.mode === 'window'
  const shouldShow = isWindow && (config.showCta ?? true)
  const delay = config.ctaDelay ?? 5000
  const sound = config.ctaSound ?? true

  // Resolve CTA text: per-language override → global fallback
  const ctaText =
    config.i18n?.[language]?.ctaText ??
    config.i18n?.['en']?.ctaText ??
    config.ctaText ??
    'Hi! How can I help you today?'

  const dismiss = useCallback(() => setShowCta(false), [])

  useEffect(() => {
    if (!shouldShow || shownRef.current) return

    const timer = setTimeout(() => {
      shownRef.current = true
      setShowCta(true)
      if (sound) playNotificationSound()
    }, delay)

    return () => clearTimeout(timer)
  }, [shouldShow, delay, sound])

  return { showCta, ctaText, dismiss }
}
