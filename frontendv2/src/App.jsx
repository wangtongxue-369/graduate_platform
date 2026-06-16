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
const loadRoleAuthRoutePage = () => import('@/pages/auth/RoleAuthRoutePage.jsx')
const loadCommunityComposerPage = () => import('@/pages/community/CommunityComposerPage.jsx')
const loadCommunityHubPage = () => import('@/pages/community/CommunityHubPage.jsx')
const loadCommunityNotificationsPage = () => import('@/pages/community/CommunityNotificationsPage.jsx')
const loadCommunityPostPage = () => import('@/pages/community/CommunityPostPage.jsx')
const loadPracticeDirectoryPage = () => import('@/pages/practice/PracticeDirectoryPage.jsx')
const loadPracticeBankPage = () => import('@/pages/practice/PracticeBankPage.jsx')
const loadPracticeSessionPage = () => import('@/pages/practice/PracticeSessionPage.jsx')
const loadPracticeHistoryPage = () => import('@/pages/practice/PracticeHistoryPage.jsx')
const loadPracticeWrongQuestionsPage = () => import('@/pages/practice/PracticeWrongQuestionsPage.jsx')
const loadPracticeStatisticsPage = () => import('@/pages/practice/PracticeStatisticsPage.jsx')
const loadJobStationOverviewPage = () => import('@/pages/student/job/JobStationOverviewPage.jsx')
const loadJobResumePage = () => import('@/pages/student/job/JobResumePage.jsx')
const loadJobRecommendationsPage = () => import('@/pages/student/job/JobRecommendationsPage.jsx')
const loadJobApplicationsPage = () => import('@/pages/student/job/JobApplicationsPage.jsx')
const loadJobFairsPage = () => import('@/pages/student/job/JobFairsPage.jsx')
const loadKaogongStationPage = () => import('@/pages/student/kaogong/KaogongStationPage.jsx')
const loadStudyAbroadOverviewPage = () => import('@/pages/student/studyabroad/StudyAbroadOverviewPage.jsx')
const loadStudyAbroadProgramsPage = () => import('@/pages/student/studyabroad/StudyAbroadProgramsPage.jsx')
const loadStudyAbroadCasesPage = () => import('@/pages/student/studyabroad/StudyAbroadCasesPage.jsx')
const loadStudyAbroadApplicationsPage = () => import('@/pages/student/studyabroad/StudyAbroadApplicationsPage.jsx')
const loadStudyAbroadTimelinePage = () => import('@/pages/student/studyabroad/StudyAbroadTimelinePage.jsx')
const loadStudyAbroadMaterialsPage = () => import('@/pages/student/studyabroad/StudyAbroadMaterialsPage.jsx')
const loadStudyAbroadExperiencesPage = () => import('@/pages/student/studyabroad/StudyAbroadExperiencesPage.jsx')
const loadAdminMainPage = () => import('@/pages/admin/AdminMainPage.jsx')
const loadAdminEmploymentPage = () => import('@/pages/admin/AdminEmploymentPage.jsx')
const loadAdminStudyAbroadOverviewPage = () => import('@/pages/admin/AdminStudyAbroadOverviewPage.jsx')
const loadAdminStudyAbroadProgramsPage = () => import('@/pages/admin/AdminStudyAbroadProgramsPage.jsx')
const loadAdminStudyAbroadCasesPage = () => import('@/pages/admin/AdminStudyAbroadCasesPage.jsx')
const loadAdminStudyAbroadExperiencesPage = () => import('@/pages/admin/AdminStudyAbroadExperiencesPage.jsx')
const loadAdminQuestionBanksPage = () => import('@/pages/admin/AdminQuestionBanksPage.jsx')
const loadAdminQuestionBankWorkspacePage = () => import('@/pages/admin/AdminQuestionBankWorkspacePage.jsx')
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
const RoleAuthRoutePage = lazyDefault(loadRoleAuthRoutePage)
const CommunityComposerPage = lazyDefault(loadCommunityComposerPage)
const CommunityHubPage = lazyDefault(loadCommunityHubPage)
const CommunityNotificationsPage = lazyDefault(loadCommunityNotificationsPage)
const CommunityPostPage = lazyDefault(loadCommunityPostPage)
const PracticeDirectoryPage = lazyDefault(loadPracticeDirectoryPage)
const PracticeBankPage = lazyDefault(loadPracticeBankPage)
const PracticeSessionPage = lazyDefault(loadPracticeSessionPage)
const PracticeHistoryPage = lazyDefault(loadPracticeHistoryPage)
const PracticeWrongQuestionsPage = lazyDefault(loadPracticeWrongQuestionsPage)
const PracticeStatisticsPage = lazyDefault(loadPracticeStatisticsPage)

const JobStationPage = lazyDefault(loadJobStationOverviewPage)
const JobApplicationsPage = lazyDefault(loadJobApplicationsPage)
const JobFairsPage = lazyDefault(loadJobFairsPage)
const JobRecommendationsPage = lazyDefault(loadJobRecommendationsPage)
const JobResumePage = lazyDefault(loadJobResumePage)

const KaogongStationPage = lazyDefault(loadKaogongStationPage)
const KaogongCalendarPage = lazyNamed(loadKaogongStationPage, 'KaogongCalendarPage')
const KaogongInterviewsPage = lazyNamed(loadKaogongStationPage, 'KaogongInterviewsPage')
const KaogongInterviewRoomPage = lazyNamed(loadKaogongStationPage, 'KaogongInterviewRoomPage')
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

const StudyAbroadOverviewPage = lazyDefault(loadStudyAbroadOverviewPage)
const StudyAbroadApplicationsPage = lazyDefault(loadStudyAbroadApplicationsPage)
const StudyAbroadCasesPage = lazyDefault(loadStudyAbroadCasesPage)
const StudyAbroadMaterialsPage = lazyDefault(loadStudyAbroadMaterialsPage)
const StudyAbroadProgramsPage = lazyDefault(loadStudyAbroadProgramsPage)
const StudyAbroadTimelinePage = lazyDefault(loadStudyAbroadTimelinePage)
const StudyAbroadExperiencesPage = lazyDefault(loadStudyAbroadExperiencesPage)

const AdminMainPage = lazyDefault(loadAdminMainPage)
const AdminEmploymentPage = lazyDefault(loadAdminEmploymentPage)
const AdminStudyAbroadOverviewPage = lazyDefault(loadAdminStudyAbroadOverviewPage)
const AdminStudyAbroadProgramsPage = lazyDefault(loadAdminStudyAbroadProgramsPage)
const AdminStudyAbroadCasesPage = lazyDefault(loadAdminStudyAbroadCasesPage)
const AdminStudyAbroadExperiencesPage = lazyDefault(loadAdminStudyAbroadExperiencesPage)
const AdminKaogongPage = lazyDefault(() => import('@/pages/admin/AdminKaogongPage.jsx'))
const AdminQuestionBanksPage = lazyDefault(loadAdminQuestionBanksPage)
const AdminQuestionBankWorkspacePage = lazyDefault(loadAdminQuestionBankWorkspacePage)

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
          <Route path="/role-auth" element={<RoleAuthRoutePage />} />
        </Route>

        <Route path="/app" element={<RoleLandingRoute />} />

        <Route element={<CommonShell />}>
          <Route path="/community" element={<CommunityHubPage />} />
          <Route path="/community/new" element={<CommunityComposerPage />} />
          <Route path="/community/notifications" element={<CommunityNotificationsPage />} />
          <Route path="/community/:postId" element={<CommunityPostPage />} />
          <Route path="/practice" element={<PracticeDirectoryPage />} />
          <Route path="/practice/banks/:bankId" element={<PracticeBankPage />} />
          <Route path="/practice/sessions/:sessionId" element={<PracticeSessionPage />} />
          <Route path="/practice/history" element={<PracticeHistoryPage />} />
          <Route path="/practice/wrong-questions" element={<PracticeWrongQuestionsPage />} />
          <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
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
          <Route path="/station/kaogong/interviews/rooms/:roomId" element={<KaogongInterviewRoomPage />} />
          <Route path="/station/studyabroad" element={<StudyAbroadOverviewPage />} />
          <Route path="/station/studyabroad/programs" element={<StudyAbroadProgramsPage />} />
          <Route path="/station/studyabroad/cases" element={<StudyAbroadCasesPage />} />
          <Route path="/station/studyabroad/applications" element={<StudyAbroadApplicationsPage />} />
          <Route path="/station/studyabroad/timeline" element={<StudyAbroadTimelinePage />} />
          <Route path="/station/studyabroad/materials" element={<StudyAbroadMaterialsPage />} />
          <Route path="/station/studyabroad/experiences" element={<StudyAbroadExperiencesPage />} />
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
          <Route path="/admin/question-banks/:bankId" element={<AdminQuestionBankWorkspacePage />} />
          <Route path="/admin/kaoyan" element={<AdminKaoyanOverviewPage />} />
          <Route path="/admin/kaoyan/materials" element={<AdminKaoyanMaterialsPage />} />
          <Route path="/admin/kaoyan/schools" element={<AdminKaoyanSchoolsPage />} />
          <Route path="/admin/kaoyan/score-lines" element={<AdminKaoyanScoreLinesPage />} />
          <Route path="/admin/kaogong" element={<AdminKaogongPage />} />
          <Route path="/admin/employment" element={<AdminEmploymentPage />} />
          <Route path="/admin/studyabroad" element={<AdminStudyAbroadOverviewPage />} />
          <Route path="/admin/studyabroad/programs" element={<AdminStudyAbroadProgramsPage />} />
          <Route path="/admin/studyabroad/cases" element={<AdminStudyAbroadCasesPage />} />
          <Route path="/admin/studyabroad/experiences" element={<AdminStudyAbroadExperiencesPage />} />
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

        <Route path="/studyabroad" element={<Navigate replace to="/station/studyabroad" />} />
        <Route path="/studyabroad/applications" element={<Navigate replace to="/station/studyabroad/applications" />} />
        <Route path="/studyabroad/timeline" element={<Navigate replace to="/station/studyabroad/timeline" />} />
        <Route path="/studyabroad/materials" element={<Navigate replace to="/station/studyabroad/materials" />} />
        <Route path="/studyabroad/experience" element={<Navigate replace to="/station/studyabroad/experiences" />} />
        <Route path="/studyabroad/experiences" element={<Navigate replace to="/station/studyabroad/experiences" />} />
        <Route path="/studyabroad/admission-cases" element={<Navigate replace to="/station/studyabroad/cases" />} />
        <Route path="/studyabroad/schools" element={<Navigate replace to="/station/studyabroad/programs" />} />
      </Routes>
    </Suspense>
  )
}
