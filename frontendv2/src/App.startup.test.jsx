import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

function createShell(name) {
  return function ShellMock() {
    return (
      <div data-testid={name}>
        <Outlet />
      </div>
    )
  }
}

describe('frontendv2 startup isolation', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('still renders the root route when an unrelated route module is unavailable', async () => {
    vi.doMock('@legacy/context/AuthContext.jsx', () => ({
      useAuth: () => ({
        loading: false,
        isAuthed: false,
        user: null,
      }),
    }))

    vi.doMock('@/layouts/PublicShell.jsx', () => ({
      default: createShell('public-shell'),
    }))

    vi.doMock('@/pages/auth/AuthLandingPage.jsx', () => ({
      default: function AuthLandingPageMock() {
        return <h1>auth landing</h1>
      },
    }))

    vi.doMock('@/pages/student/kaoyan/KaoyanStudyRoomsPage.jsx', () => {
      throw new Error('study rooms module unavailable')
    })

    const { default: App } = await import('./App.jsx')

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'auth landing' })).toBeInTheDocument()
  })
})
