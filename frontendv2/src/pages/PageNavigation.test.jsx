import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PracticeBankPreviewPage } from '@/pages/practice/PracticeDirectoryPage.jsx'
import { KaoyanSchoolsPage } from '@/pages/student/kaoyan/KaoyanStationPage.jsx'
import { AdminKaoyanPage } from '@/pages/admin/AdminMainPage.jsx'
import { AdminCommunityReviewsPage } from '@/pages/admin/AdminCommunityPages.jsx'
import SettingsSecurityPage from '@/pages/settings/SettingsSecurityPage.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: '考研测试用户',
      role: 'admin',
      target: 'kaoyan',
    },
    token: 'dev-token',
    isAuthed: true,
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  adminApi: {
    reviewList: vi.fn(),
  },
  userApi: {
    profile: vi.fn(),
  },
}))

vi.mock('@/components/markdown/FrontendV2MarkdownContent.jsx', () => ({
  default: function FrontendV2MarkdownContentMock({ content }) {
    return <div>{content}</div>
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

  it('keeps community governance pages inside the admin community route tree', () => {
    render(
      <MemoryRouter>
        <AdminCommunityReviewsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '返回治理总览' })).toHaveAttribute('href', '/admin/community')
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
