import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaoyanMessagesPage from '@/pages/student/kaoyan/KaoyanMessagesPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: '考研测试用户',
    role: 'user',
    target: 'kaoyan',
  },
  token: 'remote-token',
  isAuthed: true,
  loading: false,
}))

const apiMocks = vi.hoisted(() => ({
  mentorApi: {
    sentSessions: vi.fn(),
    receivedSessions: vi.fn(),
    sessionMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    counselingStreamUrl: vi.fn(() => 'http://localhost/counseling-stream?token=remote-token'),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => apiMocks)

class EventSourceMock {
  static instances = []

  constructor(url) {
    this.url = url
    this.listeners = new Map()
    EventSourceMock.instances.push(this)
  }

  addEventListener(type, listener) {
    const handlers = this.listeners.get(type) || []
    handlers.push(listener)
    this.listeners.set(type, handlers)
  }

  emit(type, payload = {}) {
    const handlers = this.listeners.get(type) || []
    handlers.forEach((listener) => listener({ data: JSON.stringify(payload) }))
  }

  close() {}
}

vi.stubGlobal('EventSource', EventSourceMock)

describe('KaoyanMessagesPage auto refresh', () => {
  beforeEach(() => {
    authState.user = {
      id: 9,
      name: '考研测试用户',
      role: 'user',
      target: 'kaoyan',
    }
    authState.token = 'remote-token'
    authState.isAuthed = true
    authState.loading = false

    Object.values(apiMocks.mentorApi).forEach((fn) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
    })

    apiMocks.mentorApi.counselingStreamUrl.mockReturnValue('http://localhost/counseling-stream?token=remote-token')
    apiMocks.mentorApi.receivedSessions.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.sendMessage.mockResolvedValue(undefined)
    apiMocks.mentorApi.markAsRead.mockResolvedValue(undefined)
    EventSourceMock.instances.length = 0
  })

  it('refreshes sessions and the active thread on the interval without changing the selected conversation', async () => {
    const intervalCallbacks = []
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation((callback) => {
      intervalCallbacks.push(callback)
      return 1
    })
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {})

    apiMocks.mentorApi.sentSessions
      .mockResolvedValueOnce({
        content: [
          {
            id: 51,
            mentorId: 21,
            studentId: 9,
            subject: '复试准备',
            mentorName: '林学姐',
            unreadCount: 1,
            createdAt: '2026-06-12T10:00:00',
          },
          {
            id: 61,
            mentorId: 22,
            studentId: 9,
            subject: '调剂咨询',
            mentorName: '周学长',
            unreadCount: 0,
            createdAt: '2026-06-13T10:00:00',
          },
        ],
        totalElements: 2,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 51,
            mentorId: 21,
            studentId: 9,
            subject: '复试准备',
            mentorName: '林学姐',
            unreadCount: 0,
            createdAt: '2026-06-12T10:00:00',
          },
          {
            id: 61,
            mentorId: 22,
            studentId: 9,
            subject: '调剂咨询',
            mentorName: '周学长',
            unreadCount: 1,
            createdAt: '2026-06-13T10:15:00',
          },
        ],
        totalElements: 2,
        totalPages: 1,
      })

    apiMocks.mentorApi.sessionMessages
      .mockResolvedValueOnce([
        { id: 91, senderId: 51, senderName: '林学姐', content: '先把复试材料列出来。', createdAt: '2026-06-12T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 101, senderId: 61, senderName: '周学长', content: '先确认调剂窗口。', createdAt: '2026-06-13T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 101, senderId: 61, senderName: '周学长', content: '先确认调剂窗口。', createdAt: '2026-06-13T10:00:00' },
        { id: 102, senderId: 61, senderName: '周学长', content: '已经更新到第二条回复。', createdAt: '2026-06-13T10:15:00' },
      ])

    try {
      const { container } = render(
        <MemoryRouter>
          <KaoyanMessagesPage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledTimes(1)
      })

      const sessionButtons = container.querySelectorAll('.v2-counseling-session-item')
      expect(sessionButtons).toHaveLength(2)

      fireEvent.click(sessionButtons[1])

      await waitFor(() => {
        expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledTimes(2)
      })

      const summaryBeforeRefresh = container.querySelector('.v2-counseling-message-card__summary')?.textContent
      expect(summaryBeforeRefresh).toContain('调剂咨询')
      expect(container.querySelectorAll('.v2-counseling-thread .v2-chat-bubble-row')).toHaveLength(1)

      await act(async () => {
        await Promise.all(intervalCallbacks.map((callback) => callback()))
      })

      await waitFor(() => {
        expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(2)
        expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledTimes(3)
      })

      expect(container.querySelector('.v2-counseling-message-card__summary')?.textContent).toBe(summaryBeforeRefresh)
      expect(container.querySelectorAll('.v2-counseling-thread .v2-chat-bubble-row')).toHaveLength(2)
    } finally {
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    }
  })

  it('subscribes to the counseling stream and refreshes the active thread when an SSE update arrives', async () => {
    apiMocks.mentorApi.sentSessions
      .mockResolvedValueOnce({
        content: [
          {
            id: 51,
            mentorId: 21,
            studentId: 9,
            subject: '复试准备',
            mentorName: '林学姐',
            unreadCount: 1,
            createdAt: '2026-06-12T10:00:00',
          },
        ],
        totalElements: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 51,
            mentorId: 21,
            studentId: 9,
            subject: '复试准备',
            mentorName: '林学姐',
            unreadCount: 0,
            createdAt: '2026-06-12T10:05:00',
          },
        ],
        totalElements: 1,
        totalPages: 1,
      })

    apiMocks.mentorApi.sessionMessages
      .mockResolvedValueOnce([
        { id: 91, senderId: 51, senderName: '林学姐', content: '先整理复试材料。', createdAt: '2026-06-12T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 91, senderId: 51, senderName: '林学姐', content: '先整理复试材料。', createdAt: '2026-06-12T10:00:00' },
        { id: 92, senderId: 51, senderName: '林学姐', content: '刚刚补充了第二条建议。', createdAt: '2026-06-12T10:05:00' },
      ])

    const { container } = render(
      <MemoryRouter>
        <KaoyanMessagesPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(1)
      expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledTimes(1)
    })

    expect(apiMocks.mentorApi.counselingStreamUrl).toHaveBeenCalledWith('remote-token')
    expect(EventSourceMock.instances).toHaveLength(1)
    expect(EventSourceMock.instances[0].url).toBe('http://localhost/counseling-stream?token=remote-token')

    await act(async () => {
      EventSourceMock.instances[0].emit('counseling-update', { type: 'message', sessionId: 51 })
    })

    await waitFor(() => {
      expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(2)
      expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledTimes(2)
    })

    expect(container.querySelectorAll('.v2-counseling-thread .v2-chat-bubble-row')).toHaveLength(2)
  })

  it('does not render leaked received sessions inside the sent tab', async () => {
    apiMocks.mentorApi.sentSessions.mockResolvedValueOnce({
      content: [
        {
          id: 20,
          mentorId: 9,
          mentorName: '考研测试用户',
          studentId: 6,
          studentName: 'GD',
          unreadCount: 0,
          createdAt: '2026-06-15T16:59:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.mentorApi.sessionMessages.mockResolvedValueOnce([])

    const { container } = render(
      <MemoryRouter>
        <KaoyanMessagesPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(1)
    })

    expect(container.querySelectorAll('.v2-counseling-session-item')).toHaveLength(0)
    expect(apiMocks.mentorApi.sessionMessages).not.toHaveBeenCalled()
  })

  it('keeps the empty state stable instead of flashing during the first load and later refreshes', async () => {
    const intervalCallbacks = []
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation((callback) => {
      intervalCallbacks.push(callback)
      return 1
    })
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {})

    let resolveInitialSessions
    let resolveRefreshSessions

    apiMocks.mentorApi.sentSessions
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveInitialSessions = resolve
      }))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveRefreshSessions = resolve
      }))

    try {
      const { container } = render(
        <MemoryRouter>
          <KaoyanMessagesPage />
        </MemoryRouter>,
      )

      expect(container.querySelector('.v2-counseling-session-list .v2-counseling-empty-state')).toBeNull()

      resolveInitialSessions({ content: [], totalElements: 0, totalPages: 1 })

      await waitFor(() => {
        expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(1)
      })

      await waitFor(() => {
        expect(container.querySelector('.v2-counseling-session-list .v2-counseling-empty-state')).not.toBeNull()
      })

      await act(async () => {
        await Promise.all(intervalCallbacks.map((callback) => callback()))
      })

      expect(container.querySelector('.v2-counseling-session-list .v2-counseling-empty-state')).not.toBeNull()

      resolveRefreshSessions({ content: [], totalElements: 0, totalPages: 1 })

      await waitFor(() => {
        expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(2)
      })

      expect(container.querySelector('.v2-counseling-session-list .v2-counseling-empty-state')).not.toBeNull()
    } finally {
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    }
  })
})
