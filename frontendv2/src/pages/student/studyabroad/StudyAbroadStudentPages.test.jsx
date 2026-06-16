import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StudyAbroadActionPanel from '@/components/studyabroad/StudyAbroadActionPanel.jsx'
import StudyAbroadApplicationsPage from '@/pages/student/studyabroad/StudyAbroadApplicationsPage.jsx'
import StudyAbroadCasesPage from '@/pages/student/studyabroad/StudyAbroadCasesPage.jsx'
import StudyAbroadExperiencesPage from '@/pages/student/studyabroad/StudyAbroadExperiencesPage.jsx'
import StudyAbroadMaterialsPage from '@/pages/student/studyabroad/StudyAbroadMaterialsPage.jsx'
import StudyAbroadProgramsPage from '@/pages/student/studyabroad/StudyAbroadProgramsPage.jsx'
import StudyAbroadTimelinePage from '@/pages/student/studyabroad/StudyAbroadTimelinePage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: '留学测试用户',
    role: 'user',
    target: 'liuxue',
  },
  token: 'remote-token',
}))

const apiMocks = vi.hoisted(() => ({
  studyAbroadApi: {
    schoolProgramsPage: vi.fn(),
    admissionCasesPage: vi.fn(),
    createAdmissionCase: vi.fn(),
    deleteAdmissionCase: vi.fn(),
    experiencesPage: vi.fn(),
    createExperience: vi.fn(),
    updateExperience: vi.fn(),
    deleteExperience: vi.fn(),
    applications: vi.fn(),
    createApplication: vi.fn(),
    updateApplication: vi.fn(),
    deleteApplication: vi.fn(),
    timeline: vi.fn(),
    createTimeline: vi.fn(),
    updateTimeline: vi.fn(),
    deleteTimeline: vi.fn(),
    materials: vi.fn(),
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
    uploadMaterialAttachments: vi.fn(),
    downloadMaterialAttachment: vi.fn(),
    deleteMaterialAttachment: vi.fn(),
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

describe('study abroad student pages', () => {
  beforeEach(() => {
    authState.user = {
      id: 9,
      name: '留学测试用户',
      role: 'user',
      target: 'liuxue',
    }
    authState.token = 'remote-token'
    Object.values(apiMocks.studyAbroadApi).forEach((fn) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
    })
  })

  it('renders the shared study abroad action panel with all quick actions', () => {
    renderPage(
      <StudyAbroadActionPanel
        onCreateApplication={() => {}}
        onCreateTimeline={() => {}}
        onCreateMaterial={() => {}}
        onCreateExperience={() => {}}
        onCreateCase={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: '新建申请' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增时间线节点' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增材料' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布经验' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交案例' })).toBeInTheDocument()
  })

  it('renders the dedicated experiences route with publish action', async () => {
    apiMocks.studyAbroadApi.experiencesPage.mockResolvedValue({
      content: [
        {
          id: 101,
          title: 'UCL 申请复盘',
          country: 'UK',
          topic: 'Application',
          authorName: '留学同学',
          summary: '摘要内容',
          content: '第一段正文\n第二段正文',
          tags: ['申请'],
          authorId: 22,
          createdAt: '2026-06-12T10:00:00',
        },
      ],
      totalPages: 1,
      totalElements: 1,
    })

    renderPage(<StudyAbroadExperiencesPage />)

    expect(await screen.findByRole('heading', { name: '留学经验库' })).toBeInTheDocument()
    expect(screen.getByText('本校同学发布的申请经验，欢迎同学们交流！')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布经验' })).toBeInTheDocument()
    expect(screen.getByText('2026/06/12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看全文' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看全文' }))
    expect(screen.getByText('第一段正文')).toBeInTheDocument()
  })

  it('submits admission case contact information from frontend v2', async () => {
    apiMocks.studyAbroadApi.admissionCasesPage.mockResolvedValue({
      content: [],
      totalPages: 1,
      totalElements: 0,
    })
    apiMocks.studyAbroadApi.createAdmissionCase.mockResolvedValue({
      id: 501,
      applicationYear: '2026',
      studentMajor: 'CS',
      gpa: '3.8',
      languageType: 'IELTS',
      languageScore: '7.0',
      country: 'UK',
      school: 'UCL',
      program: 'MSc CS',
      degree: 'Master',
      admissionResult: 'admit',
      summary: '录取复盘',
      contact: 'wechat-demo',
      authorId: 9,
    })

    renderPage(<StudyAbroadCasesPage />)

    fireEvent.click(await screen.findByRole('button', { name: '提交案例' }))
    expect(screen.getByText('匿名记录你的申请背景、申请结果和经验总结，帮助后续同学做选校参考。')).toBeInTheDocument()
    const submitModal = screen.getByRole('heading', { name: '提交录取案例' }).closest('.v2-modal-card')
    const modalQueries = within(submitModal)

    fireEvent.change(modalQueries.getByLabelText('本科专业'), { target: { value: 'CS' } })
    fireEvent.change(modalQueries.getByLabelText('GPA'), { target: { value: '3.8' } })
    fireEvent.change(modalQueries.getByLabelText('语言成绩'), { target: { value: '7.0' } })
    fireEvent.change(modalQueries.getByLabelText('学校'), { target: { value: 'UCL' } })
    fireEvent.change(modalQueries.getByLabelText('项目'), { target: { value: 'MSc CS' } })
    fireEvent.change(modalQueries.getByLabelText('总结'), { target: { value: '录取复盘' } })
    fireEvent.change(modalQueries.getByLabelText('联系方式'), { target: { value: 'wechat-demo' } })
    fireEvent.click(modalQueries.getByRole('button', { name: '提交案例' }))

    await waitFor(() => {
      expect(apiMocks.studyAbroadApi.createAdmissionCase).toHaveBeenCalledWith(
        expect.objectContaining({ contact: 'wechat-demo' }),
        'remote-token',
      )
    })
  })

  it('opens the project compare rail from the split programs page', async () => {
    apiMocks.studyAbroadApi.schoolProgramsPage.mockResolvedValue({
      content: [
        { id: 1, country: 'UK', schoolName: 'UCL', programName: 'MSc CS', degree: 'Master', subjectArea: 'Computer Science' },
        { id: 2, country: 'Singapore', schoolName: 'NUS', programName: 'MSc AI', degree: 'Master', subjectArea: 'Data Science' },
      ],
      totalPages: 1,
      totalElements: 2,
    })

    renderPage(<StudyAbroadProgramsPage />)

    expect(await screen.findByText('UCL')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('选择 UCL 对比'))
    fireEvent.click(screen.getByLabelText('选择 NUS 对比'))

    expect(screen.getByText('项目对比')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '放大查看' }))
    expect(screen.getByTestId('studyabroad-program-compare-modal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '已选院校项目对比' })).toBeInTheDocument()
  })

  it('creates study abroad applications through the drawer', async () => {
    apiMocks.studyAbroadApi.applications.mockResolvedValue([])
    apiMocks.studyAbroadApi.createApplication.mockResolvedValue({
      id: 61,
      country: 'UK',
      school: 'UCL',
      program: 'MSc CS',
      degree: 'Master',
      intake: '2027 Fall',
      applicationRound: 'Round 1',
      deadline: '2026-07-31',
      status: 'planning',
      priority: 'match',
      note: '',
    })

    renderPage(<StudyAbroadApplicationsPage />)

    fireEvent.click(await screen.findByRole('button', { name: '新建申请' }))
    fireEvent.change(screen.getByLabelText('院校'), { target: { value: 'UCL' } })
    fireEvent.change(screen.getByLabelText('专业'), { target: { value: 'MSc CS' } })
    fireEvent.click(screen.getByRole('button', { name: '保存申请' }))

    await waitFor(() => {
      expect(apiMocks.studyAbroadApi.createApplication).toHaveBeenCalledWith(
        expect.objectContaining({ school: 'UCL', program: 'MSc CS' }),
        'remote-token',
      )
    })
  })

  it('creates timeline items through the split timeline page modal', async () => {
    apiMocks.studyAbroadApi.applications.mockResolvedValue([
      { id: 71, country: 'UK', school: 'UCL', program: 'MSc CS', degree: 'Master', intake: '2027 Fall', applicationRound: 'Round 1', deadline: '2026-08-01', status: 'planning', priority: 'match', note: '' },
    ])
    apiMocks.studyAbroadApi.timeline.mockResolvedValue([])
    apiMocks.studyAbroadApi.createTimeline.mockResolvedValue({
      id: 91,
      title: '完成 PS 二稿',
      country: 'UK',
      school: 'UCL',
      phase: 'Documents',
      dueDate: '2026-07-20',
      status: 'todo',
      note: '',
    })

    renderPage(<StudyAbroadTimelinePage />)

    fireEvent.click(await screen.findByRole('button', { name: '新增节点' }))
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '完成 PS 二稿' } })
    fireEvent.click(screen.getByRole('button', { name: '保存节点' }))

    await waitFor(() => {
      expect(apiMocks.studyAbroadApi.createTimeline).toHaveBeenCalledWith(
        expect.objectContaining({ title: '完成 PS 二稿' }),
        'remote-token',
      )
    })
  })

  it('manages material attachment uploads from the split materials page', async () => {
    apiMocks.studyAbroadApi.applications.mockResolvedValue([
      { id: 71, country: 'UK', school: 'UCL', program: 'MSc CS', degree: 'Master', intake: '2027 Fall', applicationRound: 'Round 1', deadline: '2026-08-01', status: 'planning', priority: 'match', note: '' },
    ])
    apiMocks.studyAbroadApi.materials.mockResolvedValue([
      { id: 81, title: 'PS', country: 'UK', stage: 'Documents', category: '申请材料', deadline: '2026-07-20', completed: false, note: '', attachments: [] },
    ])
    apiMocks.studyAbroadApi.uploadMaterialAttachments.mockResolvedValue({
      id: 81,
      title: 'PS',
      country: 'UK',
      stage: 'Documents',
      category: '申请材料',
      deadline: '2026-07-20',
      completed: false,
      note: '',
      attachments: [{ id: 301, originalName: 'ps.pdf', fileSize: 2048 }],
    })

    renderPage(<StudyAbroadMaterialsPage />)

    expect(await screen.findByText('PS')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('上传附件'), {
      target: {
        files: [new File(['demo'], 'ps.pdf', { type: 'application/pdf' })],
      },
    })

    await waitFor(() => {
      expect(apiMocks.studyAbroadApi.uploadMaterialAttachments).toHaveBeenCalled()
    })
    expect(await screen.findByText('ps.pdf')).toBeInTheDocument()
  })
})
