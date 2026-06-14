import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import AdminMainPage from '@/pages/admin/AdminMainPage.jsx'
import AuthLandingPage from '@/pages/auth/AuthLandingPage.jsx'
import {
  AdminCommunityCategoriesPage,
  AdminCommunityCommentReportsPage,
  AdminCommunityPage,
  AdminCommunityPostReportsPage,
  AdminCommunityReviewsPage,
  AdminCommunityUsersPage,
} from '@/pages/admin/AdminCommunityPages.jsx'
import CommunityComposerPage from '@/pages/community/CommunityComposerPage.jsx'
import CommunityHubPage from '@/pages/community/CommunityHubPage.jsx'
import CommunityNotificationsPage from '@/pages/community/CommunityNotificationsPage.jsx'
import CommunityPostPage from '@/pages/community/CommunityPostPage.jsx'
import PracticeDirectoryPage, { PracticeBankPreviewPage } from '@/pages/practice/PracticeDirectoryPage.jsx'
import PublicShell from '@/layouts/PublicShell.jsx'
import CommonShell from '@/layouts/CommonShell.jsx'
import StudentShell from '@/layouts/StudentShell.jsx'
import AdminShell from '@/layouts/AdminShell.jsx'
import SettingsShell from '@/layouts/SettingsShell.jsx'
import JobStationPage, {
  JobApplicationsPage,
  JobFairsPage,
  JobRecommendationsPage,
  JobResumePage,
} from '@/pages/student/job/JobStationPage.jsx'
import KaogongStationPage, {
  KaogongCalendarPage,
  KaogongInterviewsPage,
  KaogongJobsPage,
  KaogongScoreLinesPage,
} from '@/pages/student/kaogong/KaogongStationPage.jsx'
import KaoyanOverviewPage from '@/pages/student/kaoyan/KaoyanOverviewPage.jsx'
import KaoyanSchoolsPage from '@/pages/student/kaoyan/KaoyanSchoolsPage.jsx'
import KaoyanSchoolFavoritesPage from '@/pages/student/kaoyan/KaoyanSchoolFavoritesPage.jsx'
import KaoyanPlansPage from '@/pages/student/kaoyan/KaoyanPlansPage.jsx'
import KaoyanPlanDetailPage from '@/pages/student/kaoyan/KaoyanPlanDetailPage.jsx'
import KaoyanMaterialsPage from '@/pages/student/kaoyan/KaoyanMaterialsPage.jsx'
import KaoyanMaterialUploadPage from '@/pages/student/kaoyan/KaoyanMaterialUploadPage.jsx'
import KaoyanMyMaterialsPage from '@/pages/student/kaoyan/KaoyanMyMaterialsPage.jsx'
import KaoyanMaterialDetailPage from '@/pages/student/kaoyan/KaoyanMaterialDetailPage.jsx'
import KaoyanSupportOverviewPage from '@/pages/student/kaoyan/KaoyanSupportOverviewPage.jsx'
import KaoyanMentorApplyPage from '@/pages/student/kaoyan/KaoyanMentorApplyPage.jsx'
import KaoyanMessagesPage from '@/pages/student/kaoyan/KaoyanMessagesPage.jsx'
import KaoyanStudyRoomPage from '@/pages/student/kaoyan/KaoyanStudyRoomPage.jsx'
import StudyAbroadStationPage, {
  StudyAbroadApplicationsPage,
  StudyAbroadCasesPage,
  StudyAbroadMaterialsPage,
  StudyAbroadProgramsPage,
  StudyAbroadTimelinePage,
} from '@/pages/student/studyabroad/StudyAbroadStationPage.jsx'
import AdminKaoyanOverviewPage from '@/pages/admin/AdminKaoyanOverviewPage.jsx'
import AdminKaoyanMaterialsPage from '@/pages/admin/AdminKaoyanMaterialsPage.jsx'
import AdminKaoyanSchoolsPage from '@/pages/admin/AdminKaoyanSchoolsPage.jsx'
import AdminKaoyanScoreLinesPage from '@/pages/admin/AdminKaoyanScoreLinesPage.jsx'
import {
  AdminEmploymentPage,
  AdminKaogongPage,
  AdminQuestionBanksPage,
} from '@/pages/admin/AdminMainPage.jsx'
import SettingsProfilePage from '@/pages/settings/SettingsProfilePage.jsx'
import SettingsPostsPage from '@/pages/settings/SettingsPostsPage.jsx'
import SettingsPostEditPage from '@/pages/settings/SettingsPostEditPage.jsx'
import SettingsCommentsPage from '@/pages/settings/SettingsCommentsPage.jsx'
import SettingsPracticePage from '@/pages/settings/SettingsPracticePage.jsx'
import SettingsSecurityPage from '@/pages/settings/SettingsSecurityPage.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'

function RoleLandingRoute() {
  const { user, loading, isAuthed } = useAuth()

  if (loading) return null
  if (!isAuthed || !user) return <Navigate replace to="/" />

  return <Navigate replace to={getRoleLandingPath(user)} />
}

function StudentOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return null
  if (!isAuthed || !user || user.role !== 'user') return <Navigate replace to="/" />

  return children
}

function AdminOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return null
  if (!isAuthed || !user || user.role !== 'admin') return <Navigate replace to="/" />

  return children
}

function AuthOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return null
  if (!isAuthed || !user) return <Navigate replace to="/" />

  return children
}

export default function App() {
  const location = useLocation()
  const backgroundLocation = location.state?.backgroundLocation

  return (
    <>
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
          <Route path="/station/kaoyan/support/mentors/apply" element={<KaoyanMentorApplyPage />} />
          <Route path="/station/kaoyan/support/messages" element={<KaoyanMessagesPage />} />
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

      {backgroundLocation ? null : null}
    </>
  )
}
