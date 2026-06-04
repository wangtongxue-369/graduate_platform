export const PREFERENCES_STORAGE_KEY = 'gp_preferences'

export const FONT_SCALE_MIN = 0.875
export const FONT_SCALE_MAX = 1.25
export const FONT_SCALE_STEP = 0.025

export const DEFAULT_PREFERENCES = {
  theme: 'system',
  fontScale: 1,
  languageMode: 'zh-CN',
}

const THEMES = new Set(['system', 'light', 'dark'])
const LANGUAGE_MODES = new Set(['zh-CN', 'bilingual', 'en'])

function roundToStep(value) {
  const steps = Math.round((value - FONT_SCALE_MIN) / FONT_SCALE_STEP)
  return Number((FONT_SCALE_MIN + steps * FONT_SCALE_STEP).toFixed(3))
}

export function clampFontScale(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_PREFERENCES.fontScale
  }

  return roundToStep(Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value)))
}

export function normalizePreferences(value) {
  const next = value && typeof value === 'object' ? value : {}

  return {
    theme: THEMES.has(next.theme) ? next.theme : DEFAULT_PREFERENCES.theme,
    fontScale: clampFontScale(next.fontScale),
    languageMode: LANGUAGE_MODES.has(next.languageMode)
      ? next.languageMode
      : DEFAULT_PREFERENCES.languageMode,
  }
}

export function resolveThemePreference(theme, prefersDark) {
  if (theme === 'light' || theme === 'dark') {
    return theme
  }

  return prefersDark ? 'dark' : 'light'
}

export function formatFontScalePercent(value) {
  return `${Math.round(clampFontScale(value) * 100)}%`
}
