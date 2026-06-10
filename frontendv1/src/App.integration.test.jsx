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

    expect(screen.getByRole('heading', { name: '先看清路，再决定要不要进入。' })).toBeInTheDocument()
  })

  it('lands job users on the student job station through /app', () => {
    authState = { user: { role: 'user', target: 'job', name: '就业测试用户' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '今天先把最该推进的 3 步做掉。' })).toBeInTheDocument()
  })

  it('lands admins on the admin main station through /app', () => {
    authState = { user: { role: 'admin', target: 'job', name: '管理员' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '今天先处理最影响平台秩序的 4 条队列。' })).toBeInTheDocument()
  })

  it('lands studyabroad users on the holding station through /app instead of 404', () => {
    authState = { user: { role: 'user', target: 'liuxue', name: '留学测试用户' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '留学工作站会在下一阶段单独展开。' })).toBeInTheDocument()
  })
})
