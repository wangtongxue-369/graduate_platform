import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PREFERENCES_STORAGE_KEY } from '../lib/preferences.js'
import { PreferencesProvider, usePreferences } from './PreferencesContext.jsx'

function Probe() {
  const {
    preferences,
    setTheme,
    setFontScale,
    setLanguageMode,
    resetPreferences,
  } = usePreferences()

  return (
    <>
      <output data-testid="preferences">{JSON.stringify(preferences)}</output>
      <button type="button" onClick={() => setTheme('light')}>light</button>
      <button type="button" onClick={() => setFontScale(1.1)}>110%</button>
      <button type="button" onClick={() => setLanguageMode('en')}>English</button>
      <button type="button" onClick={resetPreferences}>reset</button>
    </>
  )
}

describe('PreferencesProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-language-mode')
    document.documentElement.style.removeProperty('--font-scale')

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  it('hydrates from localStorage and syncs DOM attributes', async () => {
    localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        theme: 'dark',
        fontScale: 1.1,
        languageMode: 'bilingual',
      }),
    )

    render(
      <PreferencesProvider>
        <Probe />
      </PreferencesProvider>,
    )

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
    })

    expect(document.documentElement.dataset.languageMode).toBe('bilingual')
    expect(document.documentElement.style.getPropertyValue('--font-scale')).toBe('1.1')
    expect(screen.getByTestId('preferences').textContent).toContain('"theme":"dark"')
  })

  it('persists updates and can reset back to defaults', async () => {
    render(
      <PreferencesProvider>
        <Probe />
      </PreferencesProvider>,
    )

    fireEvent.click(screen.getByText('light'))
    fireEvent.click(screen.getByText('110%'))
    fireEvent.click(screen.getByText('English'))

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY))).toEqual({
        theme: 'light',
        fontScale: 1.1,
        languageMode: 'en',
      })
    })

    fireEvent.click(screen.getByText('reset'))

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY))).toEqual({
        theme: 'system',
        fontScale: 1,
        languageMode: 'zh-CN',
      })
    })
  })
})
