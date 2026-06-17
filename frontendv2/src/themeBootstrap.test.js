import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyStartupThemePreference } from './themeBootstrap.js'

describe('applyStartupThemePreference', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    window.localStorage.clear()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
      })),
    })
  })

  it('applies the stored system theme before React mounts', () => {
    window.localStorage.setItem('gp_preferences', JSON.stringify({ theme: 'system' }))

    applyStartupThemePreference()

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
