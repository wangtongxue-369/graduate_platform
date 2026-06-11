import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import StageRail from '@/components/StageRail.jsx'
import { stationPreview } from '@/lib/stationPreview.js'

const railItems = [
  { key: 'resume', label: '简历卷宗', hint: '先补齐在线简历与附件', to: '/job/resume', current: true },
  { key: 'recommend', label: '岗位筛选台', hint: '再看推荐与招聘会', to: '/job/recommend' },
  { key: 'tracking', label: '投递轨道', hint: '最后维护进度和下一步', to: '/job/applications' },
]

export default function JobStationPage() {
  const { user } = useAuth()
  const stats = stationPreview.job

  return (
    <section className="v1-station-wrap">
      <PreviewBanner />
      <div className="v1-stage-layout v1-station-stage v1-station-stage--job">
        <StageRail ariaLabel="就业主站阶段" items={railItems} />

        <div className="v1-station-board">
          <section className="v1-sheet v1-sheet--hero">
            <p className="v1-kicker">job station</p>
            <h1>今日作战桌</h1>
            <p className="v1-lead">
              {user?.name || '当前用户'} 进入主站后，只先推进一条求职主线：建档、筛岗、跟踪。公共模块还在，但不会压住当前主任务。
            </p>
          </section>

          <div className="v1-metric-grid">
            <article className="v1-metric-card">
              <span>简历完成度</span>
              <strong>{stats.resumeCompletion}</strong>
            </article>
            <article className="v1-metric-card">
              <span>今日推荐</span>
              <strong>{stats.recommendationCount}</strong>
            </article>
            <article className="v1-metric-card">
              <span>待跟进投递</span>
              <strong>{stats.followUpCount}</strong>
            </article>
          </div>

          <section className="v1-ledger">
            <div className="v1-section-head">
              <p className="v1-kicker">主工作面</p>
              <h2>先推进一个动作，再进下一层。</h2>
            </div>
            <div className="v1-ledger-rows">
              <Link className="v1-ledger-row" to="/job/resume">
                <div>
                  <strong>简历卷宗</strong>
                  <p>在线简历字段和附件盒分开展示，附件不参与自动解析。</p>
                </div>
                <span>进入</span>
              </Link>
              <Link className="v1-ledger-row" to="/job/recommend">
                <div>
                  <strong>岗位筛选台</strong>
                  <p>先看推荐、匹配理由和站内提醒，再进岗位详情。</p>
                </div>
                <span>进入</span>
              </Link>
              <Link className="v1-ledger-row" to="/job/applications">
                <div>
                  <strong>投递轨道</strong>
                  <p>维护投递状态、下一步事项和当前简历附件状态。</p>
                </div>
                <span>进入</span>
              </Link>
            </div>
          </section>
        </div>

        <aside className="v1-side-drawer">
          <section className="v1-drawer-card">
            <p className="v1-kicker">提醒收件箱</p>
            <div className="v1-note-list">
              {stats.notifications.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>

          <section className="v1-drawer-card v1-drawer-card--muted">
            <p className="v1-kicker">公共模块</p>
            <div className="v1-action-column">
              <Link className="v1-btn" to="/community">社区</Link>
              <Link className="v1-btn" to="/practice">题库</Link>
              <Link className="v1-btn" to="/profile">个人中心</Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
