import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.jsx'
import KaoyanOverviewPage from '@/pages/student/kaoyan/KaoyanOverviewPage.jsx'
import KaoyanSupportOverviewPage from '@/pages/student/kaoyan/KaoyanSupportOverviewPage.jsx'
import KaoyanMentorHallPage from '@/pages/student/kaoyan/KaoyanMentorHallPage.jsx'
import KaoyanMentorApplyPage from '@/pages/student/kaoyan/KaoyanMentorApplyPage.jsx'
import KaoyanMessagesPage from '@/pages/student/kaoyan/KaoyanMessagesPage.jsx'
import KaoyanStudyRoomsPage from '@/pages/student/kaoyan/KaoyanStudyRoomsPage.jsx'
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
        <Route path="/station/kaoyan/support/messages" element={<div>咨询消息占位</div>} />
        <Route path="/station/kaoyan/support/rooms/:roomId" element={<div>房间占位</div>} />
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

    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.mentorsPage.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.unreadCount.mockResolvedValue({ count: 0 })
    apiMocks.studyRoomApi.roomList.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.myProfile.mockResolvedValue(null)
    apiMocks.mentorApi.sentSessions.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.receivedSessions.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.mentorApi.markAsRead.mockResolvedValue(undefined)
    apiMocks.mentorApi.sendMessage.mockResolvedValue(undefined)
    apiMocks.studyRoomApi.roomDetail.mockResolvedValue({
      id: 7,
      name: '晨间背书房',
      schoolName: '华东师范大学',
      major: '教育学',
      memberCount: 18,
      members: [],
      isOwner: false,
    })
    apiMocks.studyRoomApi.messagesAfter.mockResolvedValue([])
    apiMocks.studyRoomApi.leaderboard.mockResolvedValue([])
    apiMocks.studyRoomApi.myCurrentRoom.mockResolvedValue(null)
    apiMocks.studyRoomApi.myCreatedRooms.mockResolvedValue([])
  })

  it('renders the mentor hall route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/station/kaoyan/support/mentors']}>
        <App />
      </MemoryRouter>,
    )

    await waitForElementToBeRemoved(
      () => screen.queryByRole('status', { name: 'app-loading' }),
      { timeout: 5000 },
    )

    expect(
      await screen.findByRole('heading', {
        name: '先筛选学长学姐，再决定查看资料、发起咨询还是申请入驻。',
      }),
    ).toBeInTheDocument()
  })

  it('shows 1v1咨询 and 同频自习室 as separate modules on the kaoyan overview page', () => {
    render(
      <MemoryRouter>
        <KaoyanOverviewPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /1v1咨询/ })).toHaveAttribute(
      'href',
      '/station/kaoyan/support/mentors',
    )
    expect(screen.getByRole('link', { name: /同频自习室/ })).toHaveAttribute(
      'href',
      '/station/kaoyan/support/rooms',
    )
  })

  it('keeps the legacy support route as a neutral split page instead of a primary module name', async () => {
    apiMocks.mentorApi.unreadCount.mockResolvedValue({ count: 3 })
    apiMocks.studyRoomApi.myCurrentRoom.mockResolvedValue({ id: 19, name: '政治晨读房' })
    apiMocks.studyRoomApi.myCreatedRooms.mockResolvedValue([{ id: 7, name: '晨间背书房' }])

    render(
      <MemoryRouter>
        <KaoyanSupportOverviewPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '进入 1v1咨询，或直接进入同频自习室。' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入 1v1咨询' })).toHaveAttribute(
      'href',
      '/station/kaoyan/support/mentors',
    )
    expect(screen.getByRole('link', { name: '进入同频自习室' })).toHaveAttribute(
      'href',
      '/station/kaoyan/support/rooms',
    )
    expect(screen.queryByText('陪跑协同')).not.toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('政治晨读房')).toBeInTheDocument()
  })

  it('keeps only filters in the sidebar and opens mentor details in a modal', async () => {
    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [{ id: 1, name: '华东师范大学' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.mentorApi.unreadCount.mockResolvedValue({ count: 2 })
    apiMocks.mentorApi.myProfile.mockResolvedValue({
      id: 88,
      nickname: '岸上学姐',
      graduateSchool: '复旦大学',
    })
    apiMocks.mentorApi.mentorsPage
      .mockResolvedValueOnce({
        content: [
          {
            id: 11,
            nickname: '林学姐',
            graduateSchool: '华东师范大学',
            enrollmentYear: '2024',
            major: '教育学',
            expertiseSubjects: '复试结构化',
            bio: '擅长复试和调剂规划',
          },
        ],
        totalElements: 12,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 11,
            nickname: '林学姐',
            graduateSchool: '华东师范大学',
            enrollmentYear: '2024',
            major: '教育学',
            expertiseSubjects: '复试结构化',
            bio: '擅长复试和调剂规划',
          },
        ],
        totalElements: 12,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 12,
            nickname: '周学长',
            graduateSchool: '华东师范大学',
            enrollmentYear: '2023',
            major: '教育学',
            expertiseSubjects: '英语复试',
            bio: '第二页结果',
          },
        ],
        totalElements: 12,
        totalPages: 2,
      })
    apiMocks.mentorApi.createSession.mockResolvedValue({ id: 501 })

    renderRoute('/station/kaoyan/support/mentors', '/station/kaoyan/support/mentors', <KaoyanMentorHallPage />)

    expect(await screen.findByText('林学姐')).toBeInTheDocument()
    expect(screen.queryByText('咨询对象速览')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.v2-side-column .v2-side-card')).toHaveLength(1)

    fireEvent.change(screen.getByLabelText('目标院校'), {
      target: { value: '华东师范大学' },
    })
    fireEvent.change(screen.getByLabelText('擅长科目'), {
      target: { value: '复试' },
    })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.mentorsPage).toHaveBeenLastCalledWith({
        graduateSchool: '华东师范大学',
        enrollmentYear: '',
        major: '',
        expertiseSubjects: '复试',
        page: 0,
        size: 10,
      })
    })
    expect(screen.getByText('共 12 位')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.mentorsPage).toHaveBeenLastCalledWith({
        graduateSchool: '华东师范大学',
        enrollmentYear: '',
        major: '',
        expertiseSubjects: '复试',
        page: 1,
        size: 10,
      })
    })
    expect(await screen.findByText('周学长')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看资料' }))

    const mentorDialog = await screen.findByRole('dialog', { name: '周学长资料' })
    expect(mentorDialog).toBeInTheDocument()
    expect(within(mentorDialog).getAllByText('英语复试').length).toBeGreaterThan(0)
    expect(within(mentorDialog).getByText('第二页结果')).toBeInTheDocument()

    fireEvent.click(within(mentorDialog).getByRole('button', { name: '发起咨询' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.createSession).toHaveBeenCalledWith({ mentorId: 12 }, 'remote-token')
    })
    expect(await screen.findByText('咨询消息占位')).toBeInTheDocument()
  })

  it('loads my mentor profile and keeps the apply form in the main workspace', async () => {
    apiMocks.mentorApi.myProfile.mockResolvedValue(null)

    render(
      <MemoryRouter>
        <KaoyanMentorApplyPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.mentorApi.myProfile).toHaveBeenCalledWith('remote-token')
    })
    expect(screen.getByRole('heading', { name: '完善入驻信息' })).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: /昵称/ })).toBeInTheDocument()
    expect(screen.getByText('展示给谁看')).toBeInTheDocument()
    expect(document.querySelector('.v2-main-column form')).not.toBeNull()
    expect(document.querySelector('.v2-side-column form')).toBeNull()
    expect(screen.getByRole('button', { name: '提交入驻申请' })).toBeInTheDocument()
  })

  it('renders sessions with pagination and sends messages in the active thread', async () => {
    apiMocks.mentorApi.sentSessions
      .mockResolvedValueOnce({
        content: [
          {
            id: 51,
            subject: '复试准备',
            mentorName: '林学姐',
            unreadCount: 1,
            createdAt: '2026-06-12T10:00:00',
          },
        ],
        totalElements: 11,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 61,
            subject: '调剂咨询',
            mentorName: '周学长',
            unreadCount: 0,
            createdAt: '2026-06-13T10:00:00',
          },
        ],
        totalElements: 11,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 61,
            subject: '调剂咨询',
            mentorName: '周学长',
            unreadCount: 0,
            createdAt: '2026-06-13T10:00:00',
          },
        ],
        totalElements: 11,
        totalPages: 2,
      })
    apiMocks.mentorApi.sessionMessages
      .mockResolvedValueOnce([
        { id: 91, senderName: '林学姐', content: '先把复试材料列出来。', createdAt: '2026-06-12T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 101, senderName: '周学长', content: '先确认调剂窗口。', createdAt: '2026-06-13T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 101, senderName: '周学长', content: '先确认调剂窗口。', createdAt: '2026-06-13T10:00:00' },
      ])

    render(
      <MemoryRouter>
        <KaoyanMessagesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('先把复试材料列出来。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.sentSessions).toHaveBeenLastCalledWith({ page: 1, size: 10 }, 'remote-token')
    })
    expect(await screen.findByText('调剂咨询')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('发送消息'), {
      target: { value: '收到，我先整理名单。' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送消息' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.sendMessage).toHaveBeenCalledWith(61, '收到，我先整理名单。', 'remote-token')
    })
  })

  it('supports room hall filters, current-room resume, and room creation', async () => {
    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [{ id: 1, name: '华东师范大学' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.studyRoomApi.myCurrentRoom.mockResolvedValue({
      id: 19,
      roomId: 19,
      name: '政治晨读房',
    })
    apiMocks.studyRoomApi.myCreatedRooms.mockResolvedValue([
      { id: 31, name: '教育学晚自习', schoolName: '华东师范大学', major: '教育学', createdAt: '2026-06-12T21:00:00' },
    ])
    apiMocks.studyRoomApi.roomList
      .mockResolvedValueOnce({
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
        totalElements: 15,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
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
        totalElements: 15,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 8,
            name: '晚间刷题房',
            schoolName: '华东师范大学',
            major: '教育学',
            memberCount: 12,
            createdByName: '小林',
            createdAt: '2026-06-12T20:00:00',
          },
        ],
        totalElements: 15,
        totalPages: 2,
      })
    apiMocks.studyRoomApi.createRoom.mockResolvedValue({ id: 41 })

    renderRoute('/station/kaoyan/support/rooms', '/station/kaoyan/support/rooms', <KaoyanStudyRoomsPage />)

    expect(await screen.findByText('晨间背书房')).toBeInTheDocument()
    expect(screen.getByText('政治晨读房')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('院校筛选'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('专业方向'), {
      target: { value: '教育学' },
    })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(apiMocks.studyRoomApi.roomList).toHaveBeenLastCalledWith({
        schoolId: '1',
        major: '教育学',
        page: 0,
        size: 10,
      })
    })
    expect(screen.getByText('共 15 间')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    await waitFor(() => {
      expect(apiMocks.studyRoomApi.roomList).toHaveBeenLastCalledWith({
        schoolId: '1',
        major: '教育学',
        page: 1,
        size: 10,
      })
    })
    expect(await screen.findByText('晚间刷题房')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('房间名称'), {
      target: { value: '新建冲刺房' },
    })
    fireEvent.change(screen.getByLabelText('创建院校'), {
      target: { value: '1' },
    })
    fireEvent.change(screen.getByLabelText('创建专业'), {
      target: { value: '教育学' },
    })
    fireEvent.click(screen.getByRole('button', { name: '创建并进入' }))

    await waitFor(() => {
      expect(apiMocks.studyRoomApi.createRoom).toHaveBeenCalledWith({
        name: '新建冲刺房',
        schoolId: 1,
        major: '教育学',
      }, 'remote-token')
    })
    expect(await screen.findByText('房间占位')).toBeInTheDocument()
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
