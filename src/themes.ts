import type { ThemeDef } from './types/index.ts'

export const themes: ThemeDef[] = [
  {
    id: 'sunrise',
    label: 'Sunrise',
    baseColor: '#ffffff',
    accentColor: '#f97316'
  },
  {
    id: 'ivory',
    label: 'Ivory',
    baseColor: '#f1ede5',
    accentColor: '#e08229'
  },
  {
    id: 'cherry',
    label: 'Cherry',
    baseColor: '#ffffff',
    accentColor: '#ef4444'
  },
  {
    id: 'sky',
    label: 'Sky',
    baseColor: '#ffffff',
    accentColor: '#5ba1da'
  },
  {
    id: 'lavender',
    label: 'Lavender',
    baseColor: '#faf5ff',
    accentColor: '#8b5cf6'
  },
  {
    id: 'nice',
    label: 'Nice',
    baseColor: '#ffffff',
    accentColor: '#3f7e83'
  }, 
  {
    id: 'navy',
    label: 'Navy',
    baseColor: '#ebf3f2',
    accentColor: '#bed6dd'
  },
  {
    id: 'amber',
    label: 'Amber',
    baseColor: '#3d2c15',
    accentColor: '#f59e0b'
  },
  {
    id: 'slate',
    label: 'Slate',
    baseColor: '#334155',
    accentColor: '#38bdf8'
  },
  {
    id: 'graphite',
    label: 'Graphite',
    baseColor: '#313949',
    accentColor: '#4185eb'
  },
  {
    id: 'stone',
    label: 'Stone',
    baseColor: '#44403c',
    accentColor: '#fbbf24'
  },
  {
    id: 'cosmos',
    label: 'Cosmos',
    baseColor: '#2f356b',
    accentColor: '#7855f7'
  },
  {
    id: 'forest',
    label: 'Forest',
    baseColor: '#1b362c',
    accentColor: '#22c55e'
  },
  {
    id: 'ocean',
    label: 'Ocean',
    baseColor: '#075985',
    accentColor: '#3b82f6'
  },
  {
    id: 'cherryDark',
    label: 'Cherry Dark',
    baseColor: '#440b19',
    accentColor: '#ef4444'
  },
  {
    id: 'midnight',
    label: 'Midnight',
    baseColor: '#0f1117',
    accentColor: '#6366f1'
  },
]

export const defaultThemeId = 'midnight'

export function getTheme(id: string): ThemeDef {
  return themes.find((t) => t.id === id) ?? themes[0]!
}
