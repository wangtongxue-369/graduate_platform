import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityHubPage from './CommunityHubPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const categoriesMock = vi.fn()
const postsMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: (...args) => categoriesMock(...args),
    posts: (...args) => postsMock(...args),
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
  createCommunityPreviewCategories: () => [],
  createCommunityPreviewPosts: () => [],
  shouldForceCommunityPreview: () => false,
}))

vi.mock('@/lib/withRequestTimeout.js', () => ({
  withRequestTimeout: (promise) => promise,
}))

describe('CommunityHubPage', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    categoriesMock.mockReset()
    postsMock.mockReset()

    categoriesMock.mockResolvedValue([
      { id: 'job', code: 'job', name: 'Job' },
    ])

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
})
