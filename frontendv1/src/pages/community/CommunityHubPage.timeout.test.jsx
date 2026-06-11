import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityHubPage from './CommunityHubPage.jsx'

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
    categories: vi.fn(() => new Promise(() => {})),
    posts: vi.fn(() => new Promise(() => {})),
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

describe('CommunityHubPage timeout fallback', () => {
  beforeEach(() => {
    communityPreviewMock.canUseCommunityPreview.mockReturnValue(true)
    communityPreviewMock.shouldForceCommunityPreview.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an explicit timeout message instead of loading forever when the backend hangs', async () => {
    vi.useFakeTimers()
    communityPreviewMock.canUseCommunityPreview.mockReturnValue(false)

    render(
      <MemoryRouter>
        <CommunityHubPage />
      </MemoryRouter>,
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(8001)
      await Promise.resolve()
    })

    expect(screen.getByText('社区请求超时，请检查后端服务是否可用。')).toBeInTheDocument()
    expect(screen.queryByText('当前筛选下还没有帖子。你可以先切换分类，或者稍后再回来看看。')).not.toBeInTheDocument()
  })
})
