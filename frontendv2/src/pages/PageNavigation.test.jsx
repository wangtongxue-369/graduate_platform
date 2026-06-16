import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App.jsx'
import KaoyanSchoolsPage from '@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'
import { AdminKaoyanPage } from '@/pages/admin/AdminMainPage.jsx'
import { AdminCommunityReviewsPage } from '@/pages/admin/AdminCommunityPages.jsx'
import SettingsSecurityPage from '@/pages/settings/SettingsSecurityPage.jsx'

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    name: '考研测试用户',
    role: 'user',
    target: 'kaoyan',
  },
  token: 'dev-token',
  isAuthed: true,
  loading: false,
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  kaogongApi: {
    favoriteJobs: vi.fn(),
    favoriteScoreLines: vi.fn(),
    mySubscriptions: vi.fn(),
    calendarExamGroupsPage: vi.fn(),
    myInterviewRooms: vi.fn(),
    interviewMessagesPage: vi.fn(),
    matchJobs: vi.fn(),
    jobMatchHistory: vi.fn(),
    scoreLinesPage: vi.fn(),
    notifications: vi.fn(),
    interviewRoomsPage: vi.fn(),
    interviewFeedbackPage: vi.fn(),
    interviewRooms: vi.fn(),
    interviewAttachmentsPage: vi.fn(),
    interviewRoomStreamUrl: vi.fn(() => 'http://localhost/kaogong-room-stream'),
  },
  kaoyanApi: {
    schoolsPage: vi.fn(),
    scoreLinesPage: vi.fn(),
    favoriteScoreLine: vi.fn(),
    unfavoriteScoreLine: vi.fn(),
    favoriteScoreLines: vi.fn(),
  },
  materialApi: {
    listPage: vi.fn(),
    myMaterials: vi.fn(),
    detail: vi.fn(),
    downloadUrl: vi.fn(() => '#'),
  },
  mentorApi: {
    mentorsPage: vi.fn(),
    unreadCount: vi.fn(),
  },
  studyRoomApi: {
    roomList: vi.fn(),
  },
  studyPlanApi: {
    myPlans: vi.fn(),
  },
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
  it('shows a return path on practice bank preview pages', async () => {
    render(
      <MemoryRouter initialEntries={['/practice/banks/1']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: '题库目录' })).toHaveAttribute('href', '/practice')
  })

  it('shows a return path on direction child pages', () => {
    render(
      <MemoryRouter>
        <KaoyanSchoolsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '考研主站' })).toHaveAttribute('href', '/station/kaoyan')
  })

  it('renders the new deep kaoyan student route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/station/kaoyan/materials/mine']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '我的资料状态按旧版工作流拆回待审、通过、拒绝与全部视角，方便追踪每份资料的流转。',
      }),
    ).toBeInTheDocument()
  })

  it('keeps kaoyan navigation grouped while pointing to the new route hubs', async () => {
    render(
      <MemoryRouter initialEntries={['/station/kaoyan']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: '择校账本' })).toHaveAttribute('href', '/station/kaoyan/schools')
    expect(screen.getByRole('link', { name: '计划轨道' })).toHaveAttribute('href', '/station/kaoyan/plans')
    expect(screen.getByRole('link', { name: '资料中枢' })).toHaveAttribute('href', '/station/kaoyan/materials')
    expect(screen.getByRole('link', { name: '1v1 咨询' })).toHaveAttribute('href', '/station/kaoyan/support/mentors')
    expect(screen.getByRole('link', { name: '同频自习室' })).toHaveAttribute('href', '/station/kaoyan/support/rooms')
    expect(screen.queryByRole('link', { name: '陪跑协同' })).not.toBeInTheDocument()
  })

  it('renders the dedicated kaogong interview room route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/station/kaogong/interviews/rooms/7']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '模拟面试房间',
      }),
    ).toBeInTheDocument()
  })

  it('keeps kaogong navigation grouped while pointing to the student route hubs', async () => {
    render(
      <MemoryRouter initialEntries={['/station/kaogong']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: '考公总览' })).toHaveAttribute('href', '/station/kaogong')
    expect(screen.getByRole('link', { name: '岗位匹配' })).toHaveAttribute('href', '/station/kaogong/jobs')
    expect(screen.getByRole('link', { name: '分数线账本' })).toHaveAttribute('href', '/station/kaogong/score-lines')
    expect(screen.getByRole('link', { name: '考试日历' })).toHaveAttribute('href', '/station/kaogong/calendar')
    expect(screen.getByRole('link', { name: '模拟面试' })).toHaveAttribute('href', '/station/kaogong/interviews')
  })

  it('uses the current station route for sidebar grouping instead of the default target', async () => {
    authState.user = { id: 1, name: '跨站测试用户', role: 'user', target: 'kaogong' }

    render(
      <MemoryRouter initialEntries={['/station/kaoyan']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('link', { name: '考研总览' })).toHaveAttribute('href', '/station/kaoyan')
    expect(screen.queryByRole('link', { name: '考公总览' })).not.toBeInTheDocument()
  })

  it('shows a return path on admin child pages', () => {
    authState.user = { id: 1, name: '治理测试用户', role: 'admin', target: 'kaoyan' }

    render(
      <MemoryRouter>
        <AdminKaoyanPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '管理员主站' })).toHaveAttribute('href', '/admin')
  })

  it('keeps community governance pages inside the admin community route tree', () => {
    authState.user = { id: 1, name: '治理测试用户', role: 'admin', target: 'kaoyan' }

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

  it('renders the new practice history route from the app router', async () => {
    render(
      <MemoryRouter initialEntries={['/practice/history']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '练习历史',
      }),
    ).toBeInTheDocument()
  })

  it('shows the dedicated admin question-bank workspace route', async () => {
    authState.user = { id: 9, name: '治理测试用户', role: 'admin', target: 'job' }

    render(
      <MemoryRouter initialEntries={['/admin/question-banks/12']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '题库工作区',
      }),
    ).toBeInTheDocument()
  })

  it('renders the split student resume route from its own page module', async () => {
    authState.user = { id: 10, name: '就业测试用户', role: 'user', target: 'job' }

    render(
      <MemoryRouter initialEntries={['/station/job/resume']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '简历中心',
      }),
    ).toBeInTheDocument()
  })

  it('renders the dedicated admin employment route instead of the generic admin placeholder', async () => {
    authState.user = { id: 11, name: '就业管理员', role: 'admin', target: 'job' }

    render(
      <MemoryRouter initialEntries={['/admin/employment']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: '就业运营总台',
      }),
    ).toBeInTheDocument()
  })
})
