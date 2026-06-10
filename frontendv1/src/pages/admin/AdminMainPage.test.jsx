import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AdminMainPage from './AdminMainPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, name: '管理员', role: 'admin', target: 'job' },
    token: 'dev-token',
    isAuthed: true,
    loading: false,
  }),
}))

describe('AdminMainPage', () => {
  it('shows real governance modules and does not invent a 留学独立后台', () => {
    render(
      <MemoryRouter>
        <AdminMainPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '今天先处理最影响平台秩序的 4 条队列。' })).toBeInTheDocument()
    expect(screen.getByText('内容治理')).toBeInTheDocument()
    expect(screen.getByText('用户治理')).toBeInTheDocument()
    expect(screen.getByText('就业运营')).toBeInTheDocument()
    expect(screen.queryByText('留学运营台')).not.toBeInTheDocument()
  })
})
