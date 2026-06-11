import { Link } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import StageRail from '@/components/StageRail.jsx'
import { stationPreview } from '@/lib/stationPreview.js'

const railItems = [
  { key: 'compare', label: '学校对照板', hint: '先比院校与分数线', current: true },
  { key: 'plan', label: '复习台账', hint: '再落到学习计划与打卡' },
  { key: 'materials', label: '资料柜', hint: '最后管理资料与咨询入口' },
]

export default function KaoyanStationPage() {
  const stats = stationPreview.kaoyan

  return (
    <section className="v1-station-wrap">
      <PreviewBanner />
      <div className="v1-stage-layout v1-station-stage v1-station-stage--kaoyan">
        <StageRail ariaLabel="考研主站阶段" items={railItems} />

        <div className="v1-station-board">
          <section className="v1-sheet v1-sheet--hero">
            <p className="v1-kicker">kaoyan station</p>
            <h1>复习台账</h1>
            <p className="v1-lead">
              先看院校对照板和分数线，再把今天的计划切成可以推进的小段，最后回到资料柜整理附件和咨询入口。
            </p>
          </section>

          <div className="v1-kaoyan-workbench">
            <section className="v1-ledger">
              <div className="v1-section-head">
                <p className="v1-kicker">school board</p>
                <h2>院校对照板</h2>
              </div>
              <div className="v1-ledger-rows">
                {stats.compareBoard.map((item) => (
                  <article className="v1-ledger-row" key={`${item.school}-${item.major}`}>
                    <div>
                      <strong>{item.school}</strong>
                      <p>{item.major} · {item.line}</p>
                      <p>{item.note}</p>
                    </div>
                    <span>{item.trend}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="v1-panel v1-panel--agenda">
              <div className="v1-section-head">
                <p className="v1-kicker">plan rail</p>
                <h2>计划推进栏</h2>
              </div>
              <div className="v1-schedule-strip">
                {stats.planRail.map((item) => (
                  <article className="v1-schedule-card" key={`${item.slot}-${item.title}`}>
                    <span>{item.slot}</span>
                    <strong>{item.title}</strong>
                    <small>{item.state}</small>
                  </article>
                ))}
              </div>
              <p className="v1-inline-tip">今天优先推进 {stats.studyPlanDays} 天计划中的已排段落，再回到资料柜整理附件。</p>
            </section>

            <section className="v1-panel v1-panel--full">
              <div className="v1-section-head">
                <p className="v1-kicker">materials cabinet</p>
                <h2>资料柜</h2>
              </div>
              <div className="v1-shelf-stack">
                {stats.materialShelves.map((item) => (
                  <article className="v1-shelf-card" key={item.label}>
                    <strong>{item.label}</strong>
                    <span>{item.count} 组资料</span>
                    <p>{item.note}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="v1-side-drawer">
          <section className="v1-drawer-card">
            <p className="v1-kicker">复习摘要</p>
            <div className="v1-note-list">
              <p>已收藏分数线 {stats.scoreLines} 组。</p>
              <p>资料柜当前整理 {stats.materials} 份附件。</p>
              <p>咨询入口保留 {stats.consultations} 个待回复问题。</p>
            </div>
          </section>

          <section className="v1-drawer-card v1-drawer-card--muted">
            <p className="v1-kicker">继续深入</p>
            <div className="v1-action-column">
              <Link className="v1-btn v1-btn--primary" to="/community?category=kaoyan">进入学校对照板</Link>
              <Link className="v1-btn" to="/practice">打开学习计划</Link>
              <Link className="v1-btn" to="/community?category=resource">查看资料柜目录</Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}
