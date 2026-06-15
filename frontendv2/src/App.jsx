import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import AppBootScreen from '@/components/AppBootScreen.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'

const lazyDefault = (loader) => lazy(loader)
const lazyNamed = (loader, exportName) => lazy(
  () => loader().then((module) => ({ default: module[exportName] })),
)

const loadPublicShell = () => import('@/layouts/PublicShell.jsx')
const loadCommonShell = () => import('@/layouts/CommonShell.jsx')
const loadStudentShell = () => import('@/layouts/StudentShell.jsx')
const loadAdminShell = () => import('@/layouts/AdminShell.jsx')
const loadSettingsShell = () => import('@/layouts/SettingsShell.jsx')

const loadAuthLandingPage = () => import('@/pages/auth/AuthLandingPage.jsx')
const loadCommunityComposerPage = () => import('@/pages/community/CommunityComposerPage.jsx')
const loadCommunityHubPage = () => import('@/pages/community/CommunityHubPage.jsx')
const loadCommunityNotificationsPage = () => import('@/pages/community/CommunityNotificationsPage.jsx')
const loadCommunityPostPage = () => import('@/pages/community/CommunityPostPage.jsx')
const loadPracticeDirectoryPage = () => import('@/pages/practice/PracticeDirectoryPage.jsx')
const loadJobStationPage = () => import('@/pages/student/job/JobStationPage.jsx')
const loadKaogongStationPage = () => import('@/pages/student/kaogong/KaogongStationPage.jsx')
const loadStudyAbroadStationPage = () => import('@/pages/student/studyabroad/StudyAbroadStationPage.jsx')
const loadAdminMainPage = () => import('@/pages/admin/AdminMainPage.jsx')
const loadAdminCommunityPages = () => import('@/pages/admin/AdminCommunityPages.jsx')
const loadSettingsProfilePage = () => import('@/pages/settings/SettingsProfilePage.jsx')
const loadSettingsPostsPage = () => import('@/pages/settings/SettingsPostsPage.jsx')
const loadSettingsPostEditPage = () => import('@/pages/settings/SettingsPostEditPage.jsx')
const loadSettingsCommentsPage = () => import('@/pages/settings/SettingsCommentsPage.jsx')
const loadSettingsPracticePage = () => import('@/pages/settings/SettingsPracticePage.jsx')
const loadSettingsSecurityPage = () => import('@/pages/settings/SettingsSecurityPage.jsx')

const PublicShell = lazyDefault(loadPublicShell)
const CommonShell = lazyDefault(loadCommonShell)
const StudentShell = lazyDefault(loadStudentShell)
const AdminShell = lazyDefault(loadAdminShell)
const SettingsShell = lazyDefault(loadSettingsShell)

const AuthLandingPage = lazyDefault(loadAuthLandingPage)
const CommunityComposerPage = lazyDefault(loadCommunityComposerPage)
const CommunityHubPage = lazyDefault(loadCommunityHubPage)
const CommunityNotificationsPage = lazyDefault(loadCommunityNotificationsPage)
const CommunityPostPage = lazyDefault(loadCommunityPostPage)
const PracticeDirectoryPage = lazyDefault(loadPracticeDirectoryPage)
const PracticeBankPreviewPage = lazyNamed(loadPracticeDirectoryPage, 'PracticeBankPreviewPage')

const JobStationPage = lazyDefault(loadJobStationPage)
const JobApplicationsPage = lazyNamed(loadJobStationPage, 'JobApplicationsPage')
const JobFairsPage = lazyNamed(loadJobStationPage, 'JobFairsPage')
const JobRecommendationsPage = lazyNamed(loadJobStationPage, 'JobRecommendationsPage')
const JobResumePage = lazyNamed(loadJobStationPage, 'JobResumePage')

const KaogongStationPage = lazyDefault(loadKaogongStationPage)
const KaogongCalendarPage = lazyNamed(loadKaogongStationPage, 'KaogongCalendarPage')
const KaogongInterviewsPage = lazyNamed(loadKaogongStationPage, 'KaogongInterviewsPage')
const KaogongJobsPage = lazyNamed(loadKaogongStationPage, 'KaogongJobsPage')
const KaogongScoreLinesPage = lazyNamed(loadKaogongStationPage, 'KaogongScoreLinesPage')

const KaoyanOverviewPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanOverviewPage.jsx'))
const KaoyanSchoolsPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'))
const KaoyanSchoolFavoritesPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanSchoolFavoritesPage.jsx'))
const KaoyanPlansPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanPlansPage.jsx'))
const KaoyanPlanDetailPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanPlanDetailPage.jsx'))
const KaoyanMaterialsPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMaterialsPage.jsx'))
const KaoyanMaterialUploadPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMaterialUploadPage.jsx'))
const KaoyanMyMaterialsPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMyMaterialsPage.jsx'))
const KaoyanMaterialDetailPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMaterialDetailPage.jsx'))
const KaoyanSupportOverviewPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanSupportOverviewPage.jsx'))
const KaoyanMentorHallPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMentorHallPage.jsx'))
const KaoyanMentorApplyPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMentorApplyPage.jsx'))
const KaoyanMessagesPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanMessagesPage.jsx'))
const KaoyanStudyRoomsPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanStudyRoomsPage.jsx'))
const KaoyanStudyRoomPage = lazyDefault(() => import('@/pages/student/kaoyan/KaoyanStudyRoomPage.jsx'))

const StudyAbroadStationPage = lazyDefault(loadStudyAbroadStationPage)
const StudyAbroadApplicationsPage = lazyNamed(loadStudyAbroadStationPage, 'StudyAbroadApplicationsPage')
const StudyAbroadCasesPage = lazyNamed(loadStudyAbroadStationPage, 'StudyAbroadCasesPage')
const StudyAbroadMaterialsPage = lazyNamed(loadStudyAbroadStationPage, 'StudyAbroadMaterialsPage')
const StudyAbroadProgramsPage = lazyNamed(loadStudyAbroadStationPage, 'StudyAbroadProgramsPage')
const StudyAbroadTimelinePage = lazyNamed(loadStudyAbroadStationPage, 'StudyAbroadTimelinePage')

const AdminMainPage = lazyDefault(loadAdminMainPage)
const AdminEmploymentPage = lazyNamed(loadAdminMainPage, 'AdminEmploymentPage')
const AdminKaogongPage = lazyNamed(loadAdminMainPage, 'AdminKaogongPage')
const AdminQuestionBanksPage = lazyNamed(loadAdminMainPage, 'AdminQuestionBanksPage')

const AdminCommunityPage = lazyNamed(loadAdminCommunityPages, 'AdminCommunityPage')
const AdminCommunityReviewsPage = lazyNamed(loadAdminCommunityPages, 'AdminCommunityReviewsPage')
const AdminCommunityPostReportsPage = lazyNamed(loadAdminCommunityPages, 'AdminCommunityPostReportsPage')
const AdminCommunityCommentReportsPage = lazyNamed(loadAdminCommunityPages, 'AdminCommunityCommentReportsPage')
const AdminCommunityCategoriesPage = lazyNamed(loadAdminCommunityPages, 'AdminCommunityCategoriesPage')
const AdminCommunityUsersPage = lazyNamed(loadAdminCommunityPages, 'AdminCommunityUsersPage')

const AdminKaoyanOverviewPage = lazyDefault(() => import('@/pages/admin/AdminKaoyanOverviewPage.jsx'))
const AdminKaoyanMaterialsPage = lazyDefault(() => import('@/pages/admin/AdminKaoyanMaterialsPage.jsx'))
const AdminKaoyanSchoolsPage = lazyDefault(() => import('@/pages/admin/AdminKaoyanSchoolsPage.jsx'))
const AdminKaoyanScoreLinesPage = lazyDefault(() => import('@/pages/admin/AdminKaoyanScoreLinesPage.jsx'))

const SettingsProfilePage = lazyDefault(loadSettingsProfilePage)
const SettingsPostsPage = lazyDefault(loadSettingsPostsPage)
const SettingsPostEditPage = lazyDefault(loadSettingsPostEditPage)
const SettingsCommentsPage = lazyDefault(loadSettingsCommentsPage)
const SettingsPracticePage = lazyDefault(loadSettingsPracticePage)
const SettingsSecurityPage = lazyDefault(loadSettingsSecurityPage)

const routeFallback = (
  <AppBootScreen
    title="正在准备页面"
    message="正在加载页面模块，请稍候..."
  />
)

const authFallback = (
  <AppBootScreen
    title="正在准备页面"
    message="正在验证登录状态，请稍候..."
  />
)

function RoleLandingRoute() {
  const { user, loading, isAuthed } = useAuth()

  if (loading) return authFallback
  if (!isAuthed || !user) return <Navigate replace to="/" />

  return <Navigate replace to={getRoleLandingPath(user)} />
}

function StudentOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return authFallback
  if (!isAuthed || !user || user.role !== 'user') return <Navigate replace to="/" />

  return children
}

function AdminOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return authFallback
  if (!isAuthed || !user || user.role !== 'admin') return <Navigate replace to="/" />

  return children
}

function AuthOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return authFallback
  if (!isAuthed || !user) return <Navigate replace to="/" />

  return children
}

export default function App() {
  const location = useLocation()
  const backgroundLocation = location.state?.backgroundLocation

  return (
    <Suspense fallback={routeFallback}>
      <Routes location={backgroundLocation || location}>
        <Route element={<PublicShell />}>
          <Route path="/" element={<AuthLandingPage />} />
          <Route path="/login" element={<AuthLandingPage />} />
        </Route>

        <Route path="/app" element={<RoleLandingRoute />} />

        <Route element={<CommonShell />}>
          <Route path="/community" element={<CommunityHubPage />} />
          <Route path="/community/new" element={<CommunityComposerPage />} />
          <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
          <Route path="/community/:postId" element={<CommunityPostPage />} />
          <Route path="/practice" element={<PracticeDirectoryPage />} />
          <Route path="/practice/banks/:bankId" element={<PracticeBankPreviewPage />} />
        </Route>

        <Route
          element={(
            <StudentOnly>
              <StudentShell />
            </StudentOnly>
          )}
        >
          <Route path="/station/job" element={<JobStationPage />} />
          <Route path="/station/job/resume" element={<JobResumePage />} />
          <Route path="/station/job/recommendations" element={<JobRecommendationsPage />} />
          <Route path="/station/job/applications" element={<JobApplicationsPage />} />
          <Route path="/station/job/fairs" element={<JobFairsPage />} />
          <Route path="/station/kaoyan" element={<KaoyanOverviewPage />} />
          <Route path="/station/kaoyan/schools" element={<KaoyanSchoolsPage />} />
          <Route path="/station/kaoyan/schools/favorites" element={<KaoyanSchoolFavoritesPage />} />
          <Route path="/station/kaoyan/plans" element={<KaoyanPlansPage />} />
          <Route path="/station/kaoyan/plans/:planId" element={<KaoyanPlanDetailPage />} />
          <Route path="/station/kaoyan/materials" element={<KaoyanMaterialsPage />} />
          <Route path="/station/kaoyan/materials/upload" element={<KaoyanMaterialUploadPage />} />
          <Route path="/station/kaoyan/materials/mine" element={<KaoyanMyMaterialsPage />} />
          <Route path="/station/kaoyan/materials/:materialId" element={<KaoyanMaterialDetailPage />} />
          <Route path="/station/kaoyan/support" element={<KaoyanSupportOverviewPage />} />
          <Route path="/station/kaoyan/support/mentors" element={<KaoyanMentorHallPage />} />
          <Route path="/station/kaoyan/support/mentors/apply" element={<KaoyanMentorApplyPage />} />
          <Route path="/station/kaoyan/support/messages" element={<KaoyanMessagesPage />} />
          <Route path="/station/kaoyan/support/rooms" element={<KaoyanStudyRoomsPage />} />
          <Route path="/station/kaoyan/support/rooms/:roomId" element={<KaoyanStudyRoomPage />} />
          <Route path="/station/kaogong" element={<KaogongStationPage />} />
          <Route path="/station/kaogong/jobs" element={<KaogongJobsPage />} />
          <Route path="/station/kaogong/score-lines" element={<KaogongScoreLinesPage />} />
          <Route path="/station/kaogong/calendar" element={<KaogongCalendarPage />} />
          <Route path="/station/kaogong/interviews" element={<KaogongInterviewsPage />} />
          <Route path="/station/studyabroad" element={<StudyAbroadStationPage />} />
          <Route path="/station/studyabroad/programs" element={<StudyAbroadProgramsPage />} />
          <Route path="/station/studyabroad/cases" element={<StudyAbroadCasesPage />} />
          <Route path="/station/studyabroad/applications" element={<StudyAbroadApplicationsPage />} />
          <Route path="/station/studyabroad/timeline" element={<StudyAbroadTimelinePage />} />
          <Route path="/station/studyabroad/materials" element={<StudyAbroadMaterialsPage />} />
        </Route>

        <Route
          element={(
            <AdminOnly>
              <AdminShell />
            </AdminOnly>
          )}
        >
          <Route path="/admin" element={<AdminMainPage />} />
          <Route path="/admin/community" element={<AdminCommunityPage />} />
          <Route path="/admin/community/reviews" element={<AdminCommunityReviewsPage />} />
          <Route path="/admin/community/reports/posts" element={<AdminCommunityPostReportsPage />} />
          <Route path="/admin/community/reports/comments" element={<AdminCommunityCommentReportsPage />} />
          <Route path="/admin/community/categories" element={<AdminCommunityCategoriesPage />} />
          <Route path="/admin/community/users" element={<AdminCommunityUsersPage />} />
          <Route path="/admin/question-banks" element={<AdminQuestionBanksPage />} />
          <Route path="/admin/kaoyan" element={<AdminKaoyanOverviewPage />} />
          <Route path="/admin/kaoyan/materials" element={<AdminKaoyanMaterialsPage />} />
          <Route path="/admin/kaoyan/schools" element={<AdminKaoyanSchoolsPage />} />
          <Route path="/admin/kaoyan/score-lines" element={<AdminKaoyanScoreLinesPage />} />
          <Route path="/admin/kaogong" element={<AdminKaogongPage />} />
          <Route path="/admin/employment" element={<AdminEmploymentPage />} />
        </Route>

        <Route
          element={(
            <AuthOnly>
              <SettingsShell />
            </AuthOnly>
          )}
        >
          <Route path="/settings/profile" element={<SettingsProfilePage />} />
          <Route path="/settings/posts" element={<SettingsPostsPage />} />
          <Route path="/settings/posts/:postId/edit" element={<SettingsPostEditPage />} />
          <Route path="/settings/comments" element={<SettingsCommentsPage />} />
          <Route path="/settings/practice" element={<SettingsPracticePage />} />
          <Route path="/settings/security" element={<SettingsSecurityPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
