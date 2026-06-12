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
  it('shows all real admin domains from the backend-driven spec', () => {
    render(
      <MemoryRouter>
        <AdminMainPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '值班总台' })).toBeInTheDocument()
    expect(screen.getAllByText('社区治理').length).toBeGreaterThan(0)
    expect(screen.getAllByText('题库治理').length).toBeGreaterThan(0)
    expect(screen.getAllByText('考研治理').length).toBeGreaterThan(0)
    expect(screen.getAllByText('考公治理').length).toBeGreaterThan(0)
    expect(screen.getAllByText('就业运营').length).toBeGreaterThan(0)
    expect(screen.queryByText('留学运营台')).not.toBeInTheDocument()
  })
})
