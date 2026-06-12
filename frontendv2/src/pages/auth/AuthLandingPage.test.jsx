import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AuthLandingPage from './AuthLandingPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    loading: false,
    isAuthed: false,
    user: null,
  }),
}))

describe('AuthLandingPage', () => {
  it('shows intro navigation and login/register panes', () => {
    render(
      <MemoryRouter>
        <AuthLandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: '站点介绍导航' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '注册' })).toBeInTheDocument()
  })
})
