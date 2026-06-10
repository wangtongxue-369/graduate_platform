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

    expect(screen.getByRole('heading', { name: '今天先把最该推进的 3 步做掉。' })).toBeInTheDocument()
    expect(screen.getByText('进入简历页')).toBeInTheDocument()
    expect(screen.getByText('进入推荐页')).toBeInTheDocument()
    expect(screen.getByText('进入投递跟踪')).toBeInTheDocument()
  })
})
