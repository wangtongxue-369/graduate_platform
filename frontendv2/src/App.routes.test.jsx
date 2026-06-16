import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const authState = {
  loading: false,
  isAuthed: false,
  user: null,
}

function createShell(name) {
  return function ShellMock() {
    return (
      <div data-testid={name}>
        <Outlet />
      </div>
    )
  }
}

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@/layouts/PublicShell.jsx', () => ({
  default: createShell('public-shell'),
}))

vi.mock('@/layouts/CommonShell.jsx', () => ({
  default: createShell('common-shell'),
}))

vi.mock('@/layouts/StudentShell.jsx', () => ({
  default: createShell('student-shell'),
}))

vi.mock('@/layouts/AdminShell.jsx', () => ({
  default: createShell('admin-shell'),
}))

vi.mock('@/layouts/SettingsShell.jsx', () => ({
  default: createShell('settings-shell'),
}))

vi.mock('@/pages/auth/AuthLandingPage.jsx', () => ({
  default: function AuthLandingPageMock() {
    return <h1>auth landing</h1>
  },
}))

vi.mock('@/pages/community/CommunityComposerPage.jsx', () => ({
  default: function CommunityComposerPageMock() {
    return <h1>community composer</h1>
  },
}))

vi.mock('@/pages/settings/SettingsPostEditPage.jsx', () => ({
  default: function SettingsPostEditPageMock() {
    return <h1>settings post editor</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadOverviewPage.jsx', () => ({
  default: function StudyAbroadOverviewPageMock() {
    return <h1>留学总览</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadProgramsPage.jsx', () => ({
  default: function StudyAbroadProgramsPageMock() {
    return <h1>院校项目库</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadCasesPage.jsx', () => ({
  default: function StudyAbroadCasesPageMock() {
    return <h1>录取案例库</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadApplicationsPage.jsx', () => ({
  default: function StudyAbroadApplicationsPageMock() {
    return <h1>申请项目管理</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadTimelinePage.jsx', () => ({
  default: function StudyAbroadTimelinePageMock() {
    return <h1>申请时间线</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadMaterialsPage.jsx', () => ({
  default: function StudyAbroadMaterialsPageMock() {
    return <h1>材料清单</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadExperiencesPage.jsx', () => ({
  default: function StudyAbroadExperiencesPageMock() {
    return <h1>留学经验库</h1>
  },
}))

vi.mock('@/pages/admin/AdminStudyAbroadOverviewPage.jsx', () => ({
  default: function AdminStudyAbroadOverviewPageMock() {
    return <h1>留学运营总览</h1>
  },
}))

function renderApp(initialEntries) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  )
}

describe('frontendv2 route gating', () => {
  beforeEach(() => {
    authState.loading = false
    authState.isAuthed = false
    authState.user = null
  })

  it('shows auth landing at the root for guests', async () => {
    renderApp(['/'])

    expect(await screen.findByRole('heading', { name: 'auth landing' })).toBeInTheDocument()
  })

  it('allows authenticated users to enter the community composer route', async () => {
    authState.isAuthed = true
    authState.user = { id: 1, name: 'Test User', role: 'user', target: 'kaoyan' }

    renderApp(['/community/new'])

    expect(await screen.findByRole('heading', { name: 'community composer' })).toBeInTheDocument()
  })

  it('allows authenticated users to open the settings post editor route', async () => {
    authState.isAuthed = true
    authState.user = { id: 1, name: 'Test User', role: 'user', target: 'kaoyan' }

    renderApp(['/settings/posts/101/edit'])

    expect(await screen.findByRole('heading', { name: 'settings post editor' })).toBeInTheDocument()
  })

  it('shows a visible loading placeholder while auth is bootstrapping', () => {
    authState.loading = true

    renderApp(['/app'])

    expect(screen.getByRole('status', { name: 'app-loading' })).toBeInTheDocument()
  })

  it('routes students into the split study abroad experiences page', async () => {
    authState.isAuthed = true
    authState.user = { id: 7, name: 'Test User', role: 'user', target: 'liuxue' }

    renderApp(['/station/studyabroad/experiences'])

    expect(await screen.findByRole('heading', { name: '留学经验库' })).toBeInTheDocument()
  })

  it('redirects legacy study abroad experience URLs into frontend v2 routes', async () => {
    authState.isAuthed = true
    authState.user = { id: 7, name: 'Test User', role: 'user', target: 'liuxue' }

    renderApp(['/studyabroad/experience'])

    expect(await screen.findByRole('heading', { name: '留学经验库' })).toBeInTheDocument()
  })

  it('routes admins into the study abroad overview console', async () => {
    authState.isAuthed = true
    authState.user = { id: 1, name: 'Admin', role: 'admin', target: 'job' }

    renderApp(['/admin/studyabroad'])

    expect(await screen.findByRole('heading', { name: '留学运营总览' })).toBeInTheDocument()
  })
})
