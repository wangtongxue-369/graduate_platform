import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StudyAbroadActionPanel from '@/components/studyabroad/StudyAbroadActionPanel.jsx'
import StudyAbroadApplicationsPage from '@/pages/student/studyabroad/StudyAbroadApplicationsPage.jsx'
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
      content: [],
      totalPages: 1,
      totalElements: 0,
    })

    renderPage(<StudyAbroadExperiencesPage />)

    expect(await screen.findByRole('heading', { name: '把可复用的申请经验沉淀成可筛选、可阅读、可维护的经验流。' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '发布经验' })).toBeInTheDocument()
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
