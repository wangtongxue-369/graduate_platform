import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import JobApplicationsPage from './JobApplicationsPage.jsx'
import JobFairsPage from './JobFairsPage.jsx'
import JobRecommendationsPage from './JobRecommendationsPage.jsx'
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

function RouteLocationProbe() {
  const location = useLocation()
  return <div data-testid="route-location">{`${location.pathname}${location.search}`}</div>
}

function renderRoute(initialEntry, node) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <RouteLocationProbe />
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
        name: '就业总览',
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
    expect(screen.getByText('编辑在线简历、附件简历')).toBeInTheDocument()
    expect(screen.getByText('高频筛选，匹配岗位')).toBeInTheDocument()
    expect(screen.getByText('跟踪岗位投递的进度')).toBeInTheDocument()
    expect(screen.getByText('筛选会场，查看报名与到场安排')).toBeInTheDocument()
    expect(screen.queryByText('在线简历、附件简历和导出动作都从这里进入。')).not.toBeInTheDocument()
    expect(screen.queryByText('把高频筛选留在右栏，主区专注看推荐结果。')).not.toBeInTheDocument()
    expect(screen.queryByText('进入状态看板后再处理面试、结果和后续动作。')).not.toBeInTheDocument()
    expect(screen.queryByText('浏览筛选和提醒偏好分离，避免把右栏变成长表单。')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /简历中心/ })).toHaveAttribute('href', '/station/job/resume')
    expect(screen.getByRole('link', { name: /岗位推荐/ })).toHaveAttribute('href', '/station/job/recommendations')
  })

  it('renders the resume center with edit and preview modes plus attachment actions', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: '平台后端工程师',
      expectedCities: '上海, 杭州',
      expectedIndustries: '教育科技',
      educationLevel: '本科',
      phone: '13800000000',
      email: 'zhangsan@example.com',
      baseInfo: '张三 / 华东师范大学',
      projects: '就业平台推荐系统',
      internships: '后端研发实习',
      education: '学生会技术部',
      selfEvaluation: '擅长 Spring Boot 与数据看板。',
      resumeFile: {
        hasFile: true,
        fileName: 'resume-final.pdf',
        fileSize: 409600,
        uploadedAt: '2026-06-12T09:30:00',
      },
    })
    apiMocks.employmentApi.saveResume.mockResolvedValue({
      targetRole: '平台后端工程师',
      expectedCities: '上海, 杭州',
      expectedIndustries: '教育科技',
      educationLevel: '硕士',
      phone: '13900000000',
      email: 'zhangsan@example.com',
      baseInfo: '张三 / 华东师范大学',
      projects: '就业平台推荐系统与简历中心',
      internships: '后端研发实习',
      education: '学生会技术部',
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
    expect(screen.getByDisplayValue('本科')).toBeInTheDocument()
    expect(screen.getByDisplayValue('13800000000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('就业平台推荐系统')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '预览' })).toBeInTheDocument()
    expect(screen.getByText('resume-final.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导出 Word' })).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('本科'), {
      target: { value: '硕士' },
    })
    fireEvent.change(screen.getByDisplayValue('13800000000'), {
      target: { value: '13900000000' },
    })
    fireEvent.change(screen.getByDisplayValue('就业平台推荐系统'), {
      target: { value: '就业平台推荐系统与简历中心' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存简历' }))

    await waitFor(() => {
      expect(apiMocks.employmentApi.saveResume).toHaveBeenCalledWith(
        expect.objectContaining({
          highestEducation: '硕士',
          phone: '13900000000',
          email: 'zhangsan@example.com',
          projectExperience: '就业平台推荐系统与简历中心',
          internshipExperience: '后端研发实习',
          educationExperience: '学生会技术部',
        }),
        'remote-token',
      )
    })
    expect(await screen.findByDisplayValue('硕士')).toBeInTheDocument()
  })

  it('shows a visible resume save failure instead of failing silently', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: '平台后端工程师',
      resumeFile: { hasFile: false },
    })
    apiMocks.employmentApi.saveResume.mockRejectedValue(new Error('Request failed: 403'))

    renderRoute('/station/job/resume', <JobResumePage />)

    expect(await screen.findByDisplayValue('平台后端工程师')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '保存简历' }))

    expect(await screen.findByText('保存失败：Request failed: 403')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存简历' })).toBeEnabled()
  })

  it('updates resume attachment status immediately after uploading a file', async () => {
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: 'Java工程师',
      expectedCities: '上海',
      expectedIndustries: '互联网',
      resumeFile: { hasFile: false },
    })
    apiMocks.employmentApi.uploadResumeFile.mockResolvedValue({
      targetRole: 'Java工程师',
      expectedCities: '上海',
      expectedIndustries: '互联网',
      resumeFile: {
        hasFile: true,
        fileName: 'java-resume.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedAt: '2026-06-16T20:30:00',
      },
    })

    const { container } = renderRoute('/station/job/resume', <JobResumePage />)

    expect((await screen.findAllByText('当前没有附件简历')).length).toBeGreaterThan(0)
    const input = container.querySelector('input[type="file"]')
    const file = new File(['resume'], 'java-resume.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(apiMocks.employmentApi.uploadResumeFile).toHaveBeenCalledWith(file, 'remote-token')
    })
    expect(await screen.findByText('附件简历已上传。')).toBeInTheDocument()
    expect(screen.getByText('java-resume.pdf')).toBeInTheDocument()
    expect(screen.getAllByText('已上传').length).toBeGreaterThan(0)
  })

  it('renders the recommendations workspace with detail drawer, notification actions, and tracking confirmation', async () => {
    apiMocks.employmentApi.recommendations.mockResolvedValue({
      items: [
        {
          id: 21,
          title: '后端开发工程师',
          companyName: '星河科技',
          city: '上海',
          industry: '教育科技',
          companyType: '民企',
          roleType: '后端',
          salaryRange: '18k-24k',
          educationRequirement: '本科',
          majorKeywords: '计算机',
          skillTags: 'Java, Spring Boot',
          matchScore: 93,
          matchReasons: ['Java 技能匹配'],
          description: '负责就业平台服务接口与数据工作。',
          applyUrl: 'https://example.com/jobs/21',
        },
      ],
      totalItems: 11,
      totalPages: 2,
      page: 1,
      size: 10,
    })
    apiMocks.employmentApi.notifications.mockResolvedValue({
      items: [
        {
          id: 42,
          title: '新推荐已到达',
          content: '星河科技更新了后端岗位用人标准。',
          readFlag: false,
        },
      ],
      unreadCount: 1,
    })
    apiMocks.employmentApi.postingDetail.mockResolvedValue({
      id: 21,
      title: '后端开发工程师',
      companyName: '星河科技',
      city: '上海',
      industry: '教育科技',
      companyType: '民企',
      roleType: '后端',
      salaryRange: '18k-24k',
      educationRequirement: '本科',
      majorKeywords: '计算机',
      skillTags: 'Java, Spring Boot',
      description: '负责就业平台服务接口与数据工作。',
      responsibilities: '维护接口与算法推荐支撑。',
      requirements: '具备 Java 和 Spring Boot 开发经验。',
      applyUrl: 'https://example.com/jobs/21',
    })
    apiMocks.employmentApi.markNotificationRead.mockResolvedValue({})
    apiMocks.employmentApi.deleteNotification.mockResolvedValue({})

    renderRoute('/station/job/recommendations', <JobRecommendationsPage />)

    expect(await screen.findByTestId('job-recommendations-page')).toBeInTheDocument()
    expect(screen.getByText('提醒收件箱')).toBeInTheDocument()
    expect(screen.getByText('推荐数量')).toBeInTheDocument()
    await waitFor(() => {
      expect(apiMocks.employmentApi.recommendations).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, size: 10 }),
        'remote-token',
      )
    })
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(() => {
      expect(apiMocks.employmentApi.recommendations).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, size: 10 }),
        'remote-token',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: '标记已读' }))
    await waitFor(() => {
      expect(apiMocks.employmentApi.markNotificationRead).toHaveBeenCalledWith(42, 'remote-token')
    })

    fireEvent.click(screen.getByRole('button', { name: '查看详情' }))
    await waitFor(() => {
      expect(apiMocks.employmentApi.postingDetail).toHaveBeenCalledWith(21)
    })

    expect(await screen.findByTestId('job-posting-detail-modal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '星河科技 / 后端开发工程师' })).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: '加入投递跟踪' })[0])
    expect(screen.getByText('加入投递跟踪前，先把这条推荐带到投递看板。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '去建立跟踪条目' }))

    await waitFor(() => {
      const locationText = screen.getByTestId('route-location').textContent || ''
      expect(locationText).toContain('/station/job/applications?')
      expect(locationText).toContain('jobPostingId=21')
      expect(locationText).toContain('openDrawer=create')
    })
  })

  it('renders the applications board with query-prefilled drawer, save action, and delete confirmation', async () => {
    apiMocks.employmentApi.applications.mockResolvedValue([
      {
        id: 71,
        jobPostingId: 21,
        companyName: '星河科技',
        jobTitle: '后端开发工程师',
        city: '上海',
        industry: '教育科技',
        companyType: '民企',
        roleType: '后端',
        salaryRange: '18k-24k',
        educationRequirement: '本科',
        skillTags: 'Java, Spring Boot',
        status: 'FIRST_INTERVIEW',
        appliedAt: '2026-06-10T09:00:00',
        nextStepAt: '2026-06-18T14:00:00',
        notes: '准备一面项目复盘',
      },
    ])
    apiMocks.employmentApi.resume.mockResolvedValue({
      targetRole: '平台后端工程师',
      resumeFile: {
        hasFile: true,
        fileName: 'resume-final.pdf',
      },
    })
    apiMocks.employmentApi.createApplication.mockResolvedValue({
      id: 88,
    })
    apiMocks.employmentApi.deleteApplication.mockResolvedValue({})

    renderRoute(
      '/station/job/applications?jobPostingId=21&companyName=%E6%98%9F%E6%B2%B3%E7%A7%91%E6%8A%80&jobTitle=%E5%90%8E%E7%AB%AF%E5%BC%80%E5%8F%91%E5%B7%A5%E7%A8%8B%E5%B8%88&city=%E4%B8%8A%E6%B5%B7&industry=%E6%95%99%E8%82%B2%E7%A7%91%E6%8A%80&openDrawer=create',
      <JobApplicationsPage />,
    )

    expect(await screen.findByTestId('job-applications-page')).toBeInTheDocument()
    expect(screen.getAllByText('推进泳道').length).toBeGreaterThan(0)
    expect(await screen.findByTestId('job-application-editor-modal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('星河科技')).toBeInTheDocument()
    expect(screen.getByDisplayValue('后端开发工程师')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('备注'), {
      target: { value: '来自推荐工作台的新建记录' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存跟踪条目' }))

    await waitFor(() => {
      expect(apiMocks.employmentApi.createApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          jobPostingId: 21,
          companyName: '星河科技',
          jobTitle: '后端开发工程师',
          city: '上海',
          industry: '教育科技',
          notes: '来自推荐工作台的新建记录',
        }),
        'remote-token',
      )
    })

    fireEvent.click(screen.getAllByRole('button', { name: '删除' })[1])
    expect(screen.getByText('删除后会从当前推进看板移除这条记录。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '删除记录' }))

    await waitFor(() => {
      expect(apiMocks.employmentApi.deleteApplication).toHaveBeenCalledWith(71, 'remote-token')
    })
  })

  it('filters the applications board to the selected workflow lane', async () => {
    apiMocks.employmentApi.applications.mockResolvedValue([
      {
        id: 91,
        companyName: '未来科技',
        jobTitle: 'Java 后端工程师',
        city: '上海',
        industry: '互联网',
        status: 'TODO',
      },
      {
        id: 92,
        companyName: '阿里巴巴',
        jobTitle: '前端开发工程师',
        city: '杭州',
        industry: '互联网',
        status: 'FIRST_INTERVIEW',
      },
    ])
    apiMocks.employmentApi.resume.mockResolvedValue({
      resumeFile: { hasFile: true, fileName: 'resume-final.pdf' },
    })

    const { container } = renderRoute('/station/job/applications', <JobApplicationsPage />)

    expect(await screen.findByTestId('job-applications-page')).toBeInTheDocument()
    expect(container.querySelectorAll('.v2-split-board > .v2-check-card')).toHaveLength(4)
    expect(screen.getByRole('heading', { name: '待启动' })).toBeInTheDocument()
    expect(screen.queryByText('待开始')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '已出结果' })).toBeInTheDocument()
    expect(screen.queryByText('已有结果')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '面试中' }))

    expect(container.querySelectorAll('.v2-split-board > .v2-check-card')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: '面试中' })).toBeInTheDocument()
    expect(screen.getByText('阿里巴巴 / 前端开发工程师')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '待启动' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '推进中' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '已出结果' })).not.toBeInTheDocument()
  })

  it('renders the fairs workspace with preference modal and detail drawer', async () => {
    apiMocks.employmentApi.fairs.mockResolvedValue({
      items: [
        {
          id: 51,
          title: '上海春招双选会',
          city: '上海',
          industry: '教育科技',
          location: '浦东会展中心',
          description: '聚焦教育科技和平台研发岗位。',
          startTime: '2026-06-22T09:00:00',
          applyDeadline: '2026-06-21T18:00:00',
          applyUrl: 'https://example.com/fairs/51',
        },
      ],
      totalItems: 11,
      totalPages: 2,
      page: 1,
      size: 10,
    })
    apiMocks.employmentApi.preference.mockResolvedValue({
      cities: '上海, 杭州',
      industries: '教育科技',
      roleTypes: '后端, 产品',
      salaryRange: '15k-25k',
      companyTypes: '民企, 外企',
    })
    apiMocks.employmentApi.fairDetail.mockResolvedValue({
      id: 51,
      title: '上海春招双选会',
      city: '上海',
      industry: '教育科技',
      location: '浦东会展中心',
      targetRoles: '后端, 产品',
      description: '聚焦教育科技和平台研发岗位。',
      applyDeadline: '2026-06-21T18:00:00',
      applyUrl: 'https://example.com/fairs/51',
    })
    apiMocks.employmentApi.savePreference.mockResolvedValue({
      cities: '上海, 杭州, 苏州',
      industries: '教育科技',
      roleTypes: '后端, 产品',
      salaryRange: '15k-25k',
      companyTypes: '民企, 外企',
    })

    renderRoute('/station/job/fairs', <JobFairsPage />)

    expect(await screen.findByTestId('job-fairs-page')).toBeInTheDocument()
    expect(screen.getByText('偏好摘要')).toBeInTheDocument()
    await waitFor(() => {
      expect(apiMocks.employmentApi.fairs).toHaveBeenCalledWith(expect.objectContaining({ page: 1, size: 10 }))
    })
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await waitFor(() => {
      expect(apiMocks.employmentApi.fairs).toHaveBeenCalledWith(expect.objectContaining({ page: 2, size: 10 }))
    })

    fireEvent.click(screen.getByRole('button', { name: '编辑偏好' }))
    expect(await screen.findByTestId('job-preference-modal')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('偏好城市'), {
      target: { value: '上海, 杭州, 苏州' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存偏好' }))

    await waitFor(() => {
      expect(apiMocks.employmentApi.savePreference).toHaveBeenCalledWith(
        expect.objectContaining({
          cities: '上海, 杭州, 苏州',
        }),
        'remote-token',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: '查看详情' }))
    expect(await screen.findByTestId('job-fair-detail-drawer')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '上海春招双选会' })).toBeInTheDocument()
    await waitFor(() => {
      expect(apiMocks.employmentApi.fairDetail).toHaveBeenCalledWith(51)
    })
  })
})
