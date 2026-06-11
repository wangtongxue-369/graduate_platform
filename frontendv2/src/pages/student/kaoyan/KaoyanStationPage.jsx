import { Link } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import { kaoyanWorkspace } from '@/lib/workspacePreview.js'

export default function KaoyanStationPage() {
  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考研工作台"
          title="让计划、资料和比较决策待在同一条复习链路里。"
          lead="考研模块最适合围绕复习推进来组织，所以首页先给院校比较、计划节奏、资料架和陪跑入口。"
        />

        <section className="v2-card-grid">
          {kaoyanWorkspace.nav.slice(1).map((item) => (
            <Link className="v2-module-card" key={item.to} to={item.to}>
              <strong>{item.label}</strong>
              <p>{item.summary}</p>
            </Link>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">今日节奏</p>
          <ul>
            {kaoyanWorkspace.plans.map((item) => (
              <li key={`${item.slot}-${item.title}`}>{item.slot} / {item.title} / {item.state}</li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  )
}

export function KaoyanSchoolsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="院校比较"
        title="先把院校与分数线放上同一张对照桌。"
        lead="这一页同时承接 schools 和 score-lines 的判断逻辑，所以用比较账本而不是普通文章流。"
      />

      <section className="v2-ledger-card">
        {kaoyanWorkspace.compareBoard.map((item) => (
          <div className="v2-ledger-row" key={`${item.school}-${item.major}`}>
            <div>
              <strong>{item.school}</strong>
              <p>{item.major}</p>
            </div>
            <div>
              <strong>{item.line}</strong>
              <p>{item.trend}</p>
            </div>
            <div>
              <p>{item.note}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export function KaoyanPlansPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="学习计划"
        title="把每天推进拆成一个个可打卡的时间节点。"
        lead="计划页更像一条时间轨道，和 plans / checkins 的结构保持一致。"
      />

      <section className="v2-timeline-card">
        {kaoyanWorkspace.plans.map((item) => (
          <article className="v2-timeline-row" key={`${item.slot}-${item.title}`}>
            <div className="v2-timeline-pin">{item.slot}</div>
            <div className="v2-timeline-body">
              <strong>{item.title}</strong>
              <p>{item.state}</p>
              <span>{item.note}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export function KaoyanMaterialsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="资料架"
        title="先按用途收纳资料，再决定是否下载或分享。"
        lead="资料页不该只是下载列表，更适合做成资料架，让人先看清每一层资料的用途和数量。"
      />

      <section className="v2-card-grid">
        {kaoyanWorkspace.shelves.map((item) => (
          <article className="v2-module-card" key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.count} 份资料</p>
            <p>{item.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export function KaoyanSupportPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="陪跑协同"
        title="让咨询关系和自习空间一起服务复习推进。"
        lead="咨询导师和自习房间都属于协同支持，所以放在同一页里拆成两种控件，而不是两个无关目录。"
      />

      <section className="v2-split-board">
        <article className="v2-article-card">
          <p className="v2-kicker">导师咨询</p>
          <div className="v2-check-list">
            {kaoyanWorkspace.support.mentors.map((item) => (
              <div className="v2-check-row" key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.field}</span>
                <span>{item.status}</span>
                <span>{item.note}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="v2-article-card">
          <p className="v2-kicker">自习房间</p>
          <div className="v2-check-list">
            {kaoyanWorkspace.support.rooms.map((item) => (
              <div className="v2-check-row" key={item.room}>
                <strong>{item.room}</strong>
                <span>{item.topic}</span>
                <span>{item.online} 人在线</span>
                <span>{item.rank}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
