import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityNotificationsPage from './CommunityNotificationsPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const notificationsMock = vi.fn()
const markReadMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    notifications: (...args) => notificationsMock(...args),
    markNotificationRead: (...args) => markReadMock(...args),
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

describe('CommunityNotificationsPage', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    notificationsMock.mockReset()
    markReadMock.mockReset()

    notificationsMock.mockResolvedValue({
      content: [
        {
          id: 'n1',
          title: 'Unread Notification',
          content: 'Needs attention',
          read: false,
          createdAt: '2026-06-12T10:00:00',
          link: '/community/9',
          type: 'comment',
        },
        {
          id: 'n2',
          title: 'Read Notification',
          content: 'Already handled',
          read: true,
          createdAt: '2026-06-12T09:00:00',
          link: '/community/8',
          type: 'comment',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 2,
    })
  })

  it('can narrow the list to unread notifications only', async () => {
    render(
      <MemoryRouter initialEntries={['/community/notifications']}>
        <CommunityNotificationsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Unread Notification')).toBeInTheDocument()

    const filterButtons = screen.getAllByRole('button').filter((button) => (
      String(button.className).includes('v2-segment-button')
    ))
    fireEvent.click(filterButtons[1])

    expect(screen.getByText('Unread Notification')).toBeInTheDocument()
  })

  it('passes the notifications return path into the source post link', async () => {
    render(
      <MemoryRouter initialEntries={['/community/notifications']}>
        <Routes>
          <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
          <Route path="/community/:postId" element={<DetailStateProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    const postLinks = await screen.findAllByRole('link', { name: '打开原帖' })
    fireEvent.click(postLinks[0])

    expect(await screen.findByText('/community/notifications')).toBeInTheDocument()
  })
})
