import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminStudyAbroadApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import AdminStudyAbroadSummaryStrip from '@/components/studyabroad/AdminStudyAbroadSummaryStrip.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const fallbackDashboard = {
  totalSchools: 18,
  totalAdmissionCases: 24,
  totalExperiences: 16,
}

export default function AdminStudyAbroadOverviewPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [dashboard, setDashboard] = useState(fallbackDashboard)
  const [notice, setNotice] = useState(previewDataNotice('留学管理'))

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!canUseRemote) {
        setDashboard(fallbackDashboard)
        setNotice(previewDataNotice('留学管理'))
        return
      }

      try {
        const data = await withRequestTimeout(
          adminStudyAbroadApi.dashboard(token),
          8000,
          '留学后台总览读取超时，请检查后端服务。',
        )
        if (!active) return
        setDashboard(data || fallbackDashboard)
        setNotice(remoteDataNotice('留学管理'))
      } catch (error) {
        if (!active) return
        setDashboard(fallbackDashboard)
        setNotice(fallbackDataNotice('留学管理', error))
      }
    }

    loadDashboard()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const summaryItems = [
    { label: '院校项目', value: String(dashboard.totalSchools || 0), note: '当前已收录的院校项目条目数' },
    { label: '录取案例', value: String(dashboard.totalAdmissionCases || 0), note: '当前已收录的案例样本数' },
    { label: '经验内容', value: String(dashboard.totalExperiences || 0), note: '当前已收录的经验内容数' },
  ]

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="留学管理"
        pathItems={[
          { label: '管理员主站', to: '/admin' },
          { label: '留学管理' },
        ]}
        title="留学管理"
        lead="查看留学模块的数据规模，并进入院校项目、录取案例和经验内容的后台管理页面。"
        compact
      />
      {notice ? <div className="v2-status-note">{notice}</div> : null}
      <AdminStudyAbroadSummaryStrip items={summaryItems} />
      <section className="v2-card-grid">
        <article className="v2-module-card">
          <strong>院校项目管理</strong>
          <p>维护院校名称、专业项目、排名、学费、申请要求和合作项目标记。</p>
          <div className="v2-inline-actions">
            <Link className="v2-primary-link" to="/admin/studyabroad/programs">进入项目管理</Link>
          </div>
        </article>
        <article className="v2-module-card">
          <strong>录取案例管理</strong>
          <p>查看学生提交的录取、候补和拒信案例，清理不适合展示的记录。</p>
          <div className="v2-inline-actions">
            <Link className="v2-primary-link" to="/admin/studyabroad/cases">进入案例管理</Link>
          </div>
        </article>
        <article className="v2-module-card">
          <strong>经验内容管理</strong>
          <p>查看留学经验帖全文，并删除违规、重复或不适合公开展示的内容。</p>
          <div className="v2-inline-actions">
            <Link className="v2-primary-link" to="/admin/studyabroad/experiences">进入经验管理</Link>
          </div>
        </article>
      </section>
    </div>
  )
}
