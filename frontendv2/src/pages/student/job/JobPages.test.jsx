import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JobStationOverviewPage from './JobStationOverviewPage.jsx'
import JobResumePage from './JobResumePage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: '就业测试用户',
    role: 'user',
    target: 'job',
  },
  token: 'remote-token',
  isAuthed: true,
  loading: false,
}))

const apiMocks = vi.hoisted(() => ({
  employmentApi: {
    resume: vi.fn(),
    recommendations: vi.fn(),
    applications: vi.fn(),
    fairs: vi.fn(),
    notifications: vi.fn(),
    postingDetail: vi.fn(),
    fairDetail: vi.fn(),
    preference: vi.fn(),
    savePreference: vi.fn(),
    saveResume: vi.fn(),
    exportResume: vi.fn(),
    uploadResumeFile: vi.fn(),
    downloadResumeFile: vi.fn(),
    deleteResumeFile: vi.fn(),
    createApplication: vi.fn(),
    updateApplication: vi.fn(),
    deleteApplication: vi.fn(),
    markNotificationRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => apiMocks)

function renderRoute(initialEntry, node) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      {node}
    </MemoryRouter>,
  )
}

describe('student employment pages', () => {
  beforeEach(() => {
    authState.user = {
      id: 9,
      name: '就业测试用户',
      role: 'user',
      target: 'job',
    }
    authState.token = 'remote-token'
    authState.isAuthed = true
    authState.loading = false

    Object.values(apiMocks.employmentApi).forEach((fn) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
    })
  })

  it('renders the employment overview as a progress console with live summary cards', async () => {
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

    renderRoute('/station/job', <JobStationOverviewPage />)

    expect(
      await screen.findByRole('heading', {
        name: '先看推进总览，再进入简历、推荐、投递和招聘会工作区。',
      }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.employmentApi.resume).toHaveBeenCalledWith('remote-token')
      expect(apiMocks.employmentApi.recommendations).toHaveBeenCalledWith({}, 'remote-token')
      expect(apiMocks.employmentApi.applications).toHaveBeenCalledWith('remote-token')
      expect(apiMocks.employmentApi.fairs).toHaveBeenCalledWith({ page: 1, size: 4 })
      expect(apiMocks.employmentApi.notifications).toHaveBeenCalledWith('remote-token')
    })

    expect(screen.getByText('简历完成度')).toBeInTheDocument()
    expect(screen.getByText('已建立求职画像')).toBeInTheDocument()
    expect(screen.getByText('最近提醒')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /简历中心/ })).toHaveAttribute('href', '/station/job/resume')
    expect(screen.getByRole('link', { name: /岗位推荐/ })).toHaveAttribute('href', '/station/job/recommendations')
  })

  it('renders the resume center with edit and preview modes plus attachment actions', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: '平台后端工程师',
      expectedCities: '上海, 杭州',
      expectedIndustries: '教育科技',
      baseInfo: '张三 / 华东师范大学',
      selfEvaluation: '擅长 Spring Boot 与数据看板。',
      resumeFile: {
        hasFile: true,
        fileName: 'resume-final.pdf',
        fileSize: 409600,
        uploadedAt: '2026-06-12T09:30:00',
      },
    })

    renderRoute('/station/job/resume', <JobResumePage />)

    expect(await screen.findByDisplayValue('平台后端工程师')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '预览' })).toBeInTheDocument()
    expect(screen.getByText('resume-final.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导出 Word' })).toBeInTheDocument()
  })
})
