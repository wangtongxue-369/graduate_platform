import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaoyanSchoolsPage from '@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'
import { KaogongCalendarPage } from '@/pages/student/kaogong/KaogongStationPage.jsx'
import JobStationPage, { JobResumePage } from '@/pages/student/job/JobStationPage.jsx'
import StudyAbroadProgramsPage from '@/pages/student/studyabroad/StudyAbroadProgramsPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: 'Station Tester',
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

function toDateKey(value) {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

describe('student station pages use backend-shaped data in frontendv2', () => {
  beforeEach(() => {
    authState.token = 'remote-token'
    authState.user = {
      id: 9,
      name: 'Station Tester',
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
          name: 'Zhejiang University',
          region: 'East China',
          province: 'Zhejiang',
          is985: true,
          is211: true,
          isDoubleFirstClass: true,
          schoolType: 'Comprehensive',
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
          schoolName: 'Zhejiang University',
          year: 2025,
          majorCategory: 'Engineering',
          majorName: 'Computer Science',
          totalScoreLine: 390,
          admissionRatio: 6.2,
          plannedEnrollment: 28,
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaoyanSchoolsPage />)

    expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0)

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.schoolsPage).toHaveBeenCalled()
      expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalled()
    })
    expect(await screen.findByText('Zhejiang University')).toBeInTheDocument()
    expect(screen.getByText('Computer Science')).toBeInTheDocument()
    expect(screen.getByText('390')).toBeInTheDocument()
  })

  it('renders remote kaogong exam groups and subscriptions with rightbar filters', async () => {
    const signupDate = new Date()
    signupDate.setHours(12, 0, 0, 0)
    signupDate.setDate(signupDate.getDate() + 3)
    const examDate = new Date(signupDate)
    examDate.setDate(examDate.getDate() + 21)
    const signupDateKey = toDateKey(signupDate)
    const examDateKey = toDateKey(examDate)

    apiMocks.kaogongApi.calendarExamGroupsPage.mockResolvedValue({
      content: [
        {
          key: 'zj::provincial:2026',
          region: 'Zhejiang',
          examType: 'Zhejiang Civil Service Exam',
          year: '2026',
          events: [
            { id: 1, nodeType: 'Sign Up', title: 'Registration Opens', eventDate: signupDateKey },
            { id: 2, nodeType: 'Written Test', title: 'Administrative Aptitude Test', eventDate: examDateKey },
          ],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })
    apiMocks.kaogongApi.mySubscriptions.mockResolvedValue([
      {
        id: 91,
        region: 'Zhejiang',
        examType: 'Zhejiang Civil Service Exam',
        examYear: '2026',
        remindBeforeDays: 3,
        status: 'ACTIVE',
      },
    ])
    apiMocks.kaogongApi.notifications.mockResolvedValue([
      {
        id: 201,
        title: 'Registration Reminder',
        content: 'Registration opens soon',
        createdAt: `${signupDateKey}T09:00:00`,
      },
    ])

    renderPage(<KaogongCalendarPage />)

    expect(screen.getByLabelText('地区')).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.kaogongApi.calendarExamGroupsPage).toHaveBeenCalled()
      expect(apiMocks.kaogongApi.mySubscriptions).toHaveBeenCalled()
      expect(apiMocks.kaogongApi.notifications).toHaveBeenCalled()
    })
    expect(screen.getAllByText('Zhejiang Civil Service Exam').length).toBeGreaterThan(0)
    expect(screen.getAllByText(signupDateKey).length).toBeGreaterThan(0)
    expect(screen.getByText(/09:00/)).toBeInTheDocument()
    expect(document.querySelector('.v2-calendar-wall__group')).not.toBeNull()
  })

  it('renders remote job resume data in the resume workspace', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: 'Backend Engineer',
      expectedCities: 'Shanghai, Hangzhou',
      expectedIndustries: 'EdTech',
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
    expect(screen.getAllByText('Backend Engineer').length).toBeGreaterThan(0)
    expect(screen.getAllByText('resume-final.pdf').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Shanghai, Hangzhou').length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('Java, Spring Boot, MySQL')).toBeInTheDocument()
  })

  it('keeps the legacy job station entry pointed at the new overview workspace', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: 'Backend Engineer',
      resumeFile: { hasFile: true, fileName: 'resume-final.pdf' },
    })
    apiMocks.employmentApi.recommendations.mockResolvedValue([
      { id: 1, title: 'Backend Developer', companyName: 'Nebula Tech', matchScore: 92, matchReasons: ['Skills match'] },
    ])
    apiMocks.employmentApi.applications.mockResolvedValue([
      { id: 7, companyName: 'Nebula Tech', jobTitle: 'Backend Developer', status: 'FIRST_INTERVIEW', nextStepAt: '2026-06-20T14:00:00' },
    ])
    apiMocks.employmentApi.fairs.mockResolvedValue({
      items: [{ id: 4, title: 'Shanghai Spring Hiring Fair', city: 'Shanghai', industry: 'Internet' }],
      totalItems: 1,
      totalPages: 1,
      page: 1,
    })
    apiMocks.employmentApi.notifications.mockResolvedValue({
      items: [{ id: 30, title: 'Recommendation Reminder', readFlag: false }],
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
          subjectArea: 'Computer Science and Data',
          qsRank: 'QS 2026: Top 10',
          tuitionRange: 'Approx. SGD 60k',
          durationText: '1 year',
          deadlineText: 'Mid March',
          applicationRequirements: 'Relevant major background, language scores, recommendations',
          visaPolicy: 'Apply after admission through the school process',
          employmentPolicy: 'Strong tech market with early internship prep recommended',
          partnerProgram: true,
          partnerNote: 'Joint exchange program available',
          riskTags: ['Competitive'],
          riskSummary: 'Prepare 1-2 safer options in parallel',
          sourceNote: 'Maintained by admin',
          policyUpdatedAt: '2026-06-01',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
    })

    renderPage(<StudyAbroadProgramsPage />)

    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2)

    await waitFor(() => {
      expect(apiMocks.studyAbroadApi.schoolProgramsPage).toHaveBeenCalled()
    })
    expect(screen.getAllByText('National University of Singapore').length).toBeGreaterThan(0)
    expect(screen.getByText('MSc Artificial Intelligence')).toBeInTheDocument()
    expect(screen.getByText(/QS 2026: Top 10/)).toBeInTheDocument()
  })
})
