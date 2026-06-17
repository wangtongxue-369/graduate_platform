import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PREFERENCES_STORAGE_KEY } from '@legacy/lib/preferences.js'
import PublicShell from './PublicShell.jsx'

describe('PublicShell', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    window.localStorage.clear()
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ theme: 'system' }))

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    })
  })

  it('applies the stored theme preference on the public auth shell too', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicShell />}>
            <Route path="/" element={<div>auth landing</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
