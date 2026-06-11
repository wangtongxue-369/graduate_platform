import { useEffect, useState } from 'react'
import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE_KEY, resolveThemePreference } from '@legacy/lib/preferences.js'

const themeOptions = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' },
]

function readStoredTheme() {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.theme || DEFAULT_PREFERENCES.theme
  } catch {
    return DEFAULT_PREFERENCES.theme
  }
}

function getResolvedTheme(theme) {
  const prefersDark = typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches

  return resolveThemePreference(theme, prefersDark)
}

function persistTheme(theme) {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ ...parsed, theme }))
  } catch {
    // ignore storage failures for local preview
  }
}

export default function ThemeSwitch() {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = getResolvedTheme(theme)
    persistTheme(theme)
  }, [theme])

  return (
    <div className="v2-theme-switch" role="group" aria-label="主题切换">
      {themeOptions.map((item) => (
        <button
          key={item.value}
          type="button"
          className={`v2-theme-switch-btn ${theme === item.value ? 'is-active' : ''}`}
          onClick={() => setTheme(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
