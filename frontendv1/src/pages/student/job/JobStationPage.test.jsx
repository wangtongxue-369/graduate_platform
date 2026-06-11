import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import JobStationPage from './JobStationPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'dev-3', name: '就业测试用户', target: 'job', role: 'user' },
    token: 'dev-token',
    isAuthed: true,
    loading: false,
  }),
}))

describe('JobStationPage', () => {
  it('shows the three primary employment tasks and explicit boundaries', () => {
    render(
      <MemoryRouter>
        <JobStationPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '今日作战桌' })).toBeInTheDocument()
    expect(screen.getAllByText('简历卷宗').length).toBeGreaterThan(0)
    expect(screen.getAllByText('岗位筛选台').length).toBeGreaterThan(0)
    expect(screen.getAllByText('投递轨道').length).toBeGreaterThan(0)
  })
})
