import { createContext, useContext, useEffect, useState } from 'react'
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  clampFontScale,
  normalizePreferences,
  resolveThemePreference,
} from '../lib/preferences.js'

const PreferencesContext = createContext(null)

function readStoredPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    return raw ? normalizePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function getSystemDarkMode() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readStoredPreferences)
  const [prefersDark, setPrefersDark] = useState(getSystemDarkMode)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setPrefersDark(event.matches)

    media.addEventListener?.('change', handleChange)

    return () => {
      media.removeEventListener?.('change', handleChange)
    }
  }, [])

  useEffect(() => {
    const resolvedTheme = resolveThemePreference(preferences.theme, prefersDark)
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.dataset.languageMode = preferences.languageMode
    document.documentElement.style.setProperty('--font-scale', String(preferences.fontScale))
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences, prefersDark])

  function update(partial) {
    setPreferences((current) => normalizePreferences({ ...current, ...partial }))
  }

  const value = {
    preferences,
    setTheme(theme) {
      update({ theme })
    },
    setFontScale(fontScale) {
      update({ fontScale: clampFontScale(fontScale) })
    },
    setLanguageMode(languageMode) {
      update({ languageMode })
    },
    resetPreferences() {
      setPreferences(DEFAULT_PREFERENCES)
    },
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const context = useContext(PreferencesContext)

  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }

  return context
}
