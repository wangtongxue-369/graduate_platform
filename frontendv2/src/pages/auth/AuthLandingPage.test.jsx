import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthLandingPage from './AuthLandingPage.jsx'

const authState = {
  loading: false,
  isAuthed: false,
  user: null,
}

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

describe('AuthLandingPage', () => {
  beforeEach(() => {
    authState.loading = false
    authState.isAuthed = false
    authState.user = null
  })

  it('shows intro navigation and login/register panes', () => {
    render(
      <MemoryRouter>
        <AuthLandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /登录/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /注册/i })).toBeInTheDocument()
  })

  it('shows a visible loading placeholder while auth is bootstrapping', () => {
    authState.loading = true

    render(
      <MemoryRouter>
        <AuthLandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('status', { name: 'app-loading' })).toBeInTheDocument()
  })
})
