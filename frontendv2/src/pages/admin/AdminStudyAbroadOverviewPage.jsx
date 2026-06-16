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
        kicker="留学运营总览"
        pathItems={[
          { label: '管理员主站', to: '/admin' },
          { label: '留学管理' },
        ]}
        title="先看内容库规模，再进入具体治理页完成操作。"
        lead="总览只负责调度，不在这里堆叠全部深度编辑动作。"
      />
      {notice ? <div className="v2-status-note">{notice}</div> : null}
      <AdminStudyAbroadSummaryStrip items={summaryItems} />
      <section className="v2-card-grid">
        <article className="v2-module-card">
          <strong>院校项目治理</strong>
          <p>进入分页筛选、抽屉编辑和删除流程。</p>
          <div className="v2-inline-actions">
            <Link className="v2-primary-link" to="/admin/studyabroad/programs">进入项目治理</Link>
          </div>
        </article>
        <article className="v2-module-card">
          <strong>案例治理</strong>
          <p>先筛选，再查看详情，最后进行低风险清理。</p>
          <div className="v2-inline-actions">
            <Link className="v2-primary-link" to="/admin/studyabroad/cases">进入案例治理</Link>
          </div>
        </article>
        <article className="v2-module-card">
          <strong>经验治理</strong>
          <p>把经验阅读和内容清理留在独立治理页完成。</p>
          <div className="v2-inline-actions">
            <Link className="v2-primary-link" to="/admin/studyabroad/experiences">进入经验治理</Link>
          </div>
        </article>
      </section>
    </div>
  )
}
