import { render, screen, within } from '@testing-library/react'
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

  it('shows the intro content and login/register panes', () => {
    render(
      <MemoryRouter>
        <AuthLandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '面向升学与求职场景的学生服务平台' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /登录/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /注册/i })).toBeInTheDocument()
  })

  it('uses streamlined login copy without the extra intro tabs or preview link', () => {
    render(
      <MemoryRouter>
        <AuthLandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '登录与注册' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '平台介绍' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '方向模块' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '管理能力' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '直接预览不同身份' })).not.toBeInTheDocument()
  })

  it('keeps the quick facts on the left intro side and reserves the main panel for auth only', () => {
    render(
      <MemoryRouter>
        <AuthLandingPage />
      </MemoryRouter>,
    )

    const authMain = screen.getByRole('main')

    expect(screen.getByText('快速了解')).toBeInTheDocument()
    expect(within(authMain).queryByText('快速了解')).not.toBeInTheDocument()
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
