import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminEmploymentPage from './AdminEmploymentPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: '管理员',
    role: 'admin',
  },
  token: 'remote-token',
  isAuthed: true,
  loading: false,
}))

const apiMocks = vi.hoisted(() => ({
  adminEmploymentApi: {
    fairs: vi.fn(),
    createFair: vi.fn(),
    updateFair: vi.fn(),
    deleteFair: vi.fn(),
    jobs: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
    resumes: vi.fn(),
    triggerNotification: vi.fn(),
  },
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => apiMocks)

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminEmploymentPage />
    </MemoryRouter>,
  )
}

describe('admin employment page', () => {
  beforeEach(() => {
    authState.user = {
      id: 1,
      name: '管理员',
      role: 'admin',
    }
    authState.token = 'remote-token'
    authState.isAuthed = true
    authState.loading = false

    Object.values(apiMocks.adminEmploymentApi).forEach((fn) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
    })
  })

  it('renders the admin employment console with editing, triggering, and resume review flows', async () => {
    apiMocks.adminEmploymentApi.fairs.mockResolvedValue([
      {
        id: 11,
        title: '上海春招双选会',
        companyName: '星河科技',
        city: '上海',
        industry: '教育科技',
        targetRoles: '后端, 产品',
        location: '浦东会展中心',
        startTime: '2026-06-22T09:00:00',
        applyDeadline: '2026-06-21T18:00:00',
        active: true,
      },
    ])
    apiMocks.adminEmploymentApi.jobs.mockResolvedValue([
      {
        id: 21,
        title: '后端开发工程师',
        companyName: '星河科技',
        city: '上海',
        industry: '教育科技',
        companyType: '民企',
        roleType: '后端',
        salaryRange: '18k-24k',
        active: true,
      },
    ])
    apiMocks.adminEmploymentApi.resumes.mockResolvedValue([
      {
        name: '张三',
        studentId: '2026001',
        school: '华东师范大学',
        major: '软件工程',
        targetRole: '平台后端工程师',
        resumeFile: {
          hasFile: true,
          fileName: 'resume-final.pdf',
        },
      },
      {
        name: '李四',
        studentId: '2026002',
        school: '上海理工大学',
        major: '计算机科学与技术',
        targetRole: '前端开发工程师',
        resumeFile: {
          hasFile: false,
        },
      },
    ])
    apiMocks.adminEmploymentApi.updateFair.mockResolvedValue({ id: 11 })
    apiMocks.adminEmploymentApi.triggerNotification.mockResolvedValue({ successCount: 1 })

    const { container } = renderPage()

    expect(await screen.findByTestId('admin-employment-page')).toBeInTheDocument()
    expect(screen.getByText('已上传简历')).toBeInTheDocument()
    expect(container.querySelector('.v2-main-column .v2-admin-employment-source-list')).not.toBeNull()
    expect(container.querySelector('.v2-side-column .v2-admin-employment-source-list')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '上海春招双选会' }))
    expect(await screen.findByTestId('admin-employment-editor-panel')).toBeInTheDocument()
    fireEvent.change(screen.getByDisplayValue('上海春招双选会'), {
      target: { value: '上海春招双选会（已更新）' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存招聘会' }))

    await waitFor(() => {
      expect(apiMocks.adminEmploymentApi.updateFair).toHaveBeenCalledWith(
        11,
        expect.objectContaining({
          title: '上海春招双选会（已更新）',
        }),
        'remote-token',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: '提醒触发' }))
    expect(await screen.findByTestId('admin-employment-trigger-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '触发提醒' }))
    expect(screen.getByText('将按当前上下文向匹配学生发送一轮就业提醒。')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '确认触发' }))

    await waitFor(() => {
      expect(apiMocks.adminEmploymentApi.triggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          relatedType: 'FAIR',
          relatedId: 11,
        }),
        'remote-token',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: '简历状态' }))
    expect(screen.getAllByRole('button', { name: '选择' })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '张三' }))
    expect(await screen.findByTestId('admin-resume-status-drawer')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '已选中' })).toHaveLength(1)
    expect(screen.getByText('resume-final.pdf')).toBeInTheDocument()
  })

  it('creates fairs and jobs from the admin employment editor', async () => {
    apiMocks.adminEmploymentApi.fairs.mockResolvedValue([])
    apiMocks.adminEmploymentApi.jobs.mockResolvedValue([])
    apiMocks.adminEmploymentApi.resumes.mockResolvedValue([])
    apiMocks.adminEmploymentApi.createFair.mockResolvedValue({
      id: 31,
      title: '新增招聘会',
      companyName: '新增企业',
      active: true,
    })
    apiMocks.adminEmploymentApi.createJob.mockResolvedValue({
      id: 41,
      title: '新增岗位',
      companyName: '新增企业',
      active: true,
    })

    renderPage()

    expect(await screen.findByTestId('admin-employment-page')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '新增' }))
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '新增招聘会' },
    })
    fireEvent.change(screen.getByLabelText('企业名称'), {
      target: { value: '新增企业' },
    })
    fireEvent.click(screen.getByRole('button', { name: '创建招聘会' }))

    await waitFor(() => {
      expect(apiMocks.adminEmploymentApi.createFair).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新增招聘会',
          companyName: '新增企业',
        }),
        'remote-token',
      )
    })

    fireEvent.click(screen.getByRole('button', { name: '岗位台账' }))
    fireEvent.click(screen.getByRole('button', { name: '新增' }))
    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '新增岗位' },
    })
    fireEvent.change(screen.getByLabelText('企业名称'), {
      target: { value: '新增企业' },
    })
    fireEvent.click(screen.getByRole('button', { name: '创建岗位' }))

    await waitFor(() => {
      expect(apiMocks.adminEmploymentApi.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '新增岗位',
          companyName: '新增企业',
        }),
        'remote-token',
      )
    })
  })
})
