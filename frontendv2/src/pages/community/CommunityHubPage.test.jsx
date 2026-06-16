import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityHubPage from './CommunityHubPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const categoriesMock = vi.fn()
const postsMock = vi.fn()
const notificationsMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: (...args) => categoriesMock(...args),
    posts: (...args) => postsMock(...args),
    notifications: (...args) => notificationsMock(...args),
  },
}))

vi.mock('@/components/PageIntro.jsx', () => ({
  default: function PageIntroMock({ kicker, title, lead, actions }) {
    return (
      <section>
        <p>{kicker}</p>
        <h1>{title}</h1>
        <p>{lead}</p>
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
  createCommunityPreviewCategories: () => [],
  createCommunityPreviewPosts: () => [],
  shouldForceCommunityPreview: () => false,
}))

vi.mock('@/lib/withRequestTimeout.js', () => ({
  withRequestTimeout: (promise) => promise,
}))

function DetailStateProbe() {
  const location = useLocation()
  return <div>{location.state?.returnTo || 'missing-return-to'}</div>
}

describe('CommunityHubPage', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    categoriesMock.mockReset()
    postsMock.mockReset()
    notificationsMock.mockReset()

    categoriesMock.mockResolvedValue([
      { id: 'job', code: 'job', name: 'Job' },
    ])
    notificationsMock.mockResolvedValue({
      content: [],
      unreadCount: 0,
      totalElements: 0,
      totalPages: 1,
      number: 0,
      size: 1,
    })

    postsMock.mockResolvedValue({
      content: [
        {
          id: 9,
          title: 'Roadmap Post',
          content: 'A focused workflow post body',
          category: { id: 'job', code: 'job', name: 'Job' },
          tags: ['tag-a'],
          hasAttachment: true,
          attachmentCount: 1,
          commentCount: 2,
          likeCount: 3,
          favoriteCount: 1,
          viewCount: 20,
          createdAt: '2026-06-12T10:00:00',
          updatedAt: '2026-06-12T10:00:00',
        },
      ],
      page: 0,
      size: 8,
      totalPages: 1,
      totalElements: 1,
    })
  })

  it('renders posts loaded from the API', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    const postLinks = await screen.findAllByRole('link', { name: /Roadmap Post/i })
    expect(postLinks[0]).toHaveAttribute('href', '/community/9')
    expect(postsMock).toHaveBeenCalledWith({
      category: undefined,
      keyword: undefined,
      sort: 'latest',
      tag: undefined,
      hasAttachment: undefined,
      page: 0,
      size: 8,
    }, 'real-token')
  })

  it('keeps the posting entry visible on the main flow', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    const links = await screen.findAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/community/new')).toBe(true)
  })

  it('uses reader-facing intro copy instead of workflow-style helper text', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    await screen.findAllByText('Roadmap Post')

    expect(screen.getByRole('heading', { name: '社区交流与资料分享' })).toBeInTheDocument()
    expect(
      screen.getByText('先按分类、排序或关键词缩小范围，再进入帖子查看全文、附件和评论。'),
    ).toBeInTheDocument()
    expect(screen.queryByText('先筛目录，再进入单篇帖子处理内容。')).not.toBeInTheDocument()
    expect(screen.queryByText('登录后可直接从目录进入发帖、通知与评论互动。')).not.toBeInTheDocument()
  })

  it('passes the current filter path into the detail route state', async () => {
    render(
      <MemoryRouter initialEntries={['/community?category=job&sort=hot']}>
        <Routes>
          <Route path="/community" element={<CommunityHubPage />} />
          <Route path="/community/:postId" element={<DetailStateProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    const postLinks = await screen.findAllByRole('link', { name: /Roadmap Post/i })
    fireEvent.click(postLinks[0])

    expect(await screen.findByText('/community?category=job&sort=hot')).toBeInTheDocument()
  })

  it('shows a filter recovery button when no posts match', async () => {
    postsMock.mockResolvedValueOnce({
      content: [],
      page: 0,
      size: 8,
      totalPages: 1,
      totalElements: 0,
    })

    render(
      <MemoryRouter initialEntries={['/community?category=job&keyword=missing']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: 'reset-filters' })).toBeInTheDocument()
  })

  it('moves category and sort controls into the sidebar filter panel', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    await screen.findAllByText('Roadmap Post')

    expect(screen.queryByLabelText('社区目录控制')).not.toBeInTheDocument()
    expect(screen.getByText('目录控制')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: '分类筛选' })).getByText('全部')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: '排序方式' })).getByText('最新发布')).toBeInTheDocument()
  })

  it('compresses the sidebar helpers into one quick clues card', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    await screen.findAllByText('Roadmap Post')

    expect(screen.getByText('快速线索')).toBeInTheDocument()
    expect(screen.queryByText('最近讨论重点')).not.toBeInTheDocument()
    expect(screen.queryByText('常见标签')).not.toBeInTheDocument()
    expect(screen.queryByText('进入方式')).not.toBeInTheDocument()
  })

  it('keeps quick clues focused to two recent discussions and one compact note', async () => {
    postsMock.mockResolvedValueOnce({
      content: [
        {
          id: 9,
          title: 'Roadmap Post',
          content: 'A focused workflow post body',
          category: { id: 'job', code: 'job', name: 'Job' },
          tags: ['tag-a'],
          hasAttachment: true,
          attachmentCount: 1,
          commentCount: 2,
          likeCount: 3,
          favoriteCount: 1,
          viewCount: 20,
          createdAt: '2026-06-12T10:00:00',
          updatedAt: '2026-06-12T10:00:00',
        },
        {
          id: 10,
          title: 'Second Post',
          content: 'Second body',
          category: { id: 'job', code: 'job', name: 'Job' },
          tags: ['tag-b'],
          hasAttachment: false,
          attachmentCount: 0,
          commentCount: 1,
          likeCount: 1,
          favoriteCount: 0,
          viewCount: 8,
          createdAt: '2026-06-12T09:00:00',
          updatedAt: '2026-06-12T09:00:00',
        },
        {
          id: 11,
          title: 'Third Post',
          content: 'Third body',
          category: { id: 'job', code: 'job', name: 'Job' },
          tags: ['tag-c'],
          hasAttachment: false,
          attachmentCount: 0,
          commentCount: 0,
          likeCount: 0,
          favoriteCount: 0,
          viewCount: 4,
          createdAt: '2026-06-12T08:00:00',
          updatedAt: '2026-06-12T08:00:00',
        },
      ],
      page: 0,
      size: 8,
      totalPages: 1,
      totalElements: 3,
    })

    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    const quickCluesSection = screen.getByText('快速线索').closest('section')
    expect(quickCluesSection).not.toBeNull()

    const quickCluesScope = within(quickCluesSection)
    expect(await quickCluesScope.findByText('Roadmap Post')).toBeInTheDocument()
    expect(quickCluesScope.getByText('Second Post')).toBeInTheDocument()
    expect(quickCluesScope.queryByText('Third Post')).not.toBeInTheDocument()
    expect(quickCluesScope.getByText(/先在右侧缩小范围/)).toBeInTheDocument()
  })

  it('shows only four hot tags until the user expands them', async () => {
    postsMock.mockResolvedValueOnce({
      content: [
        {
          id: 9,
          title: 'Roadmap Post',
          content: 'A focused workflow post body',
          category: { id: 'job', code: 'job', name: 'Job' },
          tags: ['tag-a', 'tag-b', 'tag-c', 'tag-d', 'tag-e'],
          hasAttachment: true,
          attachmentCount: 1,
          commentCount: 2,
          likeCount: 3,
          favoriteCount: 1,
          viewCount: 20,
          createdAt: '2026-06-12T10:00:00',
          updatedAt: '2026-06-12T10:00:00',
        },
        {
          id: 10,
          title: 'Second Post',
          content: 'Second body',
          category: { id: 'job', code: 'job', name: 'Job' },
          tags: ['tag-a', 'tag-b', 'tag-c', 'tag-d'],
          hasAttachment: false,
          attachmentCount: 0,
          commentCount: 1,
          likeCount: 1,
          favoriteCount: 0,
          viewCount: 8,
          createdAt: '2026-06-12T09:00:00',
          updatedAt: '2026-06-12T09:00:00',
        },
      ],
      page: 0,
      size: 8,
      totalPages: 1,
      totalElements: 2,
    })

    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    const quickCluesSection = screen.getByText('快速线索').closest('section')
    expect(quickCluesSection).not.toBeNull()

    const quickCluesScope = within(quickCluesSection)
    await quickCluesScope.findByText('Roadmap Post')

    expect(quickCluesScope.getByText('#tag-a')).toBeInTheDocument()
    expect(quickCluesScope.getByText('#tag-d')).toBeInTheDocument()
    expect(quickCluesScope.queryByText('#tag-e')).not.toBeInTheDocument()

    fireEvent.click(quickCluesScope.getByRole('button', { name: '更多标签' }))

    expect(quickCluesScope.getByText('#tag-e')).toBeInTheDocument()
  })

  it('keeps attachment filters collapsed until the user opens more filters', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    await screen.findAllByText('Roadmap Post')

    expect(screen.queryByRole('button', { name: '仅看有附件' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '更多筛选' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '更多筛选' }))

    expect(screen.getByRole('button', { name: '仅看有附件' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收起筛选' })).toBeInTheDocument()
  })
})
