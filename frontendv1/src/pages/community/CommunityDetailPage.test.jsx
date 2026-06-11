import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { communityApi } from '@legacy/lib/api.js'
import CommunityDetailPage from './CommunityDetailPage.jsx'

const communityPreviewMock = vi.hoisted(() => ({
  canUseCommunityPreview: vi.fn(() => true),
  shouldForceCommunityPreview: vi.fn(() => false),
}))

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
    postDetail: vi.fn().mockResolvedValue({
      id: 12,
      title: '求职经验复盘：简历被筛掉后我补了什么',
      content: '把项目关键词补齐后，第二周开始稳定收到面试邀约。',
      category: { code: 'job', name: '就业' },
      tags: '简历,就业',
      visibility: 'public',
      hasAttachment: true,
      attachmentCount: 1,
      attachments: [{ id: 9, originalName: 'resume-checklist.pdf', fileSize: 204800 }],
      commentCount: 0,
      likeCount: 46,
      favoriteCount: 22,
      createdAt: '2026-06-10T09:00:00',
    }),
    comments: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/lib/communityPreview.js', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    canUseCommunityPreview: communityPreviewMock.canUseCommunityPreview,
    shouldForceCommunityPreview: communityPreviewMock.shouldForceCommunityPreview,
  }
})

describe('CommunityDetailPage', () => {
  beforeEach(() => {
    communityPreviewMock.canUseCommunityPreview.mockReturnValue(true)
    communityPreviewMock.shouldForceCommunityPreview.mockReturnValue(false)
  })

  it('keeps an explicit return path and clear login gate in the new detail page', async () => {
    render(
      <MemoryRouter initialEntries={['/community/12']}>
        <Routes>
          <Route path="/community/:id" element={<CommunityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('navigation', { name: '返回路径' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '社区' })).toBeInTheDocument()
    expect(screen.getByText('附件与资料')).toBeInTheDocument()
    expect(screen.getByText('登录后继续互动')).toBeInTheDocument()
  })

  it('shows a structured recovery state when detail loading fails', async () => {
    communityPreviewMock.canUseCommunityPreview.mockReturnValue(false)
    communityApi.postDetail.mockRejectedValueOnce(new Error('帖子详情请求超时，请检查后端服务是否可用。'))
    communityApi.comments.mockResolvedValueOnce([])

    render(
      <MemoryRouter initialEntries={['/community/12']}>
        <Routes>
          <Route path="/community/:id" element={<CommunityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('这条阅读入口已经接住，但正文暂时没有取回。')).toBeInTheDocument()
    expect(screen.getByText('你现在还能继续什么')).toBeInTheDocument()
    expect(screen.queryByText('community detail notice')).not.toBeInTheDocument()
  })

  it('shows preview detail content in dev instead of blocking on an unavailable backend', async () => {
    communityApi.postDetail.mockRejectedValueOnce(new Error('帖子详情请求超时，请检查后端服务是否可用。'))
    communityApi.comments.mockRejectedValueOnce(new Error('帖子详情请求超时，请检查后端服务是否可用。'))

    render(
      <MemoryRouter initialEntries={['/community/12']}>
        <Routes>
          <Route path="/community/:id" element={<CommunityDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('当前为开发预览：帖子正文、附件和评论基于后端字段结构展示，实时互动状态需连接后端。')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '复试结束后，我怎么把跨考资料整理成可复用清单' })).toBeInTheDocument()
    expect(screen.getByText('资料包说明.md')).toBeInTheDocument()
  })
})
