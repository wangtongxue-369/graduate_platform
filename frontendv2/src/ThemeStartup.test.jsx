import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PREFERENCES_STORAGE_KEY } from '@legacy/lib/preferences.js'
import CommonShell from '@/layouts/CommonShell.jsx'

const authState = {
  loading: false,
  isAuthed: true,
  user: {
    id: 1,
    name: '测试用户',
    role: 'user',
    target: 'kaoyan',
  },
}

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

describe('theme startup sync', () => {
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

  it('applies the stored system theme before the settings popover is opened', () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <Routes>
          <Route element={<CommonShell />}>
            <Route
              path="/community"
              element={<div className="v2-main-column"><h1>社区目录</h1></div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
