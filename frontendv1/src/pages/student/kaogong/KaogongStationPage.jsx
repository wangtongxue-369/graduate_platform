import { Link } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import StageRail from '@/components/StageRail.jsx'
import { stationPreview } from '@/lib/stationPreview.js'

const railItems = [
  { key: 'match', label: '岗位匹配矩阵', hint: '先看可报考范围', current: true },
  { key: 'score', label: '分数线账本', hint: '再核对进面分数线' },
  { key: 'calendar', label: '考试日历墙', hint: '最后安排考试节奏' },
]

export default function KaogongStationPage() {
  const stats = stationPreview.kaogong

  return (
    <section className="v1-station-wrap">
      <PreviewBanner />
      <div className="v1-stage-layout v1-station-stage v1-station-stage--kaogong">
        <StageRail ariaLabel="考公主站阶段" items={railItems} />

        <div className="v1-station-board">
          <section className="v1-sheet v1-sheet--hero">
            <p className="v1-kicker">kaogong station</p>
            <h1>报考雷达室</h1>
            <p className="v1-lead">
              先判断哪些岗位值得报，再核对分数线账本，最后把报名、模考和面试节点排成一面清楚的日历墙。
            </p>
          </section>

          <div className="v1-kaogong-workbench">
            <section className="v1-panel">
              <div className="v1-section-head">
                <p className="v1-kicker">hot zones</p>
                <h2>报考热区</h2>
              </div>
              <div className="v1-zone-grid">
                {stats.hotZones.map((item) => (
                  <article className="v1-zone-card" key={`${item.region}-${item.title}`}>
                    <span>{item.region}</span>
                    <strong>{item.title}</strong>
                    <p>{item.fit}</p>
                    <small>{item.openings} 个岗位</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="v1-ledger">
              <div className="v1-section-head">
                <p className="v1-kicker">score ledger</p>
                <h2>分数线账本</h2>
              </div>
              <div className="v1-ledger-rows">
                {stats.scoreLedger.map((item) => (
                  <article className="v1-ledger-row" key={`${item.year}-${item.title}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.year} 年进面线 {item.score}</p>
                    </div>
                    <span>{item.delta}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="v1-panel v1-panel--full">
              <div className="v1-section-head">
                <p className="v1-kicker">calendar wall</p>
                <h2>考试日历墙</h2>
              </div>
              <div className="v1-timeline-wall">
                {stats.calendarWall.map((item) => (
                  <article className="v1-timeline-node" key={`${item.date}-${item.title}`}>
                    <span>{item.date}</span>
                    <strong>{item.title}</strong>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="v1-side-drawer">
          <section className="v1-drawer-card">
            <p className="v1-kicker">当前雷达</p>
            <div className="v1-note-list">
              <p>已匹配 {stats.matches} 个可报考岗位。</p>
              <p>已收藏 {stats.savedScores} 条分数线记录。</p>
              <p>模拟面试房间保留 {stats.interviewRooms} 个入口。</p>
            </div>
          </section>

          <section className="v1-drawer-card v1-drawer-card--muted">
            <p className="v1-kicker">继续深入</p>
            <div className="v1-action-column">
              <Link className="v1-btn v1-btn--primary" to="/community?category=kaogong">进入岗位匹配矩阵</Link>
              <Link className="v1-btn" to="/practice">查看考试节点</Link>
              <Link className="v1-btn" to="/community?category=experience">打开模拟面试房间</Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
