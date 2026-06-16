import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react'
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
    counselingStreamUrl: vi.fn(() => 'http://localhost/counseling-stream?token=remote-token'),
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
    apiMocks.mentorApi.counselingStreamUrl.mockReturnValue('http://localhost/counseling-stream?token=remote-token')
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
      await screen.findByRole('heading', { name: '1v1 咨询' }),
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

  it('drops the long lead sentence from the kaoyan overview page', () => {
    // The lead prop was removed; the long "把择校、计划、资料…" sentence
    // must not appear anywhere in the overview page tree.
    render(
      <MemoryRouter>
        <KaoyanOverviewPage />
      </MemoryRouter>,
    )
    expect(
      screen.queryByText(/把择校、计划、资料、1v1咨询和同频自习室收进一张考研推进台/),
    ).not.toBeInTheDocument()
  })

  it('renders the kaoyan overview title as 考研总览', () => {
    render(
      <MemoryRouter>
        <KaoyanOverviewPage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: '考研总览' }),
    ).toBeInTheDocument()
  })

  it('fetches real backend data on the kaoyan overview page when authed', async () => {
    // The page no longer relies on static preview data; it must call all
    // six backend endpoints in parallel and use the live result.
    authState.token = 'remote-token'
    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [{ id: 1, name: '清华大学', region: '北京' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaoyanApi.scoreLinesPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.studyPlanApi.myPlans.mockResolvedValue([
      { id: 1, name: '基础阶段', status: '进行中', description: '高数基础过一遍' },
    ])
    apiMocks.materialApi.listPage.mockResolvedValue({
      content: [{ id: 1, title: '高数真题', materialType: '真题', description: '近十年' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.mentorApi.mentorsPage.mockResolvedValue({
      content: [
        { id: 1, nickname: '李学姐', major: '计算机', expertiseSubjects: '数据结构' },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.studyRoomApi.roomList.mockResolvedValue({
      content: [
        { id: 1, name: '冲刺房', major: '计算机', memberCount: 12 },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    render(
      <MemoryRouter>
        <KaoyanOverviewPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.schoolsPage).toHaveBeenCalled()
      expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalled()
      expect(apiMocks.studyPlanApi.myPlans).toHaveBeenCalled()
      expect(apiMocks.materialApi.listPage).toHaveBeenCalled()
      expect(apiMocks.mentorApi.mentorsPage).toHaveBeenCalled()
      expect(apiMocks.studyRoomApi.roomList).toHaveBeenCalled()
    })

    // Live values should be rendered (real 清华大学 row, not the preview school).
    expect(await screen.findByText('清华大学')).toBeInTheDocument()
    expect(await screen.findByText('冲刺房')).toBeInTheDocument()
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

    expect(await screen.findByRole('heading', { name: '考研陪伴' })).toBeInTheDocument()
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

  it('hides my own mentor profile from the 1v1 mentor list', async () => {
    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [{ id: 1, name: '华东师范大学' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.mentorApi.myProfile.mockResolvedValue({
      id: 11,
      nickname: '我自己',
      graduateSchool: '华东师范大学',
      enrollmentYear: '2024',
      major: '教育学',
      expertiseSubjects: '复试',
    })
    apiMocks.mentorApi.mentorsPage.mockResolvedValue({
      content: [
        {
          id: 11,
          nickname: '我自己',
          graduateSchool: '华东师范大学',
          enrollmentYear: '2024',
          major: '教育学',
          expertiseSubjects: '复试',
          bio: '这是我自己的入驻档案',
        },
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
      totalElements: 2,
      totalPages: 1,
    })

    renderRoute('/station/kaoyan/support/mentors', '/station/kaoyan/support/mentors', <KaoyanMentorHallPage />)

    expect(await screen.findByText('周学长')).toBeInTheDocument()
    expect(screen.queryByText('我自己')).not.toBeInTheDocument()
    expect(screen.getByText('共 1 位')).toBeInTheDocument()
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

  it('renders a same-height counseling workbench with a session rail and chat thread', async () => {
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
        totalElements: 11,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
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
        totalElements: 11,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
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
    expect(document.querySelector('.v2-counseling-board.v2-counseling-workbench')).not.toBeNull()
    expect(document.querySelector('.v2-counseling-session-list')).not.toBeNull()
    expect(document.querySelector('.v2-counseling-thread')).not.toBeNull()
    expect(document.querySelector('.v2-counseling-composer')).not.toBeNull()
    expect(document.querySelectorAll('.v2-counseling-thread .v2-chat-bubble-row')).toHaveLength(1)
    expect(document.querySelectorAll('.v2-side-column .v2-side-card')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.sentSessions).toHaveBeenLastCalledWith({ page: 1, size: 10 }, 'remote-token')
    })
    expect((await screen.findAllByText('调剂咨询')).length).toBeGreaterThan(0)

    fireEvent.change(screen.getByLabelText('发送消息'), {
      target: { value: '收到，我先整理名单。' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送消息' }))

    await waitFor(() => {
      expect(apiMocks.mentorApi.sendMessage).toHaveBeenCalledWith(61, '收到，我先整理名单。', 'remote-token')
    })
  })

  it.skip('auto refreshes counseling sessions and the active thread without resetting the current selection', async () => {
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
            subject: '澶嶈瘯鍑嗗',
            mentorName: '鏋楀濮?',
            unreadCount: 1,
            createdAt: '2026-06-12T10:00:00',
          },
          {
            id: 61,
            subject: '璋冨墏鍜ㄨ',
            mentorName: '鍛ㄥ闀?',
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
            subject: '澶嶈瘯鍑嗗',
            mentorName: '鏋楀濮?',
            unreadCount: 0,
            createdAt: '2026-06-12T10:00:00',
          },
          {
            id: 61,
            subject: '璋冨墏鍜ㄨ',
            mentorName: '鍛ㄥ闀?',
            unreadCount: 1,
            createdAt: '2026-06-13T10:15:00',
          },
        ],
        totalElements: 2,
        totalPages: 1,
      })
    apiMocks.mentorApi.sessionMessages
      .mockResolvedValueOnce([
        { id: 91, senderName: '鏋楀濮?', content: '鍏堟妸澶嶈瘯鏉愭枡鍒楀嚭鏉ャ€?', createdAt: '2026-06-12T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 101, senderName: '鍛ㄥ闀?', content: '鍏堢‘璁よ皟鍓傜獥鍙ｃ€?', createdAt: '2026-06-13T10:00:00' },
      ])
      .mockResolvedValueOnce([
        { id: 101, senderName: '鍛ㄥ闀?', content: '鍏堢‘璁よ皟鍓傜獥鍙ｃ€?', createdAt: '2026-06-13T10:00:00' },
        { id: 102, senderName: '鍛ㄥ闀?', content: '宸茬粡鏇存柊鍒扮浜屾潯鍥炲銆?', createdAt: '2026-06-13T10:15:00' },
      ])

    try {
      render(
        <MemoryRouter>
          <KaoyanMessagesPage />
        </MemoryRouter>,
      )

      expect(await screen.findByText('鍏堟妸澶嶈瘯鏉愭枡鍒楀嚭鏉ァ€?')).toBeInTheDocument()

      const sessionList = document.querySelector('.v2-counseling-session-list')
      const secondSessionTrigger = within(sessionList).getByText('璋冨墏鍜ㄨ').closest('button')
      fireEvent.click(secondSessionTrigger)

      expect(await screen.findByText('鍏堢‘璁よ皟鍓傜獥鍙ｃ€?')).toBeInTheDocument()

      await act(async () => {
        await Promise.all(intervalCallbacks.map((callback) => callback()))
      })

      await waitFor(() => {
        expect(apiMocks.mentorApi.sentSessions).toHaveBeenCalledTimes(2)
        expect(apiMocks.mentorApi.sessionMessages).toHaveBeenCalledTimes(3)
      })

      expect(await screen.findByText('宸茬粡鏇存柊鍒扮浜屾潯鍥炲銆?')).toBeInTheDocument()
      expect(screen.getAllByText('璋冨墏鍜ㄨ').length).toBeGreaterThan(0)
    } finally {
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    }
  })

  it.skip('supports room hall filters, current-room resume, and room creation', async () => {
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

    fireEvent.change(screen.getByLabelText('目标院校'), {
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
    fireEvent.change(screen.getByLabelText('目标院校'), {
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
    expect(screen.getAllByText('考研测试用户').length).toBeGreaterThanOrEqual(1)
  })
})
