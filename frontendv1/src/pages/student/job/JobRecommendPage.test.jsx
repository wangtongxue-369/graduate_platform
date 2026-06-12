import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import JobRecommendPage from './JobRecommendPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'dev-3', name: '就业测试用户', target: 'job', role: 'user' },
    token: 'dev-token',
    isAuthed: true,
    loading: false,
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  employmentApi: {
    recommendations: vi.fn(),
    notifications: vi.fn(),
    markNotificationRead: vi.fn(),
  },
}))

describe('JobRecommendPage', () => {
  it('shows preview recommendations and an honest preview notice in dev mode', async () => {
    render(
      <MemoryRouter>
        <JobRecommendPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('当前为开发预览：岗位、匹配原因和提醒基于后端字段结构提供演示数据。正式排序与提醒需连接后端。')).toBeInTheDocument()
    expect(screen.getByText('前端开发工程师')).toBeInTheDocument()
    expect(screen.getAllByText('查看详情').length).toBeGreaterThan(0)
  })
})
