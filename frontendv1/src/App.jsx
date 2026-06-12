import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import CareerFairDetailPageBridge from '@/pages/bridges/CareerFairDetailPageBridge.jsx'
import CareerFairPageBridge from '@/pages/bridges/CareerFairPageBridge.jsx'
import ForgotPasswordPageBridge from '@/pages/bridges/ForgotPasswordPageBridge.jsx'
import ProfilePageBridge from '@/pages/bridges/ProfilePageBridge.jsx'
import PostEditPageBridge from '@/pages/bridges/PostEditPageBridge.jsx'
import RegisterPageBridge from '@/pages/bridges/RegisterPageBridge.jsx'
import RoleAuthRoutePage from '@/pages/auth/RoleAuthRoutePage.jsx'
import GuestMainPage from '@/pages/guest/GuestMainPage.jsx'
import AdminCommunityWorkbenchPage from '@/pages/admin/AdminCommunityWorkbenchPage.jsx'
import AdminKaogongWorkbenchPage from '@/pages/admin/AdminKaogongWorkbenchPage.jsx'
import AdminKaoyanWorkbenchPage from '@/pages/admin/AdminKaoyanWorkbenchPage.jsx'
import AdminMainPage from '@/pages/admin/AdminMainPage.jsx'
import AdminEmploymentWorkbenchPage from '@/pages/admin/AdminEmploymentWorkbenchPage.jsx'
import AdminMaterialReviewPage from '@/pages/admin/AdminMaterialReviewPage.jsx'
import AdminQuestionBankLedgerPage from '@/pages/admin/AdminQuestionBankLedgerPage.jsx'
import AdminQuestionLedgerPage from '@/pages/admin/AdminQuestionLedgerPage.jsx'
import AdminQuestionSnapshotsPage from '@/pages/admin/AdminQuestionSnapshotsPage.jsx'
import AdminReportQueuePage from '@/pages/admin/AdminReportQueuePage.jsx'
import AdminReviewQueuePage from '@/pages/admin/AdminReviewQueuePage.jsx'
import AdminUsersLedgerPage from '@/pages/admin/AdminUsersLedgerPage.jsx'
import AdminShell from '@/layouts/AdminShell.jsx'
import CommonShell from '@/layouts/CommonShell.jsx'
import PublicShell from '@/layouts/PublicShell.jsx'
import StudentShell from '@/layouts/StudentShell.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'
import CommunityComposerPage from '@/pages/community/CommunityComposerPage.jsx'
import CommunityDetailPage from '@/pages/community/CommunityDetailPage.jsx'
import CommunityHubPage from '@/pages/community/CommunityHubPage.jsx'
import PracticeBankPage from '@/pages/practice/PracticeBankPage.jsx'
import PracticeDirectoryPage from '@/pages/practice/PracticeDirectoryPage.jsx'
import PracticeHistoryPage from '@/pages/practice/PracticeHistoryPage.jsx'
import PracticeStatisticsPage from '@/pages/practice/PracticeStatisticsPage.jsx'
import WrongQuestionLedgerPage from '@/pages/practice/WrongQuestionLedgerPage.jsx'
import ApplicationTrackingPage from '@/pages/student/job/ApplicationTrackingPage.jsx'
import JobPostingDetailPage from '@/pages/student/job/JobPostingDetailPage.jsx'
import JobRecommendPage from '@/pages/student/job/JobRecommendPage.jsx'
import JobStationPage from '@/pages/student/job/JobStationPage.jsx'
import ResumePage from '@/pages/student/job/ResumePage.jsx'
import KaogongStationPage from '@/pages/student/kaogong/KaogongStationPage.jsx'
import KaoyanStationPage from '@/pages/student/kaoyan/KaoyanStationPage.jsx'
import StudyAbroadStationPage from '@/pages/student/studyabroad/StudyAbroadStationPage.jsx'

function RoleLandingRoute() {
  const { user, loading } = useAuth()

  if (loading) return null

  return <Navigate replace to={getRoleLandingPath(user)} />
}

function StudentOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return null
  if (!isAuthed || !user || user.role !== 'user') return <Navigate replace to="/login" />

  return children
}

function AdminOnly({ children }) {
  const { user, isAuthed, loading } = useAuth()

  if (loading) return null
  if (!isAuthed || !user || user.role !== 'admin') return <Navigate replace to="/login" />

  return children
}

export default function App() {
  const location = useLocation()
  const backgroundLocation = location.state?.backgroundLocation

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route element={<PublicShell />}>
          <Route path="/" element={<GuestMainPage />} />
        </Route>

        <Route path="/app" element={<RoleLandingRoute />} />

        <Route element={<CommonShell />}>
          <Route path="/community" element={<CommunityHubPage />} />
          <Route path="/community/new" element={<CommunityComposerPage />} />
          <Route path="/community/:id" element={<CommunityDetailPage />} />
        </Route>

        <Route path="/practice" element={<PracticeDirectoryPage />} />
        <Route path="/practice/:id" element={<PracticeBankPage />} />
        <Route path="/practice/history" element={<PracticeHistoryPage />} />
        <Route path="/practice/wrong-questions" element={<WrongQuestionLedgerPage />} />
        <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
        <Route path="/login" element={<RoleAuthRoutePage />} />
        <Route path="/register" element={<RegisterPageBridge />} />
        <Route path="/forgot-password" element={<ForgotPasswordPageBridge />} />
        <Route path="/profile" element={<ProfilePageBridge />} />
        <Route path="/profile/posts/:postId/edit" element={<PostEditPageBridge />} />
        <Route path="/job/fairs" element={<CareerFairPageBridge />} />
        <Route path="/job/fairs/:id" element={<CareerFairDetailPageBridge />} />

        <Route
          element={(
            <StudentOnly>
              <StudentShell />
            </StudentOnly>
          )}
        >
          <Route path="/station/job" element={<JobStationPage />} />
          <Route path="/station/kaoyan" element={<KaoyanStationPage />} />
          <Route path="/station/kaogong" element={<KaogongStationPage />} />
          <Route path="/station/studyabroad" element={<StudyAbroadStationPage />} />
          <Route path="/job/resume" element={<ResumePage />} />
          <Route path="/job/recommend" element={<JobRecommendPage />} />
          <Route path="/job/postings/:id" element={<JobPostingDetailPage />} />
          <Route path="/job/applications" element={<ApplicationTrackingPage />} />
        </Route>

        <Route
          element={(
            <AdminOnly>
              <AdminShell />
            </AdminOnly>
          )}
        >
          <Route path="/admin" element={<AdminMainPage />} />
          <Route path="/admin/community" element={<AdminCommunityWorkbenchPage />} />
          <Route path="/admin/review" element={<AdminReviewQueuePage />} />
          <Route path="/admin/reports" element={<AdminReportQueuePage />} />
          <Route path="/admin/users" element={<AdminUsersLedgerPage />} />
          <Route path="/admin/materials" element={<AdminMaterialReviewPage />} />
          <Route path="/admin/employment" element={<AdminEmploymentWorkbenchPage />} />
          <Route path="/admin/question-banks" element={<AdminQuestionBankLedgerPage />} />
          <Route path="/admin/question-banks/:bankId/questions" element={<AdminQuestionLedgerPage />} />
          <Route path="/admin/question-banks/:bankId/questions/:questionId/snapshots" element={<AdminQuestionSnapshotsPage />} />
          <Route path="/admin/kaoyan" element={<AdminKaoyanWorkbenchPage />} />
          <Route path="/admin/kaogong" element={<AdminKaogongWorkbenchPage />} />
        </Route>
      </Routes>

      {backgroundLocation ? (
        <Routes>
          <Route path="/login" element={<RoleAuthRoutePage />} />
        </Routes>
      ) : null}
    </>
  )
}
