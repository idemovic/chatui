import type { ThemeDef } from './types/index.ts'

export const themes: ThemeDef[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    baseColor: '#0f1117',
    accentColor: '#6366f1'
  },
  {
    id: 'ivory',
    label: 'Ivory',
    baseColor: '#ffffff',
    accentColor: '#4338ca'
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    baseColor: '#ffffff',
    accentColor: '#f97316'
  },
  {
    id: 'cosmos',
    label: 'Cosmos',
    baseColor: '#0d0a1a',
    accentColor: '#a855f7'
  },
  {
    id: 'forest',
    label: 'Forest',
    baseColor: '#0a1410',
    accentColor: '#22c55e'
  },
  {
    id: 'ocean',
    label: 'Ocean',
    baseColor: '#060f1a',
    accentColor: '#06b6d4'
  },
  {
    id: 'cherry',
    label: 'Cherry',
    baseColor: '#ffffff',
    accentColor: '#ef4444'
  },
  {
    id: 'navy',
    label: 'Navy',
    baseColor: '#080f1e',
    accentColor: '#3b82f6'
  },
  {
    id: 'lavender',
    label: 'Lavender',
    baseColor: '#faf5ff',
    accentColor: '#8b5cf6'
  },
  {
    id: 'amber',
    label: 'Amber',
    baseColor: '#0f0a00',
    accentColor: '#f59e0b'
  },
]

export const defaultThemeId = 'midnight'

export function getTheme(id: string): ThemeDef {
  return themes.find((t) => t.id === id) ?? themes[0]!
}
