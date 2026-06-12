import { render, screen } from '@testing-library/react'
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

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    postDetail: (...args) => postDetailMock(...args),
    comments: (...args) => commentsMock(...args),
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

vi.mock('@legacy/components/MarkdownContent.jsx', () => ({
  default: function MarkdownContentMock({ content }) {
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
  })

  it('renders a return link back to the filtered hub path', async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/community/9',
        state: { returnTo: '/community?category=job&sort=hot' },
      }]}>
        <Routes>
          <Route path="/community/:postId" element={<CommunityPostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByText('Detail Post')
    const links = screen.getAllByRole('link')
    expect(links.some((link) => link.getAttribute('href') === '/community?category=job&sort=hot')).toBe(true)
  })
})
