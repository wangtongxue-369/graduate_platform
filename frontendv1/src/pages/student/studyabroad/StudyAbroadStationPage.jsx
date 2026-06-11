import { Link } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import StageRail from '@/components/StageRail.jsx'
import { stationPreview } from '@/lib/stationPreview.js'

const railItems = [
  { key: 'programs', label: '项目目录册', hint: '先看学校与项目', current: true },
  { key: 'route', label: '申请航线图', hint: '再看当前申请分布' },
  { key: 'materials', label: '材料箱', hint: '最后整理资料与时间线' },
]

export default function StudyAbroadStationPage() {
  const stats = stationPreview.studyabroad

  return (
    <section className="v1-station-wrap">
      <PreviewBanner />
      <div className="v1-stage-layout v1-station-stage v1-station-stage--studyabroad">
        <StageRail ariaLabel="留学主站阶段" items={railItems} />

        <div className="v1-station-board">
          <section className="v1-sheet v1-sheet--hero">
            <p className="v1-kicker">studyabroad station</p>
            <h1>申请航线图</h1>
            <p className="v1-lead">
              目录、案例、时间线和材料箱分开摆放，先看要申请什么，再看参考样本，最后推进到当前节点。
            </p>
          </section>

          <div className="v1-studyabroad-workbench">
            <section className="v1-ledger">
              <div className="v1-section-head">
                <p className="v1-kicker">program shelf</p>
                <h2>项目目录册</h2>
              </div>
              <div className="v1-ledger-rows">
                {stats.programShelf.map((item) => (
                  <article className="v1-ledger-row" key={`${item.school}-${item.track}`}>
                    <div>
                      <strong>{item.school}</strong>
                      <p>{item.track} · {item.round}</p>
                      <p>{item.note}</p>
                    </div>
                    <span>{item.round}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="v1-panel">
              <div className="v1-section-head">
                <p className="v1-kicker">case dossiers</p>
                <h2>案例卷宗</h2>
              </div>
              <div className="v1-dossier-stack">
                {stats.caseDossiers.map((item) => (
                  <article className="v1-dossier-card" key={item.title}>
                    <span>{item.accent}</span>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="v1-panel v1-panel--full">
              <div className="v1-section-head">
                <p className="v1-kicker">timeline route</p>
                <h2>时间线轨道</h2>
              </div>
              <div className="v1-route-track">
                {stats.timelineTrack.map((item) => (
                  <article className="v1-route-stop" key={`${item.stage}-${item.window}`}>
                    <span>{item.window}</span>
                    <strong>{item.stage}</strong>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="v1-side-drawer">
          <section className="v1-drawer-card">
            <p className="v1-kicker">材料箱</p>
            <div className="v1-note-list">
              <p>当前申请项目 {stats.applications} 个。</p>
              <p>时间线节点 {stats.timelineItems} 个。</p>
              <p>材料箱已拆成 {stats.materials} 份可单独追踪的文件。</p>
            </div>
          </section>

          <section className="v1-drawer-card v1-drawer-card--muted">
            <p className="v1-kicker">继续深入</p>
            <div className="v1-action-column">
              <Link className="v1-btn v1-btn--primary" to="/community?category=liuxue">进入项目目录册</Link>
              <Link className="v1-btn" to="/community?category=experience">查看案例卷宗</Link>
              <Link className="v1-btn" to="/practice">回到时间线轨道</Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
