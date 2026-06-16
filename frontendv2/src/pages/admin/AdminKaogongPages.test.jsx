import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.jsx'
import AdminKaogongPage from '@/pages/admin/AdminKaogongPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: '治理测试用户',
    role: 'admin',
    target: 'kaogong',
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
    kaogongJobs: vi.fn(),
    createKaogongJob: vi.fn(),
    updateKaogongJob: vi.fn(),
    deleteKaogongJob: vi.fn(),
    kaogongScoreLines: vi.fn(),
    createKaogongScoreLine: vi.fn(),
    updateKaogongScoreLine: vi.fn(),
    deleteKaogongScoreLine: vi.fn(),
    kaogongCalendarEvents: vi.fn(),
    createKaogongCalendarEvent: vi.fn(),
    updateKaogongCalendarEvent: vi.fn(),
    deleteKaogongCalendarEvent: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  ...apiMocks,
}))

describe('admin kaogong workbench', () => {
  beforeEach(() => {
    authState.user = {
      id: 1,
      name: '治理测试用户',
      role: 'admin',
      target: 'kaogong',
    }
    authState.token = 'remote-token'
    authState.isAuthed = true
    authState.loading = false

    Object.values(apiMocks).forEach((group) => {
      Object.values(group).forEach((fn) => {
        if (typeof fn?.mockReset === 'function') fn.mockReset()
      })
    })

    apiMocks.adminApi.kaogongJobs.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.adminApi.kaogongScoreLines.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.adminApi.kaogongCalendarEvents.mockResolvedValue({ content: [], totalElements: 0, totalPages: 1 })
    apiMocks.adminApi.createKaogongJob.mockResolvedValue({ id: 99 })
    apiMocks.adminApi.updateKaogongJob.mockResolvedValue({ id: 11 })
    apiMocks.adminApi.deleteKaogongJob.mockResolvedValue({ id: 11, active: false })
    apiMocks.adminApi.createKaogongScoreLine.mockResolvedValue({ id: 88 })
    apiMocks.adminApi.updateKaogongScoreLine.mockResolvedValue({ id: 51 })
    apiMocks.adminApi.deleteKaogongScoreLine.mockResolvedValue({ id: 51, active: false })
    apiMocks.adminApi.createKaogongCalendarEvent.mockResolvedValue({ id: 77 })
    apiMocks.adminApi.updateKaogongCalendarEvent.mockResolvedValue({ id: 71 })
    apiMocks.adminApi.deleteKaogongCalendarEvent.mockResolvedValue({ id: 71, active: false })
  })

  it('renders the admin kaogong route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/kaogong']}>
        <App />
      </MemoryRouter>,
    )

    await waitForElementToBeRemoved(
      () => screen.queryByRole('status', { name: 'app-loading' }),
      { timeout: 5000 },
    )

    expect(
      await screen.findByRole('heading', {
        name: '把岗位台账、进面线索和考试节点收进同一张治理工位。',
      }),
    ).toBeInTheDocument()
  })

  it('loads job records and supports create, edit, and disable actions', async () => {
    apiMocks.adminApi.kaogongJobs.mockImplementation((params = {}) => {
      if (params.size === 1) {
        return Promise.resolve({ content: [{ id: 11 }], totalElements: 18, totalPages: 18 })
      }
      return Promise.resolve({
        content: [
          {
            id: 11,
            examType: '浙江省公务员考试',
            year: 2026,
            region: '杭州',
            jobName: '市直综合岗',
            recruitingUnit: '杭州市直单位',
            unitType: '市直机关',
            jobCategory: '综合管理',
            recruitCount: 3,
            educationRequirement: '本科',
            majorRequirement: '不限',
            registrationStart: '2026-02-01',
            registrationEnd: '2026-02-05',
            active: true,
          },
        ],
        totalElements: 18,
        totalPages: 3,
      })
    })
    apiMocks.adminApi.kaogongScoreLines.mockImplementation((params = {}) => (
      Promise.resolve({ content: [], totalElements: params.size === 1 ? 7 : 0, totalPages: 1 })
    ))
    apiMocks.adminApi.kaogongCalendarEvents.mockImplementation((params = {}) => (
      Promise.resolve({ content: [], totalElements: params.size === 1 ? 5 : 0, totalPages: 1 })
    ))

    render(
      <MemoryRouter>
        <AdminKaogongPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('市直综合岗')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('岗位名称'), { target: { value: '税务综合岗' } })
    fireEvent.change(screen.getByLabelText('招录单位'), { target: { value: '杭州市税务局' } })
    fireEvent.change(screen.getByLabelText('地区'), { target: { value: '杭州' } })
    fireEvent.change(screen.getByLabelText('考试类型'), { target: { value: '浙江省公务员考试' } })
    fireEvent.change(screen.getByLabelText('年份'), { target: { value: '2026' } })
    fireEvent.click(screen.getByRole('button', { name: '新增岗位记录' }))

    await waitFor(() => {
      expect(apiMocks.adminApi.createKaogongJob).toHaveBeenCalledWith(expect.objectContaining({
        jobName: '税务综合岗',
        recruitingUnit: '杭州市税务局',
        region: '杭州',
        examType: '浙江省公务员考试',
        year: '2026',
      }), 'remote-token')
    })

    fireEvent.click(screen.getByRole('button', { name: '编辑记录 11' }))
    fireEvent.change(screen.getByLabelText('岗位名称'), { target: { value: '市直综合岗（调整）' } })
    fireEvent.click(screen.getByRole('button', { name: '保存岗位修改' }))

    await waitFor(() => {
      expect(apiMocks.adminApi.updateKaogongJob).toHaveBeenCalledWith(11, expect.objectContaining({
        jobName: '市直综合岗（调整）',
      }), 'remote-token')
    })

    fireEvent.click(screen.getByRole('button', { name: '停用记录 11' }))
    await waitFor(() => {
      expect(apiMocks.adminApi.deleteKaogongJob).toHaveBeenCalledWith(11, 'remote-token')
    })
  })

  it('switches to score lines and calendar nodes with dedicated CRUD controls', async () => {
    apiMocks.adminApi.kaogongJobs.mockImplementation((params = {}) => (
      Promise.resolve({ content: [], totalElements: params.size === 1 ? 0 : 0, totalPages: 1 })
    ))
    apiMocks.adminApi.kaogongScoreLines.mockImplementation((params = {}) => {
      if (params.size === 1) {
        return Promise.resolve({ content: [{ id: 51 }], totalElements: 9, totalPages: 9 })
      }
      return Promise.resolve({
        content: [
          {
            id: 51,
            region: '杭州',
            year: 2025,
            examType: '浙江省公务员考试',
            unitType: '市直机关',
            jobCategory: '综合管理',
            jobName: '杭州综合岗',
            recruitingUnit: '杭州市直单位',
            scoreLine: 128.5,
            interviewRatio: '3:1',
            recruitCount: 4,
            interviewCount: 12,
            active: true,
          },
        ],
        totalElements: 9,
        totalPages: 2,
      })
    })
    apiMocks.adminApi.kaogongCalendarEvents.mockImplementation((params = {}) => {
      if (params.size === 1) {
        return Promise.resolve({ content: [{ id: 71 }], totalElements: 6, totalPages: 6 })
      }
      return Promise.resolve({
        content: [
          {
            id: 71,
            region: '浙江',
            examType: '浙江省公务员考试',
            year: 2026,
            nodeType: '报名',
            title: '报名开始',
            eventDate: '2026-02-03',
            description: '开放系统报名',
            active: true,
          },
        ],
        totalElements: 6,
        totalPages: 1,
      })
    })

    render(
      <MemoryRouter>
        <AdminKaogongPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '分数线看板' }))
    expect(await screen.findByText('杭州综合岗')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('岗位名称'), { target: { value: '宁波综合岗' } })
    fireEvent.change(screen.getByLabelText('招录单位'), { target: { value: '宁波市直单位' } })
    fireEvent.change(screen.getByLabelText('地区'), { target: { value: '宁波' } })
    fireEvent.change(screen.getByLabelText('进面分数线'), { target: { value: '129.5' } })
    fireEvent.click(screen.getByRole('button', { name: '新增分数线记录' }))

    await waitFor(() => {
      expect(apiMocks.adminApi.createKaogongScoreLine).toHaveBeenCalledWith(expect.objectContaining({
        jobName: '宁波综合岗',
        recruitingUnit: '宁波市直单位',
        region: '宁波',
        scoreLine: '129.5',
      }), 'remote-token')
    })

    fireEvent.click(screen.getByRole('button', { name: '考试节点' }))
    expect(await screen.findByText('报名开始')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '编辑记录 71' }))
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '报名入口开放' } })
    fireEvent.click(screen.getByRole('button', { name: '保存节点修改' }))

    await waitFor(() => {
      expect(apiMocks.adminApi.updateKaogongCalendarEvent).toHaveBeenCalledWith(71, expect.objectContaining({
        title: '报名入口开放',
      }), 'remote-token')
    })

    fireEvent.click(screen.getByRole('button', { name: '停用记录 71' }))
    await waitFor(() => {
      expect(apiMocks.adminApi.deleteKaogongCalendarEvent).toHaveBeenCalledWith(71, 'remote-token')
    })
  })
})
