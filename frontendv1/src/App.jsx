import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import CommunityDetailPageBridge from '@/pages/bridges/CommunityDetailPageBridge.jsx'
import CommunityPageBridge from '@/pages/bridges/CommunityPageBridge.jsx'
import AdminEmploymentPageBridge from '@/pages/bridges/AdminEmploymentPageBridge.jsx'
import AdminQuestionBankPageBridge from '@/pages/bridges/AdminQuestionBankPageBridge.jsx'
import AdminQuestionsPageBridge from '@/pages/bridges/AdminQuestionsPageBridge.jsx'
import AdminReviewPageBridge from '@/pages/bridges/AdminReviewPageBridge.jsx'
import AdminUsersPageBridge from '@/pages/bridges/AdminUsersPageBridge.jsx'
import CareerFairDetailPageBridge from '@/pages/bridges/CareerFairDetailPageBridge.jsx'
import CareerFairPageBridge from '@/pages/bridges/CareerFairPageBridge.jsx'
import ForgotPasswordPageBridge from '@/pages/bridges/ForgotPasswordPageBridge.jsx'
import LoginPageBridge from '@/pages/bridges/LoginPageBridge.jsx'
import PracticeDetailPageBridge from '@/pages/bridges/PracticeDetailPageBridge.jsx'
import PracticeHistoryPageBridge from '@/pages/bridges/PracticeHistoryPageBridge.jsx'
import PracticePageBridge from '@/pages/bridges/PracticePageBridge.jsx'
import PracticeStatisticsPageBridge from '@/pages/bridges/PracticeStatisticsPageBridge.jsx'
import ProfilePageBridge from '@/pages/bridges/ProfilePageBridge.jsx'
import PostEditPageBridge from '@/pages/bridges/PostEditPageBridge.jsx'
import RegisterPageBridge from '@/pages/bridges/RegisterPageBridge.jsx'
import WrongQuestionPageBridge from '@/pages/bridges/WrongQuestionPageBridge.jsx'
import GuestMainPage from '@/pages/guest/GuestMainPage.jsx'
import AdminMainPage from '@/pages/admin/AdminMainPage.jsx'
import AdminShell from '@/layouts/AdminShell.jsx'
import PublicShell from '@/layouts/PublicShell.jsx'
import StudentShell from '@/layouts/StudentShell.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'
import DirectionHoldingPage from '@/pages/student/DirectionHoldingPage.jsx'
import ApplicationTrackingPage from '@/pages/student/job/ApplicationTrackingPage.jsx'
import JobPostingDetailPage from '@/pages/student/job/JobPostingDetailPage.jsx'
import JobRecommendPage from '@/pages/student/job/JobRecommendPage.jsx'
import JobStationPage from '@/pages/student/job/JobStationPage.jsx'
import ResumePage from '@/pages/student/job/ResumePage.jsx'

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
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<GuestMainPage />} />
      </Route>

      <Route path="/app" element={<RoleLandingRoute />} />

      <Route path="/community" element={<CommunityPageBridge />} />
      <Route path="/community/:id" element={<CommunityDetailPageBridge />} />
      <Route path="/practice" element={<PracticePageBridge />} />
      <Route path="/practice/:id" element={<PracticeDetailPageBridge />} />
      <Route path="/practice/history" element={<PracticeHistoryPageBridge />} />
      <Route path="/practice/wrong-questions" element={<WrongQuestionPageBridge />} />
      <Route path="/practice/statistics" element={<PracticeStatisticsPageBridge />} />
      <Route path="/login" element={<LoginPageBridge />} />
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
        <Route path="/station/kaoyan" element={<DirectionHoldingPage />} />
        <Route path="/station/kaogong" element={<DirectionHoldingPage />} />
        <Route path="/station/studyabroad" element={<DirectionHoldingPage />} />
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
      </Route>

      <Route path="/admin/review" element={<AdminOnly><AdminReviewPageBridge /></AdminOnly>} />
      <Route path="/admin/users" element={<AdminOnly><AdminUsersPageBridge /></AdminOnly>} />
      <Route path="/admin/employment" element={<AdminOnly><AdminEmploymentPageBridge /></AdminOnly>} />
      <Route path="/admin/question-banks" element={<AdminOnly><AdminQuestionBankPageBridge /></AdminOnly>} />
      <Route path="/admin/question-banks/:bankId/questions" element={<AdminOnly><AdminQuestionsPageBridge /></AdminOnly>} />
    </Routes>
  )
}
