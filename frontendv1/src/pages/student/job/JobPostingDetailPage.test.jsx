import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import JobPostingDetailPage from './JobPostingDetailPage.jsx'

const { employmentApi } = vi.hoisted(() => ({
  employmentApi: {
    postingDetail: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'dev-3', name: '就业测试用户', target: 'job', role: 'user' },
    token: 'dev-token',
    isAuthed: true,
    loading: false,
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  employmentApi,
}))

describe('JobPostingDetailPage', () => {
  it('uses preview posting data in dev mode instead of a failed remote fetch', async () => {
    render(
      <MemoryRouter initialEntries={['/job/postings/101']}>
        <Routes>
          <Route path="/job/postings/:id" element={<JobPostingDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '前端开发工程师' })).toBeInTheDocument()
    expect(screen.getByText('当前为开发预览：岗位详情基于后端返回字段生成演示内容，正式申请链接与实时状态需连接后端。')).toBeInTheDocument()
    expect(screen.getByText('加入投递跟踪')).toBeInTheDocument()
    expect(employmentApi.postingDetail).not.toHaveBeenCalled()
  })
})
