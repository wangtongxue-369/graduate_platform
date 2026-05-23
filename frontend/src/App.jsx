import { Routes, Route } from 'react-router-dom'
import DevBar from './components/DevBar.jsx'

// 通用功能页面
import HomePage from './pages/HomePage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import CommunityDetailPage from './pages/CommunityDetailPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import PracticeDetailPage from './pages/PracticeDetailPage.jsx'
import PracticeHistoryPage from './pages/PracticeHistoryPage.jsx'
import WrongQuestionPage from './pages/WrongQuestionPage.jsx'
import PracticeStatisticsPage from './pages/PracticeStatisticsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import PostEditPage from './pages/PostEditPage.jsx'

// 考研方向专属页面
import KaoyanPage from './pages/kaoyan/KaoyanPage.jsx'
import ScoreQueryPage from './pages/kaoyan/ScoreQueryPage.jsx'
import StudyPlanPage from './pages/kaoyan/StudyPlanPage.jsx'
import StudyPlanDetailPage from './pages/kaoyan/StudyPlanDetailPage.jsx'
import MaterialsPage from './pages/kaoyan/MaterialsPage.jsx'
import MaterialUploadPage from './pages/kaoyan/MaterialUploadPage.jsx'
import MaterialDetailPage from './pages/kaoyan/MaterialDetailPage.jsx'
import MyMaterialsPage from './pages/kaoyan/MyMaterialsPage.jsx'
import StudyRoomPage from './pages/kaoyan/StudyRoomPage.jsx'
import ConsultPage from './pages/kaoyan/ConsultPage.jsx'

// 考公考编方向专属页面
import KaogongPage from './pages/kaogong/KaogongPage.jsx'
import JobMatchingPage from './pages/kaogong/JobMatchingPage.jsx'
import ScoreLinePage from './pages/kaogong/ScoreLinePage.jsx'
import ExamCalendarPage from './pages/kaogong/ExamCalendarPage.jsx'
import MockInterviewPage from './pages/kaogong/MockInterviewPage.jsx'

// 就业方向专属页面
import JobPage from './pages/job/JobPage.jsx'
import CareerFairPage from './pages/job/CareerFairPage.jsx'
import CareerFairDetailPage from './pages/job/CareerFairDetailPage.jsx'
import ResumePage from './pages/job/ResumePage.jsx'
import JobRecommendPage from './pages/job/JobRecommendPage.jsx'
import JobPostingDetailPage from './pages/job/JobPostingDetailPage.jsx'
import ApplicationTrackingPage from './pages/job/ApplicationTrackingPage.jsx'

// 留学方向专属页面
import StudyAbroadPage from './pages/studyabroad/StudyAbroadPage.jsx'
import ApplicationsPage from './pages/studyabroad/ApplicationsPage.jsx'
import TimelinePage from './pages/studyabroad/TimelinePage.jsx'
import SAMaterialsPage from './pages/studyabroad/SAMaterialsPage.jsx'
import ExperiencePage from './pages/studyabroad/ExperiencePage.jsx'

// 管理员页面
import AdminPage from './pages/admin/AdminPage.jsx'
import ReviewPage from './pages/admin/ReviewPage.jsx'
import UserManagementPage from './pages/admin/UserManagementPage.jsx'
import KaogongDataPage from './pages/admin/KaogongDataPage.jsx'
import ReportPage from './pages/admin/ReportPage.jsx'
import EmploymentManagementPage from './pages/admin/EmploymentManagementPage.jsx'
import AdminKaoyanDataPage from './pages/admin/AdminKaoyanDataPage.jsx'
import AdminMaterialReviewPage from './pages/admin/AdminMaterialReviewPage.jsx'
import AdminQuestionBankPage from './pages/admin/AdminQuestionBankPage.jsx'
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage.jsx'

export default function App() {
  return (
    <>
    <DevBar />
    <Routes>
      {/* 通用功能 */}
      <Route path="/" element={<HomePage />} />
      <Route path="/community" element={<CommunityPage />} />
      <Route path="/community/:id" element={<CommunityDetailPage />} />
      <Route path="/practice" element={<PracticePage />} />
      <Route path="/practice/:id" element={<PracticeDetailPage />} />
      <Route path="/practice/history" element={<PracticeHistoryPage />} />
      <Route path="/practice/wrong-questions" element={<WrongQuestionPage />} />
      <Route path="/practice/statistics" element={<PracticeStatisticsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/posts/:postId/edit" element={<PostEditPage />} />

      {/* 考研方向专属 */}
      <Route path="/kaoyan" element={<KaoyanPage />} />
      <Route path="/kaoyan/scores" element={<ScoreQueryPage />} />
      <Route path="/kaoyan/plan" element={<StudyPlanPage />} />
      <Route path="/kaoyan/plan/:id" element={<StudyPlanDetailPage />} />
      <Route path="/kaoyan/materials" element={<MaterialsPage />} />
      <Route path="/kaoyan/materials/upload" element={<MaterialUploadPage />} />
      <Route path="/kaoyan/materials/:id" element={<MaterialDetailPage />} />
      <Route path="/kaoyan/materials/my" element={<MyMaterialsPage />} />
      <Route path="/kaoyan/studyroom" element={<StudyRoomPage />} />
      <Route path="/kaoyan/consult" element={<ConsultPage />} />

      {/* 考公考编方向专属 */}
      <Route path="/kaogong" element={<KaogongPage />} />
      <Route path="/kaogong/matching" element={<JobMatchingPage />} />
      <Route path="/kaogong/scores" element={<ScoreLinePage />} />
      <Route path="/kaogong/calendar" element={<ExamCalendarPage />} />
      <Route path="/kaogong/interview" element={<MockInterviewPage />} />

      {/* 就业方向专属 */}
      <Route path="/job" element={<JobPage />} />
      <Route path="/job/fairs" element={<CareerFairPage />} />
      <Route path="/job/fairs/:id" element={<CareerFairDetailPage />} />
      <Route path="/job/resume" element={<ResumePage />} />
      <Route path="/job/recommend" element={<JobRecommendPage />} />
      <Route path="/job/postings/:id" element={<JobPostingDetailPage />} />
      <Route path="/job/applications" element={<ApplicationTrackingPage />} />

      {/* 留学方向专属 */}
      <Route path="/studyabroad" element={<StudyAbroadPage />} />
      <Route path="/studyabroad/applications" element={<ApplicationsPage />} />
      <Route path="/studyabroad/timeline" element={<TimelinePage />} />
      <Route path="/studyabroad/materials" element={<SAMaterialsPage />} />
      <Route path="/studyabroad/experience" element={<ExperiencePage />} />

      {/* 管理员后台 */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/review" element={<ReviewPage />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/kaogong-data" element={<KaogongDataPage />} />
      <Route path="/admin/reports" element={<ReportPage />} />
      <Route path="/admin/employment" element={<EmploymentManagementPage />} />
      <Route path="/admin/kaoyan-data" element={<AdminKaoyanDataPage />} />
      <Route path="/admin/material-review" element={<AdminMaterialReviewPage />} />
      <Route path="/admin/question-banks" element={<AdminQuestionBankPage />} />
      <Route path="/admin/question-banks/:bankId/questions" element={<AdminQuestionsPage />} />
    </Routes>
    </>
  )
}
