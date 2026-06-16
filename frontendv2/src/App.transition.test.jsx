import React, { useEffect } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROUTER_FUTURE_FLAGS } from './routerFuture.js'

const authState = {
  loading: false,
  isAuthed: true,
  user: {
    id: 1,
    name: 'Test User',
    role: 'user',
    target: 'kaoyan',
  },
}

function CommonShellMock() {
  return <Outlet />
}

function RouteDriver() {
  const navigate = useNavigate()

  useEffect(() => {
    // Keep the driver mounted inside the router tree.
  }, [])

  return (
    <button type="button" onClick={() => navigate('/community/new')}>
      go composer
    </button>
  )
}

describe('frontendv2 route transitions', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('keeps the current page visible while the next lazy route is still loading', async () => {
    let resolveComposerModule
    const composerModuleReady = new Promise((resolve) => {
      resolveComposerModule = resolve
    })

    vi.doMock('@legacy/context/AuthContext.jsx', () => ({
      useAuth: () => authState,
    }))

    vi.doMock('@/layouts/CommonShell.jsx', () => ({
      default: CommonShellMock,
    }))

    vi.doMock('@/pages/community/CommunityHubPage.jsx', () => ({
      default: function CommunityHubPageMock() {
        return <h1>community hub</h1>
      },
    }))

    vi.doMock('@/pages/community/CommunityComposerPage.jsx', async () => {
      await composerModuleReady

      return {
        default: function CommunityComposerPageMock() {
          return <h1>community composer</h1>
        },
      }
    })

    const { default: App } = await import('./App.jsx')

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={['/community']}>
        <App />
        <RouteDriver />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'community hub' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'go composer' }))

    expect(screen.getByRole('heading', { name: 'community hub' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'app-loading' })).not.toBeInTheDocument()

    resolveComposerModule()

    expect(await screen.findByRole('heading', { name: 'community composer' })).toBeInTheDocument()
  })
})
