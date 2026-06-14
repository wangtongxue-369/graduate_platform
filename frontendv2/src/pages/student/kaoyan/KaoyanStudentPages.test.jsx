import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaoyanSchoolsPage from '@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'
import KaoyanSchoolFavoritesPage from '@/pages/student/kaoyan/KaoyanSchoolFavoritesPage.jsx'
import KaoyanPlanDetailPage from '@/pages/student/kaoyan/KaoyanPlanDetailPage.jsx'
import KaoyanMyMaterialsPage from '@/pages/student/kaoyan/KaoyanMyMaterialsPage.jsx'
import KaoyanMaterialDetailPage from '@/pages/student/kaoyan/KaoyanMaterialDetailPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 9,
    name: '考研测试用户',
    role: 'user',
    target: 'kaoyan',
  },
  token: 'remote-token',
}))

const apiMocks = vi.hoisted(() => ({
  kaoyanApi: {
    schoolsPage: vi.fn(),
    scoreLinesPage: vi.fn(),
    favoriteScoreLines: vi.fn(),
    favoriteScoreLine: vi.fn(),
    unfavoriteScoreLine: vi.fn(),
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
    myMaterials: vi.fn(),
    detail: vi.fn(),
    downloadUrl: vi.fn((materialId, attachmentId) => `/api/kaoyan/materials/${materialId}/attachments/${attachmentId}/download`),
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

function renderRoute(initialEntry, routePath, element) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path={routePath} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('kaoyan student split pages', () => {
  beforeEach(() => {
    authState.token = 'remote-token'
    authState.user = {
      id: 9,
      name: '考研测试用户',
      role: 'user',
      target: 'kaoyan',
    }

    Object.values(apiMocks).forEach((group) => {
      Object.values(group).forEach((fn) => {
        if (typeof fn?.mockReset === 'function') fn.mockReset()
      })
    })
  })

  it('renders school ledger rows from backend data', async () => {
    apiMocks.kaoyanApi.schoolsPage.mockResolvedValue({
      content: [
        {
          id: 1,
          name: '浙江大学',
          region: '华东',
          province: '浙江',
          is985: true,
          is211: true,
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
          favorite: false,
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaoyanSchoolsPage />)

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.schoolsPage).toHaveBeenCalled()
      expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalled()
    })
    expect(await screen.findByText('浙江大学')).toBeInTheDocument()
    expect(screen.getByText('计算机科学与技术')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '收藏分数线' })).toBeInTheDocument()
  })

  it('renders favorite score lines from backend data', async () => {
    apiMocks.kaoyanApi.favoriteScoreLines.mockResolvedValue([
      {
        id: 11,
        schoolId: 1,
        schoolName: '浙江大学',
        majorName: '计算机科学与技术',
        majorCategory: '工学',
        year: 2025,
        totalScoreLine: 390,
        note: '复试名单发布时间稳定',
      },
    ])

    renderPage(<KaoyanSchoolFavoritesPage />)

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.favoriteScoreLines).toHaveBeenCalledWith('remote-token')
    })
    expect(await screen.findByText('浙江大学')).toBeInTheDocument()
    expect(screen.getByText('计算机科学与技术')).toBeInTheDocument()
    expect(screen.getByText(/总分线 390/)).toBeInTheDocument()
  })

  it('renders plan detail and check-ins from backend data', async () => {
    apiMocks.studyPlanApi.planDetail.mockResolvedValue({
      id: 41,
      name: '7月冲刺计划',
      description: '英语 + 专业课',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      totalDurationHours: 90,
      completionRate: 42,
      status: '进行中',
    })
    apiMocks.studyPlanApi.checkIns.mockResolvedValue([
      {
        id: 81,
        checkInDate: '2026-07-03',
        durationHours: 3,
        remark: '阅读两篇',
      },
    ])

    renderRoute('/station/kaoyan/plans/41', '/station/kaoyan/plans/:planId', <KaoyanPlanDetailPage />)

    await waitFor(() => {
      expect(apiMocks.studyPlanApi.planDetail).toHaveBeenCalledWith('41', 'remote-token')
      expect(apiMocks.studyPlanApi.checkIns).toHaveBeenCalledWith('41', 'remote-token')
    })
    expect(await screen.findByRole('heading', { name: '7月冲刺计划' })).toBeInTheDocument()
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('阅读两篇')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存打卡' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '删除打卡' })).toBeInTheDocument()
  })

  it('renders my materials by review status from backend data', async () => {
    apiMocks.materialApi.myMaterials.mockResolvedValue({
      content: [
        {
          id: 101,
          title: '政治冲刺笔记',
          status: 'PENDING',
          school: '华东师范大学',
          major: '教育学',
          description: '适合 9 月后使用',
          attachments: [],
        },
      ],
      totalElements: 1,
      totalPages: 1,
    })

    renderPage(<KaoyanMyMaterialsPage />)

    await waitFor(() => {
      expect(apiMocks.materialApi.myMaterials).toHaveBeenCalledWith(
        { status: 'PENDING', page: 0, size: 12 },
        'remote-token',
      )
    })
    expect(await screen.findByText('政治冲刺笔记')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'PENDING' })).toBeInTheDocument()
    expect(screen.getByText('华东师范大学 / 教育学')).toBeInTheDocument()
  })

  it('renders material attachments from backend detail data', async () => {
    apiMocks.materialApi.detail.mockResolvedValue({
      id: 101,
      title: '政治冲刺笔记',
      description: '适合 9 月后使用',
      school: '华东师范大学',
      major: '教育学',
      subject: '政治',
      materialType: '笔记',
      year: '2025',
      attachments: [
        {
          id: 301,
          originalName: 'notes.pdf',
          fileSize: 2048,
        },
      ],
    })

    renderRoute('/station/kaoyan/materials/101', '/station/kaoyan/materials/:materialId', <KaoyanMaterialDetailPage />)

    await waitFor(() => {
      expect(apiMocks.materialApi.detail).toHaveBeenCalledWith('101', 'remote-token')
    })
    expect(await screen.findByRole('heading', { name: '政治冲刺笔记' })).toBeInTheDocument()
    expect(screen.getByText('notes.pdf')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '下载附件' })).toHaveAttribute(
      'href',
      '/api/kaoyan/materials/101/attachments/301/download',
    )
  })
})
