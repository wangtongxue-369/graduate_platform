import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

let authState = { user: null, token: '', isAuthed: false, loading: false }

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

describe('frontendv1 app integration', () => {
  beforeEach(() => {
    authState = { user: null, token: '', isAuthed: false, loading: false }
  })

  it('keeps guests on the public station', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '先看内容，再决定是否进入身份语境。' })).toBeInTheDocument()
  })

  it('lands job users on the student job station through /app', () => {
    authState = { user: { role: 'user', target: 'job', name: '就业测试用户' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '今日作战桌' })).toBeInTheDocument()
  })

  it('lands admins on the admin main station through /app', () => {
    authState = { user: { role: 'admin', target: 'job', name: '管理员' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '值班总台' })).toBeInTheDocument()
  })

  it('lands studyabroad users on the studyabroad station through /app instead of a holding page', () => {
    authState = { user: { role: 'user', target: 'liuxue', name: '留学测试用户' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '申请航线图' })).toBeInTheDocument()
  })
})
