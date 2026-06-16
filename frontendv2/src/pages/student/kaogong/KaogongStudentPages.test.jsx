import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaogongOverviewPage from '@/pages/student/kaogong/KaogongOverviewPage.jsx'
import {
  KaogongCalendarPage,
  KaogongInterviewsPage,
  KaogongInterviewRoomPage,
  KaogongJobsPage,
  KaogongScoreLinesPage,
} from '@/pages/student/kaogong/KaogongStationPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: '考公测试用户',
    role: 'user',
    target: 'kaogong',
  },
  token: 'remote-token',
}))

const apiMocks = vi.hoisted(() => ({
  kaogongApi: {
    favoriteJobs: vi.fn(),
    favoriteScoreLines: vi.fn(),
    mySubscriptions: vi.fn(),
    calendarExamGroupsPage: vi.fn(),
    myInterviewRooms: vi.fn(),
    interviewMessagesPage: vi.fn(),
    matchJobs: vi.fn(),
    favoriteJob: vi.fn(),
    unfavoriteJob: vi.fn(),
    jobMatchHistory: vi.fn(),
    scoreLinesPage: vi.fn(),
    favoriteScoreLine: vi.fn(),
    unfavoriteScoreLine: vi.fn(),
    notifications: vi.fn(),
    subscribeCalendar: vi.fn(),
    cancelSubscription: vi.fn(),
    interviewRoomsPage: vi.fn(),
    createInterviewRoom: vi.fn(),
    joinInterviewRoom: vi.fn(),
    interviewRooms: vi.fn(),
    interviewAttachmentsPage: vi.fn(),
    interviewFeedbackPage: vi.fn(),
    sendInterviewMessage: vi.fn(),
    uploadInterviewAttachment: vi.fn(),
    downloadInterviewAttachment: vi.fn(),
    addInterviewFeedback: vi.fn(),
    updateInterviewRoomStatus: vi.fn(),
    interviewRoomStreamUrl: vi.fn(() => 'http://localhost/kaogong-room-stream'),
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

function renderPage(node) {
  return render(
    <MemoryRouter>
      {node}
    </MemoryRouter>,
  )
}

describe('kaogong student split pages', () => {
  beforeEach(() => {
    authState.user = {
      id: 9,
      name: '考公测试用户',
      role: 'user',
      target: 'kaogong',
    }
    authState.token = 'remote-token'

    Object.values(apiMocks).forEach((group) => {
      Object.values(group).forEach((fn) => {
        if (typeof fn?.mockReset === 'function') fn.mockReset()
      })
    })

    apiMocks.kaogongApi.favoriteJobs.mockResolvedValue([])
    apiMocks.kaogongApi.favoriteScoreLines.mockResolvedValue([])
    apiMocks.kaogongApi.mySubscriptions.mockResolvedValue([])
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.myInterviewRooms.mockResolvedValue([])
    apiMocks.kaogongApi.interviewMessagesPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.matchJobs.mockResolvedValue([])
    apiMocks.kaogongApi.jobMatchHistory.mockResolvedValue([])
    apiMocks.kaogongApi.scoreLinesPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.notifications.mockResolvedValue([])
    apiMocks.kaogongApi.interviewRoomsPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.interviewRooms.mockResolvedValue([])
    apiMocks.kaogongApi.interviewAttachmentsPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.interviewFeedbackPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.sendInterviewMessage.mockResolvedValue(undefined)
    apiMocks.kaogongApi.uploadInterviewAttachment.mockResolvedValue(undefined)
    apiMocks.kaogongApi.addInterviewFeedback.mockResolvedValue(undefined)
    apiMocks.kaogongApi.updateInterviewRoomStatus.mockResolvedValue({ id: 7, status: 'COMPLETED' })
  })

  it('renders countdown, favorites, and my room state from backend data', async () => {
    apiMocks.kaogongApi.favoriteJobs.mockResolvedValue([
      { id: 1, jobName: '市直综合岗', region: '杭州', recruitingUnit: '杭州市直单位' },
    ])
    apiMocks.kaogongApi.favoriteScoreLines.mockResolvedValue([
      { id: 11, jobName: '杭州综合岗', year: 2025, scoreLine: 128.5, region: '杭州' },
    ])
    apiMocks.kaogongApi.mySubscriptions.mockResolvedValue([
      { id: 91, region: '浙江', examType: '浙江省公务员考试', examYear: '2026', status: 'ACTIVE' },
    ])
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'zj::exam::2026',
          region: '浙江',
          examType: '浙江省公务员考试',
          year: '2026',
          events: [
            { id: 1, nodeType: '报名', title: '报名开始', eventDate: '2026-02-03' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.myInterviewRooms.mockResolvedValue([
      { id: 7, title: '结构化一组', status: 'OPEN', participantCount: 6 },
    ])
    apiMocks.kaogongApi.interviewMessagesPage.mockResolvedValue({
      content: [
        { id: 301, senderName: '同伴A', content: '今晚 20:00 继续', createdAt: '2026-06-15T20:00:00' },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaogongOverviewPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.favoriteJobs).toHaveBeenCalledWith('remote-token')
      expect(apiMocks.kaogongApi.favoriteScoreLines).toHaveBeenCalledWith('remote-token')
    })

    expect(await screen.findAllByText('结构化一组')).not.toHaveLength(0)
    expect(screen.getAllByText('市直综合岗').length).toBeGreaterThan(0)
    expect(screen.getAllByText('杭州综合岗').length).toBeGreaterThan(0)
    const actionGrid = screen.getByLabelText('考公主流程入口')
    expect(within(actionGrid).getByText(/报名 · 2026-02-03 · 浙江/)).toBeInTheDocument()
    expect(within(actionGrid).getByText('已订阅 1 场考试')).toBeInTheDocument()
  })

  it('shows a past-due status instead of a negative countdown when subscribed nodes are already over', async () => {
    apiMocks.kaogongApi.mySubscriptions.mockResolvedValue([
      { id: 92, region: '浙江', examType: '浙江省公务员考试', examYear: '2020', status: 'ACTIVE' },
    ])
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'zj::exam::2020',
          region: '浙江',
          examType: '浙江省公务员考试',
          year: '2020',
          events: [
            { id: 1, nodeType: '报名', title: '报名开始', eventDate: '2020-02-03' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaogongOverviewPage />)

    const actionGrid = await screen.findByLabelText('考公主流程入口')
    expect(within(actionGrid).getByText(/报名 · 2020-02-03 · 浙江/)).toBeInTheDocument()
    expect(within(actionGrid).queryByText(/还有 -/)).not.toBeInTheDocument()
    expect(within(actionGrid).getAllByText(/已过 \d+ 天/).length).toBeGreaterThan(0)
  })

  it('starts the job filter controller with blank fields before the user fills a profile', async () => {
    renderPage(<KaogongJobsPage />)

    expect(screen.getByLabelText('学历')).toHaveValue('')
    expect(screen.getByLabelText('学位')).toHaveValue('')
    expect(screen.getByLabelText('专业')).toHaveValue('')
    expect(screen.getByLabelText('地区偏好')).toHaveValue('')
    expect(screen.getByLabelText('户籍/生源地')).toHaveValue('')
    expect(screen.getByLabelText('政治面貌')).toHaveValue('')
    expect(screen.getByLabelText('岗位类别')).toHaveValue('')
    expect(screen.getByLabelText('单位类型')).toHaveValue('')

    expect(screen.getByLabelText('学历').tagName).toBe('SELECT')
    expect(screen.getByLabelText('学位').tagName).toBe('SELECT')
    expect(screen.getByLabelText('政治面貌').tagName).toBe('SELECT')
    expect(screen.getByLabelText('岗位类别').tagName).toBe('SELECT')
    expect(screen.getByLabelText('单位类型').tagName).toBe('SELECT')

    expect(screen.getByRole('option', { name: '专业技术' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '中央机关直属机构' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '共青团员' })).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.kaogongApi.matchJobs).toHaveBeenCalledWith(expect.objectContaining({
        education: '',
        degree: '',
        major: '',
        region: '',
        household: '',
        politicalStatus: '',
        jobCategory: '',
        unitType: '',
      }), 'remote-token')
    })
  })

  it('submits the legacy matching payload when the redesigned filter controller is applied', async () => {
    renderPage(<KaogongJobsPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.matchJobs).toHaveBeenCalledTimes(1)
    })

    fireEvent.change(screen.getByLabelText('学历'), { target: { value: '本科' } })
    fireEvent.change(screen.getByLabelText('学位'), { target: { value: '学士' } })
    fireEvent.change(screen.getByLabelText('专业'), { target: { value: '计算机科学' } })
    fireEvent.change(screen.getByLabelText('地区偏好'), { target: { value: '北京' } })
    fireEvent.change(screen.getByLabelText('户籍/生源地'), { target: { value: '上海生源' } })
    fireEvent.change(screen.getByLabelText('政治面貌'), { target: { value: '中共党员' } })
    fireEvent.change(screen.getByLabelText('岗位类别'), { target: { value: '专业技术' } })
    fireEvent.change(screen.getByLabelText('单位类型'), { target: { value: '中央机关直属机构' } })

    fireEvent.click(screen.getByRole('button', { name: '应用筛选' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.matchJobs).toHaveBeenLastCalledWith({
        education: '本科',
        degree: '学士',
        major: '计算机科学',
        region: '北京',
        household: '上海生源',
        politicalStatus: '中共党员',
        jobCategory: '专业技术',
        unitType: '中央机关直属机构',
      }, 'remote-token')
    })
  })

  it('keeps the job refresh state inside the apply button', async () => {
    renderPage(<KaogongJobsPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.matchJobs).toHaveBeenCalledTimes(1)
    })

    let resolveMatch
    apiMocks.kaogongApi.matchJobs.mockImplementationOnce(() => new Promise((resolve) => {
      resolveMatch = resolve
    }))

    fireEvent.change(screen.getByLabelText('学历'), { target: { value: '硕士' } })
    fireEvent.click(screen.getByRole('button', { name: '应用筛选' }))

    expect(await screen.findByRole('button', { name: '筛选中…' })).toBeDisabled()
    expect(screen.queryByText('正在刷新岗位匹配结果…')).not.toBeInTheDocument()

    resolveMatch([])
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '应用筛选' })).toBeEnabled()
    })
  })

  it('shows household requirements in job result rows', async () => {
    apiMocks.kaogongApi.matchJobs.mockResolvedValue([
      {
        id: 61,
        jobName: '上海生源数据治理岗',
        recruitingUnit: '上海市数据服务中心',
        region: '上海',
        examType: '上海市公务员考试',
        recruitCount: 1,
        educationRequirement: '本科及以上',
        majorRequirement: '计算机科学',
        householdRequirement: '上海生源',
        matchScore: 88,
        matchReasons: ['户籍/生源地符合'],
        registrationStart: '2026-05-01',
        registrationEnd: '2026-05-10',
      },
    ])

    renderPage(<KaogongJobsPage />)

    await waitFor(() => {
      expect(screen.getByText('户籍/生源地：上海生源')).toBeInTheDocument()
    })
  })

  it('supports job favorites and match history in the jobs workspace', async () => {
    apiMocks.kaogongApi.matchJobs.mockResolvedValue([
      {
        id: 21,
        jobName: '税务综合岗',
        recruitingUnit: '杭州市税务局',
        region: '杭州',
        examType: '浙江省公务员考试',
        recruitCount: 4,
        educationRequirement: '本科',
        majorRequirement: '计算机类',
        matchScore: 92,
        matchReasons: ['地区偏好匹配', '专业方向匹配'],
        registrationStart: '2026-02-03',
        registrationEnd: '2026-02-08',
        sourceUrl: 'https://example.com/jobs/21',
      },
    ])
    apiMocks.kaogongApi.favoriteJobs
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 21, jobName: '税务综合岗', region: '杭州' }])
    apiMocks.kaogongApi.jobMatchHistory.mockResolvedValue([
      { id: 1, resultCount: 6, createdAt: '2026-06-15T10:00:00' },
    ])

    renderPage(<KaogongJobsPage />)

    expect(await screen.findByText('税务综合岗')).toBeInTheDocument()
    expect(screen.getByText('最近一次匹配到 6 个岗位。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '收藏岗位' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.favoriteJob).toHaveBeenCalledWith(21, 'remote-token')
    })
  })

  it('shows only the current match result summary instead of rendering the full history list', async () => {
    apiMocks.kaogongApi.matchJobs.mockResolvedValue([
      {
        id: 31,
        jobName: '综合管理岗',
        recruitingUnit: '北京市直单位',
        region: '北京',
        examType: '北京市公务员考试',
        recruitCount: 2,
        educationRequirement: '本科',
        majorRequirement: '不限',
        matchScore: 88,
        matchReasons: ['地区偏好匹配'],
        registrationStart: '2026-02-03',
        registrationEnd: '2026-02-08',
        sourceUrl: '',
      },
    ])
    apiMocks.kaogongApi.jobMatchHistory.mockResolvedValue([
      { id: 10, resultCount: 13, createdAt: '2026-06-16T10:55:00' },
      { id: 9, resultCount: 13, createdAt: '2026-06-16T10:54:00' },
      { id: 8, resultCount: 13, createdAt: '2026-06-16T10:49:00' },
    ])

    renderPage(<KaogongJobsPage />)

    expect(await screen.findByText('综合管理岗')).toBeInTheDocument()
    expect(screen.getByText('最近一次匹配到 13 个岗位。')).toBeInTheDocument()
    expect(screen.queryByText('3 次')).not.toBeInTheDocument()
    expect(screen.queryByText('匹配到 13 个岗位')).not.toBeInTheDocument()
    expect(screen.queryByText('2026-06-16 10:55')).not.toBeInTheDocument()
    expect(screen.queryByText('2026-06-16 10:54')).not.toBeInTheDocument()
    expect(screen.queryByText('2026-06-16 10:49')).not.toBeInTheDocument()
  })

  it('opens favorite jobs in a modal instead of rendering the collection list inline', async () => {
    apiMocks.kaogongApi.matchJobs.mockResolvedValue([])
    apiMocks.kaogongApi.favoriteJobs.mockResolvedValue([
      {
        id: 101,
        jobName: '收藏测试岗A',
        recruitingUnit: '国家税务总局北京市税务局',
        region: '北京',
        examType: '国家公务员考试',
        recruitCount: 3,
        educationRequirement: '本科及以上',
        degreeRequirement: '学士及以上',
        majorRequirement: '计算机科学',
        householdRequirement: '不限',
        registrationEnd: '2026-05-22',
        sourceUrl: 'https://example.com/job/101',
      },
      {
        id: 102,
        jobName: '收藏测试岗B',
        recruitingUnit: '上海市某区政务服务中心',
        region: '上海',
        examType: '上海市公务员考试',
        recruitCount: 2,
        educationRequirement: '硕士及以上',
        degreeRequirement: '硕士及以上',
        majorRequirement: '法学',
        householdRequirement: '上海生源',
      },
    ])

    renderPage(<KaogongJobsPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.favoriteJobs).toHaveBeenCalledWith('remote-token')
    })

    expect(screen.queryByText('先写刚性门槛，再补充偏好，让右侧像一块决策板，而不是一条长表单。')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看收藏岗位' })).toBeInTheDocument()
    expect(screen.queryByText('收藏测试岗A')).not.toBeInTheDocument()
    expect(screen.queryByText('收藏测试岗B')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看收藏岗位' }))

    expect(await screen.findByRole('dialog', { name: '收藏岗位' })).toBeInTheDocument()
    expect(screen.getByText('收藏测试岗A')).toBeInTheDocument()
    expect(screen.getByText('收藏测试岗B')).toBeInTheDocument()
    expect(screen.getByText('国家税务总局北京市税务局')).toBeInTheDocument()
    expect(screen.getByText('国家公务员考试 / 招录 3 人')).toBeInTheDocument()
    expect(screen.getByText('本科及以上 / 学士及以上')).toBeInTheDocument()
    expect(screen.getByText('户籍/生源地：不限')).toBeInTheDocument()
    expect(screen.getByText('报名截止 2026-05-22')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看来源' })).toHaveAttribute('href', 'https://example.com/job/101')

    fireEvent.click(screen.getByRole('button', { name: '关闭收藏岗位弹窗' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '收藏岗位' })).not.toBeInTheDocument()
    })
  })

  it('allows users to unfavorite a job from the favorite modal', async () => {
    apiMocks.kaogongApi.matchJobs.mockResolvedValue([])
    apiMocks.kaogongApi.favoriteJobs
      .mockResolvedValueOnce([
        {
          id: 101,
          jobName: '收藏测试岗A',
          recruitingUnit: '国家税务总局北京市税务局',
          region: '北京',
          educationRequirement: '本科及以上',
          degreeRequirement: '学士及以上',
        },
      ])
      .mockResolvedValueOnce([])

    renderPage(<KaogongJobsPage />)

    fireEvent.click(await screen.findByRole('button', { name: '查看收藏岗位' }))
    fireEvent.click(await screen.findByRole('button', { name: '取消收藏岗位 收藏测试岗A' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.unfavoriteJob).toHaveBeenCalledWith(101, 'remote-token')
    })
    expect(screen.queryByText('收藏测试岗A')).not.toBeInTheDocument()
  })

  it('supports score-line favorites in the ledger workspace', async () => {
    apiMocks.kaogongApi.scoreLinesPage.mockResolvedValue({
      content: [
        {
          id: 51,
          jobName: '杭州综合岗',
          recruitingUnit: '杭州市直单位',
          region: '杭州',
          year: 2025,
          examType: '浙江省公务员考试',
          scoreLine: 128.5,
          interviewRatio: '3:1',
          recruitCount: 4,
          interviewCount: 12,
          source: '官方公告',
          dataNote: '近三年稳定在 128 左右',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.favoriteScoreLines
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 51, jobName: '杭州综合岗', year: 2025, scoreLine: 128.5 }])

    renderPage(<KaogongScoreLinesPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.scoreLinesPage).toHaveBeenCalled()
    })
    expect(screen.getAllByText('杭州综合岗').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: '收藏分数线' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.favoriteScoreLine).toHaveBeenCalledWith(51, 'remote-token')
    })
  })

  it('matches the legacy score-line filter controls and hides the remote-connected notice', async () => {
    apiMocks.kaogongApi.scoreLinesPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })

    renderPage(<KaogongScoreLinesPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.scoreLinesPage).toHaveBeenCalled()
    })

    expect(screen.getByLabelText('地区')).toHaveAttribute('placeholder', '如：北京/上海/江苏')
    expect(screen.getByLabelText('年份')).toHaveAttribute('placeholder', '如：2026')

    expect(screen.getByLabelText('岗位类别').tagName).toBe('SELECT')
    expect(screen.getByLabelText('单位类型').tagName).toBe('SELECT')
    expect(screen.getByLabelText('考试类别').tagName).toBe('SELECT')

    expect(screen.getByRole('option', { name: '专业技术' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '中央机关直属机构' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '国家公务员考试' })).toBeInTheDocument()

    expect(screen.queryByText('分数线账本：已连接后端')).not.toBeInTheDocument()
  })

  it('opens favorite score lines in a modal instead of stacking the list in the sidebar', async () => {
    apiMocks.kaogongApi.scoreLinesPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })
    apiMocks.kaogongApi.favoriteScoreLines.mockResolvedValue([
      { id: 61, jobName: '信息化岗02', region: '北京', year: 2026, scoreLine: 133.2 },
      { id: 62, jobName: '综合管理岗', region: '上海', year: 2025, scoreLine: 128.6 },
    ])

    renderPage(<KaogongScoreLinesPage />)

    await waitFor(() => {
      expect(apiMocks.kaogongApi.favoriteScoreLines).toHaveBeenCalledWith('remote-token')
    })

    expect(screen.getByRole('button', { name: '查看收藏分数线' })).toBeInTheDocument()
    expect(screen.queryByText('信息化岗02')).not.toBeInTheDocument()
    expect(screen.queryByText('综合管理岗')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看收藏分数线' }))

    expect(await screen.findByRole('dialog', { name: '收藏分数线' })).toBeInTheDocument()
    expect(screen.getByText('信息化岗02')).toBeInTheDocument()
    expect(screen.getByText('综合管理岗')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '关闭收藏分数线弹窗' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '收藏分数线' })).not.toBeInTheDocument()
    })
  })

  it('matches the legacy calendar filter controls and hides the remote-connected notice', async () => {
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 1,
    })

    renderPage(<KaogongCalendarPage />)
/*

    await waitFor(() => {
      expect(apiMocks.kaogongApi.calendarExamGroupsPage).toHaveBeenCalled()
    })

    expect(screen.getByLabelText('地区')).toHaveAttribute('placeholder', '如：北京/上海')
    expect(screen.getByLabelText('年份')).toHaveAttribute('placeholder', '可选，如：2027')
    expect(screen.getByLabelText('考试类型').tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: '国家公务员考试' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '上海市公务员考试' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '事业单位考试' })).toBeInTheDocument()
    expect(screen.queryByText('考试日历：已连接后端')).not.toBeInTheDocument()
  })

  it('surfaces the nearest upcoming exam node in the calendar spotlight', async () => {
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'bj::national::2027',
          region: '北京',
          examType: '国家公务员考试',
          year: '2027',
          events: [
            { id: 1, nodeType: '报名开始', title: '2027 国考北京考区：报名开始', eventDate: '2099-02-03' },
            { id: 2, nodeType: '笔试', title: '2027 国考北京考区：笔试', eventDate: '2099-03-12' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaogongCalendarPage />)

    const spotlight = await screen.findByLabelText('当前最近节点')
    expect(within(spotlight).getByText('报名开始')).toBeInTheDocument()
    expect(within(spotlight).getByText('2027 国考北京考区：报名开始')).toBeInTheDocument()
    expect(within(spotlight).getByText('国家公务员考试')).toBeInTheDocument()
    expect(within(spotlight).getByText('北京 / 2027')).toBeInTheDocument()
  })

  it('renders each exam group as a flow card with an ordered timeline', async () => {
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'bj::national::2027',
          region: '鍖椾含',
          examType: '鍥藉鍏姟鍛樿€冭瘯',
          year: '2027',
          events: [
            { id: 1, nodeType: '鍏憡鍙戝竷', title: '2027 鍥藉鍏姟鍛樿€冭瘯鍖椾含鑰冨尯锛氬叕鍛婂彂甯?', eventDate: '2099-05-13' },
            { id: 2, nodeType: '鎶ュ悕寮€濮?', title: '2027 鍥藉鍏姟鍛樿€冭瘯鍖椾含鑰冨尯锛氭姤鍚嶅紑濮?', eventDate: '2099-05-18' },
            { id: 3, nodeType: '绗旇瘯', title: '2027 鍥藉鍏姟鍛樿€冭瘯鍖椾含鑰冨尯锛氱瑪璇?', eventDate: '2099-06-12' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaogongCalendarPage />)

    const flowCard = await screen.findByLabelText('鍥藉鍏姟鍛樿€冭瘯 鑰冭瘯娴佺▼')
    expect(within(flowCard).getByText('涓嬩竴鑺傜偣')).toBeInTheDocument()

    const timeline = within(flowCard).getByRole('list', { name: '鍥藉鍏姟鍛樿€冭瘯 鏃堕棿绾? })
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(3)
    expect(within(timeline).getByText('鍏憡鍙戝竷')).toBeInTheDocument()
    expect(within(timeline).getByText('鎶ュ悕寮€濮?)).toBeInTheDocument()
    expect(within(timeline).getByText('绗旇瘯')).toBeInTheDocument()
  })

*/
    await waitFor(() => {
      expect(apiMocks.kaogongApi.calendarExamGroupsPage).toHaveBeenCalled()
    })

    expect(screen.getByLabelText('地区')).toHaveAttribute('placeholder', '如：北京/上海')
    expect(screen.getByLabelText('年份')).toHaveAttribute('placeholder', '可选，如：2027')
    expect(screen.getByLabelText('考试类型').tagName).toBe('SELECT')
    expect(screen.getByRole('option', { name: '国家公务员考试' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '上海市公务员考试' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '事业单位考试' })).toBeInTheDocument()
    expect(screen.queryByText('考试日历：已连接后端')).not.toBeInTheDocument()
  })

  it('renders each exam group as a flow card with an ordered timeline', async () => {
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'bj::national::2027',
          region: '北京',
          examType: '国家公务员考试',
          year: '2027',
          events: [
            { id: 1, nodeType: '公告发布', title: '2027 国考北京考区：公告发布', eventDate: '2099-05-13' },
            { id: 2, nodeType: '报名开始', title: '2027 国考北京考区：报名开始', eventDate: '2099-05-18' },
            { id: 3, nodeType: '成绩公布', title: '2027 国考北京考区：成绩公布', eventDate: '2099-06-12' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaogongCalendarPage />)

    const flowCard = await screen.findByLabelText('exam-flow-card bj::national::2027')
    expect(within(flowCard).getByText('下一节点')).toBeInTheDocument()
    expect(within(flowCard).getByText('1', { selector: '.v2-calendar-rail__index' })).toBeInTheDocument()

    const timeline = within(flowCard).getByRole('list', { name: 'exam-flow-timeline bj::national::2027' })
    expect(within(timeline).getAllByRole('listitem')).toHaveLength(3)
    expect(within(timeline).getByText('公告发布')).toBeInTheDocument()
    expect(within(timeline).getByText('报名开始')).toBeInTheDocument()
    expect(within(timeline).getByText('成绩公布')).toBeInTheDocument()
    expect(within(timeline).getByText('2099-05-13')).toBeInTheDocument()
    expect(within(timeline).getByText('2099-05-18')).toBeInTheDocument()
    expect(within(timeline).getByText('2099-06-12')).toBeInTheDocument()
  })

  it('supports exam subscription actions and reminder updates in the calendar workspace', async () => {
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'zj::exam::2026',
          region: '浙江',
          examType: '浙江省公务员考试',
          year: '2026',
          events: [
            { id: 1, nodeType: '报名', title: '报名开始', eventDate: '2026-02-03' },
            { id: 2, nodeType: '笔试', title: '行测 + 申论', eventDate: '2026-03-12' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.mySubscriptions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 91,
          region: '浙江',
          examType: '浙江省公务员考试',
          examYear: '2026',
          remindBeforeDays: 3,
          status: 'ACTIVE',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 91,
          region: '浙江',
          examType: '浙江省公务员考试',
          examYear: '2026',
          remindBeforeDays: 7,
          status: 'ACTIVE',
        },
      ])
    apiMocks.kaogongApi.notifications.mockResolvedValue([
      { id: 201, title: '报名提醒', content: '距离报名开始还有 3 天', createdAt: '2026-01-31T09:00:00' },
    ])

    renderPage(<KaogongCalendarPage />)

    expect((await screen.findAllByText('浙江省公务员考试')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: '订阅考试' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.subscribeCalendar).toHaveBeenCalledWith({
        region: '浙江',
        examType: '浙江省公务员考试',
        examYear: '2026',
        remindBeforeDays: 3,
      }, 'remote-token')
    })

    expect(await screen.findByLabelText('提醒提前天数 91')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('提醒提前天数 91'), {
      target: { value: '7' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存提醒 91' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.subscribeCalendar).toHaveBeenCalledWith({
        region: '浙江',
        examType: '浙江省公务员考试',
        examYear: '2026',
        remindBeforeDays: 7,
      }, 'remote-token')
    })
  })

  it('supports current-room continue, create room, and join room from the interview hall', async () => {
    apiMocks.kaogongApi.interviewRoomsPage.mockResolvedValue({
      content: [
        {
          id: 7,
          title: '结构化一组',
          jobDirection: '税务 / 综合管理岗',
          scheduledAt: '2026-06-20T19:00:00',
          ownerName: '同伴A',
          participantCount: 6,
          status: 'OPEN',
          description: '今晚继续结构化题组训练',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.myInterviewRooms.mockResolvedValue([
      { id: 7, title: '结构化一组', status: 'OPEN', participantCount: 6 },
    ])
    apiMocks.kaogongApi.createInterviewRoom.mockResolvedValue({ id: 41, title: '无领导晚场', status: 'OPEN' })
    apiMocks.kaogongApi.joinInterviewRoom.mockResolvedValue({ id: 7, title: '结构化一组', status: 'OPEN' })

    const firstView = render(
      <MemoryRouter initialEntries={['/station/kaogong/interviews']}>
        <Routes>
          <Route path="/station/kaogong/interviews" element={<KaogongInterviewsPage />} />
          <Route path="/station/kaogong/interviews/rooms/:roomId" element={<div>考公房间占位</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findAllByText('结构化一组')).not.toHaveLength(0)
    expect(await screen.findByRole('button', { name: '继续当前房间' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '进入房间 7' }))
    expect(await screen.findByText('考公房间占位')).toBeInTheDocument()
    firstView.unmount()

    render(
      <MemoryRouter initialEntries={['/station/kaogong/interviews']}>
        <Routes>
          <Route path="/station/kaogong/interviews" element={<KaogongInterviewsPage />} />
          <Route path="/station/kaogong/interviews/rooms/:roomId" element={<div>考公房间占位</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findAllByText('结构化一组')).not.toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '新建房间' }))

    const createForm = screen.getByRole('button', { name: '创建并进入' }).closest('form')
    expect(createForm).not.toBeNull()
    const formScope = within(createForm)

    fireEvent.change(formScope.getByLabelText('房间标题'), { target: { value: '无领导晚场' } })
    fireEvent.change(formScope.getByLabelText('岗位方向'), { target: { value: '无领导/ 综合管理岗' } })
    fireEvent.change(formScope.getByLabelText('面试时间'), { target: { value: '2026-06-20T20:00' } })
    fireEvent.click(formScope.getByRole('button', { name: '创建并进入' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.createInterviewRoom).toHaveBeenCalled()
    })
    expect(await screen.findAllByText('考公房间占位')).not.toHaveLength(0)
  })

  it('loads messages, attachments, feedback, and send actions in the room workspace', async () => {
    apiMocks.kaogongApi.interviewRooms.mockResolvedValue([
      {
        id: 7,
        title: '结构化一组',
        jobDirection: '税务 / 综合管理岗',
        scheduledAt: '2026-06-20T19:00:00',
        ownerId: 9,
        ownerName: '考公测试用户',
        participantCount: 6,
        status: 'OPEN',
        description: '今晚继续结构化',
      },
    ])
    apiMocks.kaogongApi.myInterviewRooms.mockResolvedValue([
      { id: 7, title: '结构化一组', status: 'OPEN' },
    ])
    apiMocks.kaogongApi.interviewMessagesPage.mockResolvedValue({
      content: [
        { id: 301, senderId: 9, senderName: '考公测试用户', content: '先过自我介绍', createdAt: '2026-06-15T19:00:00' },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.interviewAttachmentsPage.mockResolvedValue({
      content: [
        { id: 401, originalName: 'outline.pdf', sizeBytes: 2048, note: '' },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.interviewFeedbackPage.mockResolvedValue({
      content: [
        {
          id: 501,
          reviewerName: '同伴A',
          score: 88,
          suggestions: '结尾再收紧',
          strengths: '观点清晰',
          createdAt: '2026-06-15T20:00:00',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    render(
      <MemoryRouter initialEntries={['/station/kaogong/interviews/rooms/7']}>
        <Routes>
          <Route path="/station/kaogong/interviews/rooms/:roomId" element={<KaogongInterviewRoomPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '结构化一组' })).toBeInTheDocument()
    expect(screen.getByText('先过自我介绍')).toBeInTheDocument()
    expect(screen.getByText('outline.pdf')).toBeInTheDocument()
    expect(screen.getByText('结尾再收紧')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('发送消息'), { target: { value: '下一轮过应变题' } })
    fireEvent.click(screen.getByRole('button', { name: '发送消息' }))

    await waitFor(() => {
      expect(apiMocks.kaogongApi.sendInterviewMessage).toHaveBeenCalledWith(7, { content: '下一轮过应变题' }, 'remote-token')
    })
  })
})
