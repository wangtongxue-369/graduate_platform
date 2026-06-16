import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.jsx'
import AdminKaoyanOverviewPage from '@/pages/admin/AdminKaoyanOverviewPage.jsx'
import AdminKaoyanMaterialsPage from '@/pages/admin/AdminKaoyanMaterialsPage.jsx'
import AdminKaoyanSchoolsPage from '@/pages/admin/AdminKaoyanSchoolsPage.jsx'
import AdminKaoyanScoreLinesPage from '@/pages/admin/AdminKaoyanScoreLinesPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: '治理测试用户',
    role: 'admin',
    target: 'kaoyan',
  },
  token: 'remote-token',
  isAuthed: true,
  loading: false,
}))

const apiMocks = vi.hoisted(() => ({
  kaoyanApi: {
    schoolsPage: vi.fn(),
    scoreLinesPage: vi.fn(),
    favoriteScoreLine: vi.fn(),
    unfavoriteScoreLine: vi.fn(),
    favoriteScoreLines: vi.fn(),
  },
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
  materialApi: {
    listPage: vi.fn(),
    myMaterials: vi.fn(),
    detail: vi.fn(),
    downloadUrl: vi.fn(() => '#'),
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
  kaogongApi: {
    matchJobs: vi.fn(),
    scoreLinesPage: vi.fn(),
    calendarExamGroupsPage: vi.fn(),
    mySubscriptions: vi.fn(),
    notifications: vi.fn(),
    interviewRoomsPage: vi.fn(),
    interviewFeedbackPage: vi.fn(),
  },
  employmentApi: {
    resume: vi.fn(),
    recommendations: vi.fn(),
    applications: vi.fn(),
    fairs: vi.fn(),
    notifications: vi.fn(),
    preference: vi.fn(),
  },
  studyAbroadApi: {
    schoolProgramsPage: vi.fn(),
    admissionCasesPage: vi.fn(),
    applications: vi.fn(),
    timeline: vi.fn(),
    materials: vi.fn(),
  },
  userApi: {
    profile: vi.fn(),
  },
  adminMaterialApi: {
    pending: vi.fn(),
    listPage: vi.fn(),
    review: vi.fn(),
    delete: vi.fn(),
  },
  adminApi: {
    kaoyanSchools: vi.fn(),
    createKaoyanSchool: vi.fn(),
    updateKaoyanSchool: vi.fn(),
    deleteKaoyanSchool: vi.fn(),
    kaoyanScoreLines: vi.fn(),
    createKaoyanScoreLine: vi.fn(),
    updateKaoyanScoreLine: vi.fn(),
    deleteKaoyanScoreLine: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  ...apiMocks,
}))

function renderRoute(initialEntry, routePath, element) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('admin kaoyan split pages', () => {
  beforeEach(() => {
    authState.user = {
      id: 1,
      name: '治理测试用户',
      role: 'admin',
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

    apiMocks.adminMaterialApi.pending.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.adminMaterialApi.listPage.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.adminApi.kaoyanSchools.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.adminApi.kaoyanScoreLines.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
  })

  it('renders the admin materials route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/kaoyan/materials']}>
        <App />
      </MemoryRouter>,
    )

    await waitForElementToBeRemoved(
      () => screen.queryByRole('status', { name: 'app-loading' }),
      { timeout: 5000 },
    )

    expect(
      await screen.findByRole('heading', { name: '资料审核' }),
    ).toBeInTheDocument()
  })

  it('renders overview summary counts from backend data', async () => {
    apiMocks.adminMaterialApi.pending.mockResolvedValue({ content: [{ id: 1 }], totalElements: 12, totalPages: 2 })
    apiMocks.adminApi.kaoyanSchools.mockResolvedValue({ content: [{ id: 1, name: '浙江大学' }], totalElements: 36, totalPages: 5 })
    apiMocks.adminApi.kaoyanScoreLines.mockResolvedValue({ content: [{ id: 8, schoolName: '浙江大学', totalScoreLine: 390 }], totalElements: 148, totalPages: 15 })

    render(
      <MemoryRouter>
        <AdminKaoyanOverviewPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.adminMaterialApi.pending).toHaveBeenCalled()
      expect(apiMocks.adminApi.kaoyanSchools).toHaveBeenCalled()
      expect(apiMocks.adminApi.kaoyanScoreLines).toHaveBeenCalled()
    })
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('36')).toBeInTheDocument()
    expect(screen.getByText('148')).toBeInTheDocument()
  })

  it('renders materials queue tabs and cards', async () => {
    apiMocks.adminMaterialApi.pending.mockResolvedValue({
      content: [{ id: 11, title: '政治冲刺笔记', status: 'PENDING', school: '华东师范大学', major: '教育学', subject: '政治', attachments: [] }],
      totalElements: 1,
      totalPages: 1,
    })

    render(
      <MemoryRouter>
        <AdminKaoyanMaterialsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.adminMaterialApi.pending).toHaveBeenCalled()
    })
    expect(await screen.findByText('政治冲刺笔记')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '待审核' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument()
  })

  it('switches admin materials queues with pagination and review actions', async () => {
    apiMocks.adminMaterialApi.pending.mockResolvedValueOnce({
      content: [
        {
          id: 11,
          title: '政治冲刺笔记',
          status: 'PENDING',
          school: '华东师范大学',
          major: '教育学',
          subject: '政治',
          attachments: [{ id: 1, originalName: 'notes.pdf', fileSize: 1024 }],
        },
      ],
      totalElements: 12,
      totalPages: 2,
    })
    apiMocks.adminMaterialApi.pending.mockResolvedValueOnce({
      content: [
        {
          id: 21,
          title: '第二页待审资料',
          status: 'PENDING',
          school: '华东师范大学',
          major: '教育学',
          subject: '政治',
          attachments: [],
        },
      ],
      totalElements: 12,
      totalPages: 2,
    })
    apiMocks.adminMaterialApi.listPage
      .mockResolvedValueOnce({
        content: [
          {
            id: 31,
            title: '全部队列资料',
            status: 'PENDING',
            school: '华东师范大学',
            major: '教育学',
            subject: '政治',
            attachments: [],
          },
        ],
        totalElements: 20,
        totalPages: 3,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 41,
            title: '全部队列第二页',
            status: 'PENDING',
            school: '华东师范大学',
            major: '教育学',
            subject: '政治',
            attachments: [],
          },
        ],
        totalElements: 20,
        totalPages: 3,
      })
    apiMocks.adminMaterialApi.review.mockResolvedValue({})

    render(
      <MemoryRouter>
        <AdminKaoyanMaterialsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('政治冲刺笔记')).toBeInTheDocument()
    expect(screen.getByText('共 12 条')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(() => {
      expect(apiMocks.adminMaterialApi.pending).toHaveBeenCalledWith({ page: 1, size: 10 }, 'remote-token')
    })
    expect(await screen.findByText('第二页待审资料')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '全部' }))
    await waitFor(() => {
      expect(apiMocks.adminMaterialApi.listPage).toHaveBeenCalledWith({ page: 0, size: 10 }, 'remote-token')
    })
    expect(await screen.findByText('全部队列资料')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '通过' }))
    await waitFor(() => {
      expect(apiMocks.adminMaterialApi.review).toHaveBeenCalledWith(31, 'APPROVED', 'remote-token')
    })
  })

  it('renders school cards and filter controls', async () => {
    apiMocks.adminApi.kaoyanSchools.mockResolvedValue({
      content: [{ id: 1, name: '浙江大学', region: '华东', province: '浙江', is985: true, is211: true, schoolType: '综合' }],
      totalElements: 1,
      totalPages: 1,
    })

    render(
      <MemoryRouter>
        <AdminKaoyanSchoolsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(apiMocks.adminApi.kaoyanSchools).toHaveBeenCalled()
    })
    expect(await screen.findByText('浙江大学')).toBeInTheDocument()
    expect(screen.getAllByLabelText('院校名称').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '新增院校' })).toBeInTheDocument()
  })

  it('renders score lines while keeping school context', async () => {
    apiMocks.adminApi.kaoyanSchools.mockResolvedValue({
      content: [{ id: 1, name: '浙江大学' }],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.adminApi.kaoyanScoreLines.mockResolvedValue({
      content: [{ id: 9, schoolId: 1, schoolName: '浙江大学', year: 2025, majorCategory: '工学', majorName: '计算机科学与技术', totalScoreLine: 390 }],
      totalElements: 1,
      totalPages: 1,
    })

    renderRoute('/admin/kaoyan/score-lines', '/admin/kaoyan/score-lines', <AdminKaoyanScoreLinesPage />)

    await waitFor(() => {
      expect(apiMocks.adminApi.kaoyanSchools).toHaveBeenCalled()
      expect(apiMocks.adminApi.kaoyanScoreLines).toHaveBeenCalledWith({ schoolId: '1', page: 0, size: 12 }, 'remote-token')
    })
    expect(await screen.findAllByText('浙江大学')).toHaveLength(2)
    expect(screen.getByText('计算机科学与技术')).toBeInTheDocument()
  })
})
