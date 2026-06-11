import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { communityApi } from '@legacy/lib/api.js'
import CommunityHubPage from './CommunityHubPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: null,
    token: '',
    isAuthed: false,
    loading: false,
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: vi.fn().mockResolvedValue([
      { id: 'job', code: 'job', name: '就业' },
      { id: 'experience', code: 'experience', name: '经验分享' },
    ]),
    posts: vi.fn().mockResolvedValue({
      content: [
        {
          id: 12,
          title: '求职经验复盘：简历被筛掉后我补了什么',
          content: '把项目关键词补齐后，第二周开始稳定收到面试邀约。',
          category: { code: 'job', name: '就业' },
          tags: '简历,就业',
          visibility: 'public',
          hasAttachment: true,
          attachmentCount: 2,
          viewCount: 318,
          commentCount: 19,
          likeCount: 46,
          favoriteCount: 22,
          createdAt: '2026-06-10T09:00:00',
        },
      ],
    }),
  },
}))

describe('CommunityHubPage', () => {
  it('shows a layered public community station instead of the legacy flattened page', async () => {
    render(
      <MemoryRouter>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '先看公开讨论，再决定是否参与发言。' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '登录后发帖' })).toBeInTheDocument()
    expect(await screen.findByText('求职经验复盘：简历被筛掉后我补了什么')).toBeInTheDocument()
  })

  it('falls back to preview content in dev when the backend is unavailable', async () => {
    communityApi.categories.mockRejectedValueOnce(new Error('社区请求超时，请检查后端服务是否可用。'))
    communityApi.posts.mockRejectedValueOnce(new Error('社区请求超时，请检查后端服务是否可用。'))

    render(
      <MemoryRouter>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('当前展示为演示数据，正式内容与排序以上线后端结果为准。')).toBeInTheDocument()
    expect(screen.getByText('复试结束后，我怎么把跨考资料整理成可复用清单')).toBeInTheDocument()
  })
})
