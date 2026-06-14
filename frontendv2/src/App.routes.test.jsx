import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

const authState = {
  loading: false,
  isAuthed: false,
  user: null,
}

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@/pages/community/CommunityHubPage.jsx', () => ({
  default: function CommunityHubPageMock() {
    return <h1>社区首页</h1>
  },
}))

vi.mock('@/pages/community/CommunityComposerPage.jsx', () => ({
  default: function CommunityComposerPageMock() {
    return <h1>发布帖子</h1>
  },
}))

vi.mock('@/pages/community/CommunityNotificationsPage.jsx', () => ({
  default: function CommunityNotificationsPageMock() {
    return <h1>社区通知</h1>
  },
}))

vi.mock('@/pages/community/CommunityPostPage.jsx', () => ({
  default: function CommunityPostPageMock() {
    return <h1>帖子详情</h1>
  },
}))

vi.mock('@/pages/practice/PracticeDirectoryPage.jsx', () => ({
  default: function PracticeDirectoryPageMock() {
    return <h1>题库目录</h1>
  },
  PracticeBankPreviewPage: function PracticeBankPreviewPageMock() {
    return <h1>题库预览</h1>
  },
}))

vi.mock('@/pages/admin/AdminMainPage.jsx', () => ({
  default: function AdminMainPageMock() {
    return <h1>管理员总台</h1>
  },
  AdminEmploymentPage: function AdminEmploymentPageMock() {
    return <h1>就业运营</h1>
  },
  AdminKaogongPage: function AdminKaogongPageMock() {
    return <h1>考公治理</h1>
  },
  AdminKaoyanPage: function AdminKaoyanPageMock() {
    return <h1>考研治理</h1>
  },
  AdminQuestionBanksPage: function AdminQuestionBanksPageMock() {
    return <h1>题库治理</h1>
  },
}))

vi.mock('@/pages/admin/AdminCommunityPages.jsx', () => ({
  AdminCommunityPage: function AdminCommunityPageMock() {
    return <h1>社区治理</h1>
  },
  AdminCommunityReviewsPage: function AdminCommunityReviewsPageMock() {
    return <h1>帖子审核</h1>
  },
  AdminCommunityPostReportsPage: function AdminCommunityPostReportsPageMock() {
    return <h1>帖子举报</h1>
  },
  AdminCommunityCommentReportsPage: function AdminCommunityCommentReportsPageMock() {
    return <h1>评论举报</h1>
  },
  AdminCommunityCategoriesPage: function AdminCommunityCategoriesPageMock() {
    return <h1>分类管理</h1>
  },
  AdminCommunityUsersPage: function AdminCommunityUsersPageMock() {
    return <h1>用户状态</h1>
  },
}))

vi.mock('@/pages/auth/AuthLandingPage.jsx', () => ({
  default: function AuthLandingPageMock() {
    return <h1>登录或注册后进入平台</h1>
  },
}))

vi.mock('@/pages/student/job/JobStationPage.jsx', () => ({
  default: function JobStationPageMock() {
    return <h1>就业主站</h1>
  },
  JobApplicationsPage: function JobApplicationsPageMock() {
    return <h1>投递跟踪</h1>
  },
  JobFairsPage: function JobFairsPageMock() {
    return <h1>招聘会目录</h1>
  },
  JobRecommendationsPage: function JobRecommendationsPageMock() {
    return <h1>岗位推荐</h1>
  },
  JobResumePage: function JobResumePageMock() {
    return <h1>简历中心</h1>
  },
}))

vi.mock('@/pages/student/kaoyan/KaoyanStationPage.jsx', () => ({
  default: function KaoyanStationPageMock() {
    return <h1>考研主站</h1>
  },
  KaoyanMaterialsPage: function KaoyanMaterialsPageMock() {
    return <h1>考研资料</h1>
  },
  KaoyanPlansPage: function KaoyanPlansPageMock() {
    return <h1>学习计划</h1>
  },
  KaoyanSchoolsPage: function KaoyanSchoolsPageMock() {
    return <h1>院校比较</h1>
  },
  KaoyanSupportPage: function KaoyanSupportPageMock() {
    return <h1>陪跑协同</h1>
  },
}))

vi.mock('@/pages/student/kaogong/KaogongStationPage.jsx', () => ({
  default: function KaogongStationPageMock() {
    return <h1>考公主站</h1>
  },
  KaogongCalendarPage: function KaogongCalendarPageMock() {
    return <h1>考试日历</h1>
  },
  KaogongInterviewsPage: function KaogongInterviewsPageMock() {
    return <h1>模拟面试</h1>
  },
  KaogongJobsPage: function KaogongJobsPageMock() {
    return <h1>岗位匹配</h1>
  },
  KaogongScoreLinesPage: function KaogongScoreLinesPageMock() {
    return <h1>分数线账本</h1>
  },
}))

vi.mock('@/pages/student/studyabroad/StudyAbroadStationPage.jsx', () => ({
  default: function StudyAbroadStationPageMock() {
    return <h1>留学主站</h1>
  },
  StudyAbroadApplicationsPage: function StudyAbroadApplicationsPageMock() {
    return <h1>申请跟踪</h1>
  },
  StudyAbroadCasesPage: function StudyAbroadCasesPageMock() {
    return <h1>案例档案</h1>
  },
  StudyAbroadMaterialsPage: function StudyAbroadMaterialsPageMock() {
    return <h1>材料清单</h1>
  },
  StudyAbroadProgramsPage: function StudyAbroadProgramsPageMock() {
    return <h1>项目目录</h1>
  },
  StudyAbroadTimelinePage: function StudyAbroadTimelinePageMock() {
    return <h1>时间线</h1>
  },
}))

vi.mock('@/pages/settings/SettingsProfilePage.jsx', () => ({
  default: function SettingsProfilePageMock() {
    return <h1>个人信息</h1>
  },
}))

vi.mock('@/pages/settings/SettingsPostsPage.jsx', () => ({
  default: function SettingsPostsPageMock() {
    return <h1>我的发帖</h1>
  },
}))

vi.mock('@/pages/settings/SettingsPostEditPage.jsx', () => ({
  default: function SettingsPostEditPageMock() {
    return <h1>帖子编辑</h1>
  },
}))

vi.mock('@/pages/settings/SettingsCommentsPage.jsx', () => ({
  default: function SettingsCommentsPageMock() {
    return <h1>我的评论</h1>
  },
}))

vi.mock('@/pages/settings/SettingsPracticePage.jsx', () => ({
  default: function SettingsPracticePageMock() {
    return <h1>练习记录</h1>
  },
}))

vi.mock('@/pages/settings/SettingsSecurityPage.jsx', () => ({
  default: function SettingsSecurityPageMock() {
    return <h1>安全中心</h1>
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

  it('shows auth landing at the root for guests', () => {
    renderApp(['/'])

    expect(screen.getByRole('heading', { name: '登录或注册后进入平台' })).toBeInTheDocument()
  })

  it('allows authenticated users to enter the new community child routes', () => {
    authState.isAuthed = true
    authState.user = { id: 1, name: '测试用户', role: 'user', target: 'kaoyan' }

    renderApp(['/community/new'])

    expect(screen.getByRole('heading', { name: '发布帖子' })).toBeInTheDocument()
  })

  it('allows authenticated users to open the settings post editor route', () => {
    authState.isAuthed = true
    authState.user = { id: 1, name: '测试用户', role: 'user', target: 'kaoyan' }

    renderApp(['/settings/posts/101/edit'])

    expect(screen.getByRole('heading', { name: '帖子编辑' })).toBeInTheDocument()
  })
})
