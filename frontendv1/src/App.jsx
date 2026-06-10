import { Route, Routes } from 'react-router-dom'
import CommunityDetailPageBridge from '@/pages/bridges/CommunityDetailPageBridge.jsx'
import CommunityPageBridge from '@/pages/bridges/CommunityPageBridge.jsx'
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
import PublicShell from '@/layouts/PublicShell.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<GuestMainPage />} />
      </Route>

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
    </Routes>
  )
}
