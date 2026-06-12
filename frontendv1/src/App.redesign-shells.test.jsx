import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

let authState = { user: null, token: '', isAuthed: false, loading: false }

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

describe('frontendv1 redesign shell routing', () => {
  beforeEach(() => {
    authState = { user: null, token: '', isAuthed: false, loading: false }
  })

  it('renders the guest hall instead of the old portal hero', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('navigation', { name: '游客门厅阶段' })).toBeInTheDocument()
  })

  it('renders distinct student stations for job and kaoyan', async () => {
    authState = { user: { role: 'user', target: 'job', name: '就业测试用户' }, token: 'dev-token', isAuthed: true, loading: false }
    const { unmount } = render(
      <MemoryRouter initialEntries={['/station/job']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: '今日作战桌' })).toBeInTheDocument()

    unmount()
    authState = { user: { role: 'user', target: 'kaoyan', name: '考研测试用户' }, token: 'dev-token', isAuthed: true, loading: false }
    render(
      <MemoryRouter initialEntries={['/station/kaoyan']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: '复习台账' })).toBeInTheDocument()
  })

  it('renders the admin value desk instead of a stat-card dashboard', async () => {
    authState = { user: { role: 'admin', target: 'job', name: '管理员' }, token: 'dev-token', isAuthed: true, loading: false }

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '值班总台' })).toBeInTheDocument()
  })

  it('routes admin users into native frontendv1 governance pages', async () => {
    authState = { user: { role: 'admin', target: 'job', name: '管理员' }, token: 'dev-token', isAuthed: true, loading: false }

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/question-banks']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '题库治理' })).toBeInTheDocument()

    unmount()

    render(
      <MemoryRouter initialEntries={['/admin/employment']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '就业运营台' })).toBeInTheDocument()
  })
})
