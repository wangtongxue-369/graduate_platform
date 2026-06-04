import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PREFERENCES,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  formatFontScalePercent,
  normalizePreferences,
  resolveThemePreference,
} from './preferences.js'

describe('normalizePreferences', () => {
  it('returns defaults when the stored payload is invalid', () => {
    expect(normalizePreferences(null)).toEqual(DEFAULT_PREFERENCES)
    expect(normalizePreferences({})).toEqual(DEFAULT_PREFERENCES)
    expect(
      normalizePreferences({
        theme: 'neon',
        fontScale: 'big',
        languageMode: 'jp',
      }),
    ).toEqual(DEFAULT_PREFERENCES)
  })

  it('keeps valid enum values and rounds fontScale to the configured step', () => {
    expect(
      normalizePreferences({
        theme: 'dark',
        fontScale: 1.14,
        languageMode: 'bilingual',
      }),
    ).toEqual({
      theme: 'dark',
      fontScale: 1.15,
      languageMode: 'bilingual',
    })
  })

  it('clamps fontScale to the allowed range', () => {
    expect(
      normalizePreferences({
        theme: 'light',
        fontScale: 99,
        languageMode: 'en',
      }),
    ).toEqual({
      theme: 'light',
      fontScale: FONT_SCALE_MAX,
      languageMode: 'en',
    })

    expect(
      normalizePreferences({
        theme: 'system',
        fontScale: 0,
        languageMode: 'zh-CN',
      }),
    ).toEqual({
      ...DEFAULT_PREFERENCES,
      fontScale: FONT_SCALE_MIN,
    })
  })
})

describe('resolveThemePreference', () => {
  it('returns the explicit theme when the user picked light or dark', () => {
    expect(resolveThemePreference('light', true)).toBe('light')
    expect(resolveThemePreference('dark', false)).toBe('dark')
  })

  it('resolves system mode from the browser preference', () => {
    expect(resolveThemePreference('system', true)).toBe('dark')
    expect(resolveThemePreference('system', false)).toBe('light')
  })
})

describe('formatFontScalePercent', () => {
  it('formats the slider value as a readable percentage', () => {
    expect(FONT_SCALE_STEP).toBe(0.025)
    expect(formatFontScalePercent(1)).toBe('100%')
    expect(formatFontScalePercent(1.1)).toBe('110%')
  })
})
