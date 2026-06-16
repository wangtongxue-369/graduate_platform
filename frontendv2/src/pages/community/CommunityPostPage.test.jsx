import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityPostPage from './CommunityPostPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
  user: { id: 1, role: 'user', name: 'Tester' },
}

const postDetailMock = vi.fn()
const commentsMock = vi.fn()
const notificationsMock = vi.fn()
const scrollIntoViewMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    postDetail: (...args) => postDetailMock(...args),
    comments: (...args) => commentsMock(...args),
    notifications: (...args) => notificationsMock(...args),
    updateComment: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
    reportComment: vi.fn(),
    toggleLike: vi.fn(),
    toggleFavorite: vi.fn(),
    reportPost: vi.fn(),
    downloadPostAttachment: vi.fn(),
  },
}))

vi.mock('@/components/markdown/FrontendV2MarkdownContent.jsx', () => ({
  default: function FrontendV2MarkdownContentMock({ content }) {
    return <div>{content}</div>
  },
}))

vi.mock('@/components/PageIntro.jsx', () => ({
  default: function PageIntroMock({ title, actions }) {
    return (
      <section>
        <h1>{title}</h1>
        <div>{actions}</div>
      </section>
    )
  },
}))

vi.mock('@/components/SubnavTabs.jsx', () => ({
  default: function SubnavTabsMock() {
    return <nav aria-label="community subnav" />
  },
}))

vi.mock('@/lib/communityPreview.js', () => ({
  canUseCommunityPreview: () => false,
  createCommunityPreviewComments: () => [],
  createCommunityPreviewPosts: () => [],
  findCommunityPreviewPostById: () => null,
  shouldForceCommunityPreview: () => false,
}))

vi.mock('@/lib/withRequestTimeout.js', () => ({
  withRequestTimeout: (promise) => promise,
}))

describe('CommunityPostPage', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    authState.user = { id: 1, role: 'user', name: 'Tester' }

    postDetailMock.mockReset()
    commentsMock.mockReset()
    notificationsMock.mockReset()

    postDetailMock.mockResolvedValue({
      id: 9,
      title: 'Detail Post',
      content: 'markdown body',
      category: { id: 'job', code: 'job', name: 'Job' },
      tags: ['tag-a'],
      attachments: [],
      createdAt: '2026-06-12T10:00:00',
      updatedAt: '2026-06-12T10:00:00',
      visibility: 'public',
      status: 'PUBLISHED',
      anonymous: false,
    })

    commentsMock.mockResolvedValue([])
    notificationsMock.mockResolvedValue({
      content: [],
      unreadCount: 0,
      totalElements: 0,
      totalPages: 1,
      number: 0,
      size: 1,
    })

    scrollIntoViewMock.mockReset()
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })
  })

  it('renders a return link back to the filtered hub path', async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/community/9',
        state: { returnTo: '/community?category=job&sort=hot' },
      }]}
      >
        <Routes>
          <Route path="/community/:postId" element={<CommunityPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText('Detail Post')
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/community?category=job&sort=hot')).toBe(true)
  })

  it('reuses the dock composer when replying to a comment', async () => {
    commentsMock.mockResolvedValueOnce([
      {
        id: 11,
        authorId: 5,
        authorName: 'Commenter',
        content: 'comment body',
        editable: true,
        replies: [],
        replyCount: 0,
        createdAt: '2026-06-12T11:00:00',
        updatedAt: '2026-06-12T11:00:00',
      },
    ])

    render(
      <MemoryRouter initialEntries={['/community/9']}>
        <Routes>
          <Route path="/community/:postId" element={<CommunityPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: '回复' }))

    expect(screen.getByRole('textbox', { name: '输入评论' })).toBeInTheDocument()
    expect(screen.getByText('回复 Commenter')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消回复' })).toBeInTheDocument()
    expect(screen.queryByText('回复目标')).not.toBeInTheDocument()
  })

  it('keeps post actions grouped in a dedicated panel', async () => {
    render(
      <MemoryRouter initialEntries={['/community/9']}>
        <Routes>
          <Route path="/community/:postId" element={<CommunityPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('帖子操作')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '点赞帖子' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收藏帖子' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '举报帖子' })).toBeInTheDocument()
  })

  it('uses a compact dock composer for new top-level comments', async () => {
    render(
      <MemoryRouter initialEntries={['/community/9']}>
        <Routes>
          <Route path="/community/:postId" element={<CommunityPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText('Detail Post')
    expect(screen.getByRole('textbox', { name: '输入评论' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布评论' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '写评论' })).not.toBeInTheDocument()
    expect(screen.queryByText('评论编辑器')).not.toBeInTheDocument()
  })

  it('offers floating shortcuts to jump to the top and bottom of the post detail area', async () => {
    render(
      <MemoryRouter initialEntries={['/community/9']}>
        <Routes>
          <Route path="/community/:postId" element={<CommunityPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText('Detail Post')

    fireEvent.click(screen.getByRole('button', { name: '帖子详情回到顶部' }))
    expect(scrollIntoViewMock).toHaveBeenNthCalledWith(1, { behavior: 'smooth', block: 'start' })

    fireEvent.click(screen.getByRole('button', { name: '帖子详情滚到底部' }))
    expect(scrollIntoViewMock).toHaveBeenNthCalledWith(2, { behavior: 'smooth', block: 'end' })
  })
})
