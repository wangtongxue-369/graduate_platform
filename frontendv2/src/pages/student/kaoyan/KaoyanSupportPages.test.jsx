import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.jsx'
import KaoyanSupportOverviewPage from '@/pages/student/kaoyan/KaoyanSupportOverviewPage.jsx'
import KaoyanMentorApplyPage from '@/pages/student/kaoyan/KaoyanMentorApplyPage.jsx'
import KaoyanMessagesPage from '@/pages/student/kaoyan/KaoyanMessagesPage.jsx'
import KaoyanStudyRoomPage from '@/pages/student/kaoyan/KaoyanStudyRoomPage.jsx'

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
    mentorsPage: vi.fn(),
    unreadCount: vi.fn(),
    myProfile: vi.fn(),
    saveProfile: vi.fn(),
    deleteProfile: vi.fn(),
    createSession: vi.fn(),
    sentSessions: vi.fn(),
    receivedSessions: vi.fn(),
    sessionMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
  studyRoomApi: {
    roomList: vi.fn(),
    createRoom: vi.fn(),
    roomDetail: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    messagesAfter: vi.fn(),
    sendMessage: vi.fn(),
    roomStreamUrl: vi.fn(() => 'http://localhost/stream'),
    leaderboard: vi.fn(),
    myCurrentRoom: vi.fn(),
    myCreatedRooms: vi.fn(),
    closeRoom: vi.fn(),
  },
  kaoyanApi: {
    schoolsPage: vi.fn(),
    scoreLinesPage: vi.fn(),
    favoriteScoreLine: vi.fn(),
    unfavoriteScoreLine: vi.fn(),
    favoriteScoreLines: vi.fn(),
  },
  studyPlanApi: {
    myPlans: vi.fn(),
    planDetail: vi.fn(),
    checkIns: vi.fn(),
    addCheckIn: vi.fn(),
    updateCheckIn: vi.fn(),
    deleteCheckIn: vi.fn(),
    createPlan: vi.fn(),
    updatePlan: vi.fn(),
    deletePlan: vi.fn(),
  },
  materialApi: {
    listPage: vi.fn(),
    myMaterials: vi.fn(),
    detail: vi.fn(),
    downloadUrl: vi.fn(() => '#'),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => apiMocks)

class EventSourceMock {
  addEventListener() {}

  close() {}
}

vi.stubGlobal('EventSource', EventSourceMock)

function renderRoute(initialEntry, routePath, element) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('kaoyan support split pages', () => {
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

    Object.values(apiMocks).forEach((group) => {
      Object.values(group).forEach((fn) => {
        if (typeof fn?.mockReset === 'function') fn.mockReset()
      })
    })

    apiMocks.mentorApi.mentorsPage.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.unreadCount.mockResolvedValue({ count: 0 })
    apiMocks.studyRoomApi.roomList.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.myProfile.mockResolvedValue(null)
    apiMocks.mentorApi.sentSessions.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.receivedSessions.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.markAsRead.mockResolvedValue(undefined)
    apiMocks.mentorApi.sendMessage.mockResolvedValue(undefined)
    apiMocks.studyRoomApi.roomDetail.mockResolvedValue({ id: 7, name: '晨间背书房', schoolName: '华东师范大学', major: '教育学', memberCount: 18, members: [], isOwner: false })
    apiMocks.studyRoomApi.messagesAfter.mockResolvedValue([])
    apiMocks.studyRoomApi.leaderboard.mockResolvedValue([])
    apiMocks.studyRoomApi.myCurrentRoom.mockResolvedValue(null)
    apiMocks.studyRoomApi.myCreatedRooms.mockResolvedValue([])
  })

  it('renders support deep route headings from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/station/kaoyan/support/messages']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '把发起中的咨询、收到的回复和继续追问放在一条连续消息流里。',
      }),
    ).toBeInTheDocument()
  })

  it('renders support overview with mentor and room data', async () => {
    apiMocks.mentorApi.mentorsPage.mockResolvedValue({
      content: [
        {
          id: 1,
          nickname: '林学姐',
          graduateSchool: '华东师范大学',
          major: '教育学',
          expertiseSubjects: '复试结构化',
          bio: '复试经验和调剂路径都可以聊。',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.studyRoomApi.roomList.mockResolvedValue({
      content: [
        {
          id: 7,
          name: '晨间背书房',
          schoolName: '华东师范大学',
          major: '教育学',
          memberCount: 18,
          createdByName: '阿周',
          createdAt: '2026-06-12T09:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    render(
      <MemoryRouter>
        <KaoyanSupportOverviewPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.mentorApi.mentorsPage).toHaveBeenCalled()
      expect(apiMocks.studyRoomApi.roomList).toHaveBeenCalled()
    })
    expect(await screen.findByText('林学姐')).toBeInTheDocument()
    expect(screen.getByText('晨间背书房')).toBeInTheDocument()
  })

  it('loads my mentor profile and shows the apply form', async () => {
    apiMocks.mentorApi.myProfile.mockResolvedValue(null)

    render(
      <MemoryRouter>
        <KaoyanMentorApplyPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.mentorApi.myProfile).toHaveBeenCalledWith('remote-token')
    })
    expect(await screen.findByLabelText('昵称')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交入驻申请' })).toBeInTheDocument()
  })

  it('renders sessions on the left and messages on the right', async () => {
    apiMocks.mentorApi.sentSessions.mockResolvedValue({
      content: [
        { id: 51, subject: '复试准备', mentorName: '林学姐', unreadCount: 1, createdAt: '2026-06-12T10:00:00' },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.mentorApi.sessionMessages.mockResolvedValue([
      { id: 91, senderName: '林学姐', content: '先把复试材料列出来。', createdAt: '2026-06-12T10:00:00' },
    ])

    render(
      <MemoryRouter>
        <KaoyanMessagesPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalled()
      expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledWith('51', 'remote-token')
    })
    expect(await screen.findAllByText('复试准备')).toHaveLength(2)
    expect(screen.getByText('先把复试材料列出来。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发送消息' })).toBeInTheDocument()
  })

  it('renders room detail, chat, and leaderboard data', async () => {
    apiMocks.studyRoomApi.roomDetail.mockResolvedValue({
      id: 7,
      name: '晨间背书房',
      schoolName: '华东师范大学',
      major: '教育学',
      memberCount: 18,
      members: [{ userId: 9, userName: '考研测试用户' }],
      isOwner: false,
    })
    apiMocks.studyRoomApi.messagesAfter.mockResolvedValue([
      { id: 1, senderName: '阿周', content: '开始今天的背书。', createdAt: '2026-06-12T09:05:00' },
    ])
    apiMocks.studyRoomApi.leaderboard.mockResolvedValue([
      { userId: 9, userName: '考研测试用户', durationSeconds: 5400 },
    ])

    renderRoute('/station/kaoyan/support/rooms/7', '/station/kaoyan/support/rooms/:roomId', <KaoyanStudyRoomPage />)

    await waitFor(() => {
      expect(apiMocks.studyRoomApi.roomDetail).toHaveBeenCalledWith('7', 'remote-token')
      expect(apiMocks.studyRoomApi.messagesAfter).toHaveBeenCalledWith('7', undefined, 'remote-token')
      expect(apiMocks.studyRoomApi.leaderboard).toHaveBeenCalledWith('7', 'all', 'remote-token')
    })
    expect(await screen.findByRole('heading', { name: '晨间背书房' })).toBeInTheDocument()
    expect(screen.getByText('开始今天的背书。')).toBeInTheDocument()
    expect(screen.getByText('考研测试用户')).toBeInTheDocument()
  })
})
