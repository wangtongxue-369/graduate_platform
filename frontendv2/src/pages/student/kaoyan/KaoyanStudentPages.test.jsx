import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import KaoyanSchoolsPage from '@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'
import KaoyanSchoolFavoritesPage from '@/pages/student/kaoyan/KaoyanSchoolFavoritesPage.jsx'
import KaoyanMaterialsPage from '@/pages/student/kaoyan/KaoyanMaterialsPage.jsx'
import KaoyanMaterialUploadPage from '@/pages/student/kaoyan/KaoyanMaterialUploadPage.jsx'
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
    listPage: vi.fn(),
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

  it('applies sidebar filters on submit and opens compare modal at two selections', async () => {
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
        {
          id: 2,
          name: '复旦大学',
          region: '华东',
          province: '上海',
          is985: true,
          is211: true,
          schoolType: '综合',
        },
      ],
      totalElements: 2,
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
        {
          id: 12,
          schoolId: 2,
          schoolName: '复旦大学',
          year: 2025,
          majorCategory: '理学',
          majorName: '软件工程',
          totalScoreLine: 385,
          politicsLine: 58,
          foreignLangLine: 60,
          subject1Line: 102,
          subject2Line: 121,
          plannedEnrollment: 20,
          actualApplicants: 150,
          admissionRatio: 7.5,
          favorite: false,
        },
      ],
      totalElements: 2,
      totalPages: 1,
    })

    renderPage(<KaoyanSchoolsPage />)

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.schoolsPage).toHaveBeenCalled()
      expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalled()
    })
    expect(await screen.findByText('浙江大学')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '院校' })).toBeInTheDocument()
    expect(screen.getByLabelText('年份')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('年份'), {
      target: { value: '2025' },
    })
    expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: '应用筛选' }))
    await waitFor(() => {
      expect(apiMocks.kaoyanApi.scoreLinesPage).toHaveBeenCalledTimes(2)
    })

    fireEvent.click(screen.getByLabelText('选择 浙江大学 对比'))
    fireEvent.click(screen.getByLabelText('选择 复旦大学 对比'))
    fireEvent.click(screen.getByRole('button', { name: '对比 2 项' }))

    expect(screen.getByText('分数线对比')).toBeInTheDocument()
    expect(screen.getByText('报考人数')).toBeInTheDocument()
  })

  it('renders favorite score lines with table-aligned fields from backend data', async () => {
    apiMocks.kaoyanApi.favoriteScoreLines.mockResolvedValue([
      {
        id: 11,
        schoolId: 1,
        schoolName: '浙江大学',
        majorName: '计算机科学与技术',
        majorCategory: '工学',
        year: 2025,
        totalScoreLine: 390,
        plannedEnrollment: 28,
        admissionRatio: 6.2,
        actualApplicants: 174,
        note: '复试名单发布时间稳定',
        source: '研招网',
      },
    ])

    renderPage(<KaoyanSchoolFavoritesPage />)

    await waitFor(() => {
      expect(apiMocks.kaoyanApi.favoriteScoreLines).toHaveBeenCalledWith('remote-token')
    })
    expect(await screen.findByText('浙江大学')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '院校' })).toBeInTheDocument()
    expect(screen.getByText('计算机科学与技术')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('6.2:1')).toBeInTheDocument()
  })

  it('renders the old-frontend calendar workspace and only exposes check-in on today', async () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const fourDaysAgo = new Date(today)
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)
    const toDateKey = (value) => {
      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      const d = String(value.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12)

    const todayKey = toDateKey(today)
    const yesterdayKey = toDateKey(yesterday)
    const fourDaysAgoKey = toDateKey(fourDaysAgo)

    {
      apiMocks.studyPlanApi.planDetail.mockResolvedValue({
        id: 41,
        name: '7月冲刺计划',
        description: '英语 + 专业课',
        startDate: toDateKey(firstDayOfMonth),
        endDate: toDateKey(lastDayOfMonth),
        totalDurationHours: 90,
        plannedDurationHours: 120,
        completionRate: 42,
        status: '进行中',
      })
      apiMocks.studyPlanApi.checkIns.mockResolvedValue([
        {
          id: 81,
          checkInDate: fourDaysAgoKey,
          durationHours: 1,
          remark: '单词复盘',
        },
        {
          id: 82,
          checkInDate: yesterdayKey,
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
      expect(screen.getByText('连续打卡天数')).toBeInTheDocument()
      expect(screen.getByText('总打卡天数')).toBeInTheDocument()
      expect(screen.getByText('总打卡时长')).toBeInTheDocument()
      expect(screen.getByText('完成率')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: `选择 ${yesterdayKey}` }))
      expect(screen.getByText('阅读两篇')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '打卡' })).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: `选择 ${todayKey}` }))
      expect(screen.getByRole('button', { name: '打卡' })).toBeInTheDocument()
      expect(screen.getByText('暂无打卡记录')).toBeInTheDocument()
    }
  })

  it('submits today check-ins through a modal and restores edit/delete actions', async () => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12)
    const toDateKey = (value) => {
      const y = value.getFullYear()
      const m = String(value.getMonth() + 1).padStart(2, '0')
      const d = String(value.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const todayKey = toDateKey(today)
    const yesterdayKey = toDateKey(yesterday)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    apiMocks.studyPlanApi.planDetail
      .mockResolvedValueOnce({
        id: 41,
        name: '7月冲刺计划',
        description: '英语 + 专业课',
        startDate: toDateKey(firstDayOfMonth),
        endDate: toDateKey(lastDayOfMonth),
        totalDurationHours: 90,
        plannedDurationHours: 120,
        completionRate: 42,
      })
      .mockResolvedValueOnce({
        id: 41,
        name: '7月冲刺计划',
        description: '英语 + 专业课',
        startDate: toDateKey(firstDayOfMonth),
        endDate: toDateKey(lastDayOfMonth),
        totalDurationHours: 90,
        plannedDurationHours: 120,
        completionRate: 44,
      })
      .mockResolvedValueOnce({
        id: 41,
        name: '7月冲刺计划（调整）',
        description: '英语 + 专业课',
        startDate: toDateKey(firstDayOfMonth),
        endDate: toDateKey(lastDayOfMonth),
        totalDurationHours: 90,
        plannedDurationHours: 150,
        completionRate: 44,
      })
      .mockResolvedValueOnce({
        id: 41,
        name: '7月冲刺计划（调整）',
        description: '英语 + 专业课',
        startDate: toDateKey(firstDayOfMonth),
        endDate: toDateKey(lastDayOfMonth),
        totalDurationHours: 90,
        plannedDurationHours: 150,
        completionRate: 44,
      })

    apiMocks.studyPlanApi.checkIns
      .mockResolvedValueOnce([
        {
          id: 82,
          checkInDate: yesterdayKey,
          durationHours: 3,
          remark: '阅读两篇',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 82,
          checkInDate: yesterdayKey,
          durationHours: 3,
          remark: '阅读两篇',
        },
        {
          id: 84,
          checkInDate: todayKey,
          durationHours: 1.5,
          remark: '英语翻译',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 82,
          checkInDate: yesterdayKey,
          durationHours: 3,
          remark: '阅读两篇',
        },
        {
          id: 84,
          checkInDate: todayKey,
          durationHours: 1.5,
          remark: '英语翻译',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 84,
          checkInDate: todayKey,
          durationHours: 1.5,
          remark: '英语翻译',
        },
      ])

    render(
      <MemoryRouter initialEntries={['/station/kaoyan/plans/41']}>
        <Routes>
          <Route path="/station/kaoyan/plans/:planId" element={<KaoyanPlanDetailPage />} />
          <Route path="/station/kaoyan/plans" element={<div>计划列表占位</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '7月冲刺计划' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: `选择 ${todayKey}` }))
    fireEvent.click(screen.getByRole('button', { name: '打卡' }))
    fireEvent.click(screen.getByRole('button', { name: '确认打卡' }))
    expect(screen.getByText('请输入大于 0 的学习时长')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('学习时长（小时）'), { target: { value: '1.5' } })
    fireEvent.change(screen.getByLabelText('备注'), { target: { value: '英语翻译' } })
    fireEvent.click(screen.getByRole('button', { name: '确认打卡' }))

    await waitFor(() => {
      expect(apiMocks.studyPlanApi.addCheckIn).toHaveBeenCalledWith('41', {
        checkInDate: todayKey,
        durationHours: 1.5,
        remark: '英语翻译',
      }, 'remote-token')
    })
    expect(await screen.findByText('英语翻译')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '编辑计划' }))
    fireEvent.change(screen.getByLabelText('计划名称'), { target: { value: '7月冲刺计划（调整）' } })
    fireEvent.change(screen.getByLabelText('计划总时长（小时）'), { target: { value: '150' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    await waitFor(() => {
      expect(apiMocks.studyPlanApi.updatePlan).toHaveBeenCalledWith('41', {
        name: '7月冲刺计划（调整）',
        description: '英语 + 专业课',
        startDate: toDateKey(firstDayOfMonth),
        endDate: toDateKey(lastDayOfMonth),
        totalDurationHours: 150,
      }, 'remote-token')
    })
    expect(await screen.findByRole('heading', { name: '7月冲刺计划（调整）' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: `选择 ${yesterdayKey}` }))
    fireEvent.click(screen.getByRole('button', { name: '删除' }))

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('确定删除该打卡记录？')
      expect(apiMocks.studyPlanApi.deleteCheckIn).toHaveBeenCalledWith(82, 'remote-token')
    })

    fireEvent.click(screen.getByRole('button', { name: '删除计划' }))

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('确定删除该计划？')
      expect(apiMocks.studyPlanApi.deletePlan).toHaveBeenCalledWith('41', 'remote-token')
    })
    expect(await screen.findByText('计划列表占位')).toBeInTheDocument()

    confirmSpy.mockRestore()
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
        { page: 0, size: 10 },
        'remote-token',
      )
    })
    expect(await screen.findByText('政治冲刺笔记')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument()
    expect(screen.getByText('华东师范大学 / 教育学')).toBeInTheDocument()
  })

  it('supports the old frontend materials query flow with school and major filters plus pagination', async () => {
    apiMocks.materialApi.listPage
      .mockResolvedValueOnce({
        content: [
          {
            id: 101,
            title: '政治冲刺笔记',
            status: 'APPROVED',
            school: '华东师范大学',
            major: '教育学',
            subject: '政治',
            year: '2025',
            materialType: '笔记',
            description: '适合 9 月后使用',
            attachments: [{ id: 1 }],
            viewCount: 12,
            downloadCount: 5,
            createdAt: '2026-06-12T10:00:00',
          },
        ],
        totalElements: 13,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 101,
            title: '政治冲刺笔记',
            status: 'APPROVED',
            school: '华东师范大学',
            major: '教育学',
            subject: '政治',
            year: '2025',
            materialType: '笔记',
            description: '适合 9 月后使用',
            attachments: [{ id: 1 }],
            viewCount: 12,
            downloadCount: 5,
            createdAt: '2026-06-12T10:00:00',
          },
        ],
        totalElements: 13,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [
          {
            id: 102,
            title: '教育学真题整理',
            status: 'APPROVED',
            school: '华东师范大学',
            major: '教育学',
            subject: '政治',
            year: '2025',
            materialType: '真题',
            description: '第二页结果',
            attachments: [{ id: 2 }],
            viewCount: 8,
            downloadCount: 3,
            createdAt: '2026-06-10T10:00:00',
          },
        ],
        totalElements: 13,
        totalPages: 2,
      })

    renderPage(<KaoyanMaterialsPage />)

    expect(await screen.findByText('政治冲刺笔记')).toBeInTheDocument()
    expect(screen.getByLabelText('院校')).toBeInTheDocument()
    expect(screen.getByLabelText('专业')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('关键词'), { target: { value: '政治' } })
    fireEvent.change(screen.getByLabelText('院校'), { target: { value: '华东师范大学' } })
    fireEvent.change(screen.getByLabelText('专业'), { target: { value: '教育学' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(apiMocks.materialApi.listPage).toHaveBeenLastCalledWith({
        keyword: '政治',
        school: '华东师范大学',
        major: '教育学',
        subject: '',
        year: '',
        materialType: '',
        page: 0,
        size: 10,
      })
    })
    expect(screen.getByText('共 13 条')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    await waitFor(() => {
      expect(apiMocks.materialApi.listPage).toHaveBeenLastCalledWith({
        keyword: '政治',
        school: '华东师范大学',
        major: '教育学',
        subject: '',
        year: '',
        materialType: '',
        page: 1,
        size: 10,
      })
    })
    expect(await screen.findByText('教育学真题整理')).toBeInTheDocument()
  })

  it('validates upload file count before submitting', async () => {
    renderPage(<KaoyanMaterialUploadPage />)

    const files = Array.from({ length: 11 }, (_, index) => (
      new File(['demo'], `material-${index + 1}.pdf`, { type: 'application/pdf' })
    ))

    fireEvent.change(screen.getByLabelText('选择附件'), {
      target: { files },
    })

    expect(await screen.findByText('最多上传 10 个文件')).toBeInTheDocument()
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
