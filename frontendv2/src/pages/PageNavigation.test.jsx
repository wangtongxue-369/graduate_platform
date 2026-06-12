import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PracticeBankPreviewPage } from '@/pages/practice/PracticeDirectoryPage.jsx'
import { KaoyanSchoolsPage } from '@/pages/student/kaoyan/KaoyanStationPage.jsx'
import { AdminKaoyanPage } from '@/pages/admin/AdminMainPage.jsx'
import { AdminCommunityPage } from '@/pages/admin/AdminMainPage.jsx'
import SettingsSecurityPage from '@/pages/settings/SettingsSecurityPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: '考研测试用户',
      role: 'user',
      target: 'kaoyan',
    },
    token: 'dev-token',
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  userApi: {
    profile: vi.fn(),
  },
}))

describe('page-level return paths', () => {
  it('shows a return path on practice bank preview pages', () => {
    render(
      <MemoryRouter initialEntries={['/practice/banks/1']}>
        <Routes>
          <Route path="/practice/banks/:bankId" element={<PracticeBankPreviewPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '题库目录' })).toHaveAttribute('href', '/practice')
  })

  it('shows a return path on direction child pages', () => {
    render(
      <MemoryRouter>
        <KaoyanSchoolsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '考研主站' })).toHaveAttribute('href', '/station/kaoyan')
  })

  it('shows a return path on admin child pages', () => {
    render(
      <MemoryRouter>
        <AdminKaoyanPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '管理员主站' })).toHaveAttribute('href', '/admin')
  })

  it('uses rightbar filters to control admin governance results', () => {
    render(
      <MemoryRouter>
        <AdminCommunityPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('检索队列'), {
      target: { value: '评论' },
    })

    expect(screen.getAllByText('待核评论').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('待审帖子')).toHaveLength(0)
  })

  it('shows a return path on settings child pages', () => {
    render(
      <MemoryRouter>
        <SettingsSecurityPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '个人设置' })).toHaveAttribute('href', '/settings/profile')
  })
})
