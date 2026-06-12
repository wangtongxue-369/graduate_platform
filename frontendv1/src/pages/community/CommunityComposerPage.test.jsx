import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { communityApi } from '@legacy/lib/api.js'
import CommunityComposerPage from './CommunityComposerPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 'dev-3', name: '就业测试用户', target: 'job', role: 'user' },
    token: 'dev-token',
    isAuthed: true,
    loading: false,
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: vi.fn().mockResolvedValue([
      { id: 'job', code: 'job', name: '就业' },
      { id: 'liuxue', code: 'liuxue', name: '留学' },
    ]),
    createPost: vi.fn(),
  },
}))

describe('CommunityComposerPage', () => {
  it('moves posting into its own page and keeps moderation rules obvious', async () => {
    render(
      <MemoryRouter>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '发一篇能被人快速看懂的帖子。' })).toBeInTheDocument()
    expect(await screen.findByText('附件帖子会进入审核队列，Markdown 正文与附件说明请写清楚。')).toBeInTheDocument()
    expect(screen.getByText('提交审核')).toBeInTheDocument()
    expect(screen.getByText('先存草稿')).toBeInTheDocument()
  })

  it('uses preview categories in dev when community categories cannot be loaded', async () => {
    communityApi.categories.mockRejectedValueOnce(new Error('社区分类请求超时，请检查后端服务是否可用。'))

    render(
      <MemoryRouter>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('当前为开发预览：分类、审核提示和提交反馈基于后端字段结构提供演示内容。')).toBeInTheDocument()
    expect(screen.getByDisplayValue('考研')).toBeInTheDocument()
  })
})
