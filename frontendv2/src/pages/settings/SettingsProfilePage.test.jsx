import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SettingsProfilePage from '@/pages/settings/SettingsProfilePage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 7,
    username: 'chenxi',
    name: '陈曦',
    email: 'chenxi@example.com',
    phone: '13800000000',
    studentId: '20240007',
    target: 'kaoyan',
    school: '华东师范大学',
    major: '计算机科学与技术',
    grade: '2024',
    intentRegion: '上海',
    role: 'user',
    status: 'normal',
  },
  token: 'remote-token',
}))

const userApiMocks = vi.hoisted(() => ({
  profile: vi.fn(),
  dashboard: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  userApi: userApiMocks,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsProfilePage />
    </MemoryRouter>,
  )
}

describe('SettingsProfilePage', () => {
  beforeEach(() => {
    authState.user = {
      id: 7,
      username: 'chenxi',
      name: '陈曦',
      email: 'chenxi@example.com',
      phone: '13800000000',
      studentId: '20240007',
      target: 'kaoyan',
      school: '华东师范大学',
      major: '计算机科学与技术',
      grade: '2024',
      intentRegion: '上海',
      role: 'user',
      status: 'normal',
    }
    authState.token = 'remote-token'
    userApiMocks.profile.mockReset()
    userApiMocks.dashboard.mockReset()
    userApiMocks.updateProfile.mockReset()
  })

  it('allows saving profile edits through the backend and reflects the updated information', async () => {
    userApiMocks.profile.mockResolvedValue({
      ...authState.user,
      security: {
        lastLoginAt: '2026-06-11T20:30:00',
        lastDevice: 'Chrome / Windows',
        lastLocation: '上海',
      },
    })
    userApiMocks.dashboard.mockResolvedValue({
      postCount: 8,
      commentCount: 20,
      attemptCount: 34,
      checkinCount: 10,
    })
    userApiMocks.updateProfile.mockResolvedValue({
      ...authState.user,
      name: '陈曦（已更新）',
      school: '复旦大学',
      major: '软件工程',
      grade: '2025',
      target: 'job',
      intentRegion: '杭州',
      security: {
        lastLoginAt: '2026-06-11T20:30:00',
        lastDevice: 'Chrome / Windows',
        lastLocation: '上海',
      },
    })

    renderPage()

    await screen.findByText('陈曦')

    fireEvent.click(screen.getByRole('button', { name: '编辑资料' }))

    fireEvent.change(screen.getByLabelText('姓名'), {
      target: { value: '陈曦（已更新）' },
    })
    fireEvent.change(screen.getByLabelText('学校'), {
      target: { value: '复旦大学' },
    })
    fireEvent.change(screen.getByLabelText('专业'), {
      target: { value: '软件工程' },
    })
    fireEvent.change(screen.getByLabelText('年级'), {
      target: { value: '2025' },
    })
    fireEvent.change(screen.getByLabelText('方向'), {
      target: { value: 'job' },
    })
    fireEvent.change(screen.getByLabelText('意向地区'), {
      target: { value: '杭州' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存资料' }))

    await waitFor(() => {
      expect(userApiMocks.updateProfile).toHaveBeenCalledWith({
        name: '陈曦（已更新）',
        school: '复旦大学',
        major: '软件工程',
        grade: '2025',
        target: 'job',
        intentRegion: '杭州',
      }, 'remote-token')
    })

    expect(await screen.findByText('个人资料已更新。')).toBeInTheDocument()
    expect(screen.getByText('陈曦（已更新）')).toBeInTheDocument()
    expect(screen.getByText('复旦大学 / 软件工程')).toBeInTheDocument()
    expect(screen.getByText('2025 / 方向 就业')).toBeInTheDocument()
  })

  it('allows editing preview profile data locally when using the preview token', async () => {
    authState.token = 'dev-token'

    renderPage()

    expect(await screen.findByText('当前显示的是个人设置预览数据，用来观察真实资料页布局。')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '编辑资料' }))
    fireEvent.change(screen.getByLabelText('姓名'), {
      target: { value: '预览用户' },
    })
    fireEvent.change(screen.getByLabelText('学校'), {
      target: { value: '南京大学' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存资料' }))

    await screen.findByText('预览资料已更新，当前仍是本地预览效果。')

    expect(userApiMocks.updateProfile).not.toHaveBeenCalled()
    expect(screen.getByText('预览用户')).toBeInTheDocument()
    expect(screen.getByText('南京大学 / 计算机科学与技术')).toBeInTheDocument()
  })
})
