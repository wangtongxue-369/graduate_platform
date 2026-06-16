import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SubnavTabs from '@/components/SubnavTabs.jsx'
import { useCommunitySubnavItems } from './communityTabs.js'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const notificationsMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    notifications: (...args) => notificationsMock(...args),
  },
}))

vi.mock('@/lib/communityPreview.js', () => ({
  createCommunityPreviewPosts: () => [],
  shouldForceCommunityPreview: () => false,
}))

function CommunityTabsProbe({ unreadCountOverride }) {
  const items = useCommunitySubnavItems([
    { label: '社区目录', to: '/community' },
    { label: '消息通知', to: '/community/notifications', note: '查看互动提醒' },
  ], unreadCountOverride)

  return <SubnavTabs items={items} />
}

describe('useCommunitySubnavItems', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    notificationsMock.mockReset()
    notificationsMock.mockResolvedValue({
      content: [],
      unreadCount: 120,
      totalElements: 120,
      totalPages: 1,
      number: 0,
      size: 1,
    })
  })

  it('maps unread counts from the community notifications API into the tab badge', async () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <CommunityTabsProbe />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText('消息通知 未读 99+')).toBeInTheDocument()
    })

    expect(notificationsMock).toHaveBeenCalledWith(0, 1, 'real-token')
  })

  it('prefers a local override count so the notifications tab can update immediately', () => {
    render(
      <MemoryRouter initialEntries={['/community/notifications']}>
        <CommunityTabsProbe unreadCountOverride={7} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('消息通知 未读 7')).toBeInTheDocument()
  })
})
