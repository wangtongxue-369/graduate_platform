import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaoyanSchoolsPage from '@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'
import { KaogongCalendarPage } from '@/pages/student/kaogong/KaogongStationPage.jsx'
import JobStationPage, { JobResumePage } from '@/pages/student/job/JobStationPage.jsx'
import { StudyAbroadProgramsPage } from '@/pages/student/studyabroad/StudyAbroadStationPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: '方向测试用户',
    role: 'user',
    target: 'kaoyan',
  },
  token: 'remote-token',
}))

const apiMocks = vi.hoisted(() => ({
  kaoyanApi: {
    schoolsPage: vi.fn(),
    scoreLinesPage: vi.fn(),
    favoriteScoreLine: vi.fn(),
    unfavoriteScoreLine: vi.fn(),
  },
  materialApi: {
    listPage: vi.fn(),
  },
  mentorApi: {
    mentorsPage: vi.fn(),
    unreadCount: vi.fn(),
  },
  studyRoomApi: {
    roomList: vi.fn(),
  },
  studyPlanApi: {
    myPlans: vi.fn(),
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
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => apiMocks)

function renderPage(node) {
  return render(
    <MemoryRouter>
      {node}
    </MemoryRouter>,
  )
}

describe('student station pages use backend-shaped data in frontendv2', () => {
  beforeEach(() => {
    authState.token = 'remote-token'
    authState.user = {
      id: 9,
      name: '方向测试用户',
      role: 'user',
      target: 'kaoyan',
    }

    Object.values(apiMocks).forEach((group) => {
      Object.values(group).forEach((fn) => {
        if (typeof fn?.mockReset === 'function') fn.mockReset()
      })
    })
  })

  it('renders remote kaoyan school and score-line data with rightbar filters', async () => {
    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [
        {
          id: 1,
          name: '浙江大学',
          region: '华东',
          province: '浙江',
          is985: true,
          is211: true,
          isDoubleFirstClass: true,
          schoolType: '综合',
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaoyanApi.scoreLinesPage.mockResolvedValue({
      content: [
        {
          id: 11,
          schoolId: 1,
          schoolName: '浙江大学',
          year: 2025,
          majorCategory: '工学',
          majorName: '计算机科学与技术',
          totalScoreLine: 390,
          admissionRatio: 6.2,
          plannedEnrollment: 28,
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaoyanSchoolsPage />)

    expect(
      screen.getByRole('heading', { name: '择校账本' }),
    ).toBeInTheDocument()
    expect(screen.getByText('筛选控制器')).toBeInTheDocument()
    expect(screen.getByLabelText('院校名称')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '院校' })).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.schoolsPage).toHaveBeenCalled()
      expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalled()
    })
    expect(await screen.findByText('浙江大学')).toBeInTheDocument()
    expect(screen.getByText('计算机科学与技术')).toBeInTheDocument()
    expect(screen.getByText('390')).toBeInTheDocument()
  })

  it('renders remote kaogong exam groups and subscriptions with rightbar filters', async () => {
    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'zj::省考::2026',
          region: '浙江',
          examType: '浙江省公务员考试',
          year: '2026',
          events: [
            { id: 1, nodeType: '报名', title: '报名开始', eventDate: '2026-02-03' },
            { id: 2, nodeType: '笔试', title: '行政职业能力测验', eventDate: '2026-03-12' },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.mySubscriptions.mockResolvedValue([
      {
        id: 91,
        region: '浙江',
        examType: '浙江省公务员考试',
        examYear: '2026',
        remindBeforeDays: 3,
        status: 'ACTIVE',
      },
    ])
    apiMocks.kaogongApi.notifications.mockResolvedValue([
      { id: 201, title: '报名提醒', content: '距离报名开始还有 3 天', createdAt: '2026-01-31T09:00:00' },
    ])

    renderPage(<KaogongCalendarPage />)

    expect(screen.getByText('筛选与订阅')).toBeInTheDocument()
    expect(screen.getByLabelText('地区')).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.kaogongApi.calendarExamGroupsPage).toHaveBeenCalled()
    })
    expect(screen.getAllByText('浙江省公务员考试').length).toBeGreaterThan(0)
    expect(screen.getByText(/^报名开始/)).toBeInTheDocument()
    expect(screen.getByText('距离报名开始还有 3 天')).toBeInTheDocument()
  })

  it('renders remote job resume data in the resume workspace', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: '平台后端工程师',
      expectedCities: '上海, 杭州',
      expectedIndustries: '教育科技',
      skillTags: 'Java, Spring Boot, MySQL',
      resumeFile: {
        hasFile: true,
        fileName: 'resume-final.pdf',
        fileSize: 409600,
        fileType: 'application/pdf',
        uploadedAt: '2026-06-12T09:30:00',
      },
    })

    renderPage(<JobResumePage />)

    await waitFor(() => {
      expect(apiMocks.employmentApi.resume).toHaveBeenCalled()
    })
    expect(screen.getAllByText('平台后端工程师').length).toBeGreaterThan(0)
    expect(screen.getAllByText('resume-final.pdf').length).toBeGreaterThan(0)
    expect(screen.getAllByText('上海, 杭州').length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('Java, Spring Boot, MySQL')).toBeInTheDocument()
  })

  it('keeps the legacy job station entry pointed at the new overview workspace', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: '平台后端工程师',
      resumeFile: { hasFile: true, fileName: 'resume-final.pdf' },
    })
    apiMocks.employmentApi.recommendations.mockResolvedValue([
      { id: 1, title: '后端开发', companyName: '星河科技', matchScore: 92, matchReasons: ['技能匹配'] },
    ])
    apiMocks.employmentApi.applications.mockResolvedValue([
      { id: 7, companyName: '星河科技', jobTitle: '后端开发', status: 'FIRST_INTERVIEW', nextStepAt: '2026-06-20T14:00:00' },
    ])
    apiMocks.employmentApi.fairs.mockResolvedValue({
      items: [{ id: 4, title: '上海春招专场', city: '上海', industry: '互联网' }],
      totalItems: 1,
      totalPages: 1,
      page: 1,
    })
    apiMocks.employmentApi.notifications.mockResolvedValue({
      items: [{ id: 30, title: '推荐提醒', readFlag: false }],
      unreadCount: 1,
    })

    renderPage(<JobStationPage />)

    expect(
      await screen.findByRole('heading', {
        name: '就业总览',
      }),
    ).toBeInTheDocument()
  })

  it('renders remote study-abroad program data with rightbar filters', async () => {
    apiMocks.studyAbroadApi.schoolProgramsPage.mockResolvedValue({
      content: [
        {
          id: 'program-1',
          country: 'Singapore',
          schoolName: 'National University of Singapore',
          programName: 'MSc Artificial Intelligence',
          degree: 'Master',
          subjectArea: '计算机与数据',
          qsRank: 'QS 2026: Top 10',
          tuitionRange: '约 SGD 60k/项目',
          durationText: '1 年',
          deadlineText: '3 月中旬',
          applicationRequirements: '相关专业背景、语言成绩、推荐信',
          visaPolicy: '录取后按学校流程申请学生准证',
          employmentPolicy: '科技岗位集中，建议尽早准备实习',
          partnerProgram: true,
          partnerNote: '与本校有联合项目交流',
          riskTags: ['竞争强'],
          riskSummary: '建议同时准备 1-2 个保底项目',
          sourceNote: '管理员维护',
          policyUpdatedAt: '2026-06-01',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
    })

    renderPage(<StudyAbroadProgramsPage />)

    expect(screen.getByText('筛选控制器')).toBeInTheDocument()
    expect(screen.getByLabelText('国家 / 地区')).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.studyAbroadApi.schoolProgramsPage).toHaveBeenCalled()
    })
    expect(screen.getAllByText('National University of Singapore').length).toBeGreaterThan(0)
    expect(screen.getByText('MSc Artificial Intelligence')).toBeInTheDocument()
    expect(screen.getByText(/QS 2026: Top 10/)).toBeInTheDocument()
  })
})
