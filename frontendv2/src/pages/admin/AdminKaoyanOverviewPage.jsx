import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminApi, adminMaterialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'

export default function AdminKaoyanOverviewPage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState({
    pendingMaterials: 0,
    schoolCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function loadSummary() {
      setLoading(true)
      try {
        const [pending, schools] = await Promise.all([
          adminMaterialApi.pending({ page: 0, size: 1 }, token),
          adminApi.kaoyanSchools({ page: 0, size: 1 }, token),
        ])
        if (!active) return
        setSummary({
          pendingMaterials: pending?.totalElements || 0,
          schoolCount: schools?.totalElements || 0,
        })
        setNotice('考研治理总览已连接后端。')
      } catch (error) {
        if (!active) return
        setSummary({
          pendingMaterials: 0,
          schoolCount: 0,
        })
        setNotice(error.message || '考研治理总览加载失败。')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSummary()
    return () => {
      active = false
    }
  }, [token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考研治理"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '考研治理' },
          ]}
          title="考研数据维护"
          lead="治学如治水，疏浚胜于筑堤。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在汇总考研治理数据…</div> : null}

        <section className="v2-summary-strip" aria-label="考研治理摘要">
          <article className="v2-summary-card">
            <span>待审资料</span>
            <strong>{summary.pendingMaterials}</strong>
            <p>优先清理资料审核队列，直接影响学生侧资料可见性。</p>
          </article>
          <article className="v2-summary-card">
            <span>院校档案</span>
            <strong>{summary.schoolCount}</strong>
            <p>院校页同时维护基础档案与分数线，在学校卡片上点击「分数线」即可弹窗管理。</p>
          </article>
        </section>

        <section className="v2-card-grid">
          <Link className="v2-preview-panel" to="/admin/kaoyan/materials">
            <div className="v2-preview-panel__head">
              <strong>资料审核</strong>
              <span className="v2-feed-action">进入</span>
            </div>
            <p>按状态切换审核队列，处理通过、驳回和删除动作。</p>
          </Link>
          <Link className="v2-preview-panel" to="/admin/kaoyan/schools">
            <div className="v2-preview-panel__head">
              <strong>院校维护</strong>
              <span className="v2-feed-action">进入</span>
            </div>
            <p>集中管理考研院校基础资料、标签和分数线；新增/编辑均改为弹窗形式。</p>
          </Link>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">处理顺序</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>先看资料审核</strong>
              <span>优先处理待审队列，避免学生上传后长期无反馈。</span>
            </div>
            <div className="v2-check-row">
              <strong>再进院校维护</strong>
              <span>用弹窗维护院校基础信息，再从学校卡片的「分数线」入口维护分数线。</span>
            </div>
          </div>
        </section>
      </aside>
    </>
  )
}
