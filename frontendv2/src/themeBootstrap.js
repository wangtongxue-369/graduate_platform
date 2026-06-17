import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY, resolveThemePreference } from '@legacy/lib/preferences.js'

function readStartupThemePreference() {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.theme || DEFAULT_PREFERENCES.theme
  } catch {
    return DEFAULT_PREFERENCES.theme
  }
}

function resolveStartupTheme(theme) {
  const prefersDark = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  return resolveThemePreference(theme, prefersDark)
}

export function applyStartupThemePreference() {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = resolveStartupTheme(readStartupThemePreference())
}
