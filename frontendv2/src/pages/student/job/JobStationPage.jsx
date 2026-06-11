import { Link } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import { jobWorkspace } from '@/lib/workspacePreview.js'

export default function JobStationPage() {
  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="就业工作台"
          title="把求职动作收进一套可以持续推进的主站。"
          lead="就业方向的后端能力集中在简历、推荐、投递和招聘会，所以首页直接把这些动作链条展开。"
        />

        <section className="v2-card-grid">
          {jobWorkspace.nav.slice(1).map((item) => (
            <Link className="v2-module-card" key={item.to} to={item.to}>
              <strong>{item.label}</strong>
              <p>{item.summary}</p>
            </Link>
          ))}
        </section>

        <section className="v2-feed-list" aria-label="今日焦点">
          {jobWorkspace.focusBoard.map((item) => (
            <div className="v2-feed-item" key={item.label}>
              <div className="v2-feed-index">{item.label.slice(0, 2)}</div>
              <div className="v2-feed-body">
                <strong>{item.label}</strong>
                <p>{item.value}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">提醒</p>
          <ul>
            {jobWorkspace.notifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  )
}

export function JobResumePage() {
  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="简历中心"
          pathItems={[
            { label: '就业总览', to: '/station/job' },
            { label: '简历中心' },
          ]}
          title="先把简历做成可维护对象，再去投递。"
          lead="这里按后端的 resume 与附件能力组织成文档工作区，让在线简历和文件简历一眼可见。"
        />

        <section className="v2-card-grid">
          {jobWorkspace.resume.blocks.map((item) => (
            <article className="v2-module-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.state}</p>
              <p>{item.note}</p>
            </article>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">检查顺序</p>
          <ul>
            {jobWorkspace.resume.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  )
}

export function JobRecommendationsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="岗位推荐"
        pathItems={[
          { label: '就业总览', to: '/station/job' },
          { label: '岗位推荐' },
        ]}
        title="把推荐岗位排成一张可比较的候选清单。"
        lead="推荐页采用排名清单而不是大卡片，因为真正关键的是匹配分、原因和下一步动作。"
      />

      <section className="v2-feed-list" aria-label="岗位推荐">
        {jobWorkspace.recommendations.map((item) => (
          <article className="v2-feed-item" key={`${item.company}-${item.role}`}>
            <div className="v2-feed-index">{item.score}</div>
            <div className="v2-feed-body">
              <strong>{item.company} / {item.role}</strong>
              <p>{item.city}</p>
              <p>{item.reason}</p>
            </div>
            <span className="v2-feed-action">匹配度</span>
          </article>
        ))}
      </section>
    </div>
  )
}

export function JobApplicationsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="投递跟踪"
        pathItems={[
          { label: '就业总览', to: '/station/job' },
          { label: '投递跟踪' },
        ]}
        title="把每一次投递都挂在一条清晰的推进线上。"
        lead="投递页更像进度面板，重点不是展示岗位本身，而是当前状态、下一步和需要补的动作。"
      />

      <section className="v2-timeline-card">
        {jobWorkspace.applications.map((item) => (
          <article className="v2-timeline-row" key={`${item.company}-${item.role}`}>
            <div className="v2-timeline-pin">{item.status.slice(0, 2)}</div>
            <div className="v2-timeline-body">
              <strong>{item.company} / {item.role}</strong>
              <p>{item.nextStep}</p>
              <span>{item.note}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export function JobFairsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="招聘会目录"
        pathItems={[
          { label: '就业总览', to: '/station/job' },
          { label: '招聘会目录' },
        ]}
        title="先按时间和城市筛选，再决定去哪个现场。"
        lead="招聘会页用时间与城市驱动的目录视图，符合 fairs 与 fairDetail 的浏览方式。"
      />

      <section className="v2-feed-list" aria-label="招聘会目录">
        {jobWorkspace.fairs.map((item) => (
          <article className="v2-feed-item" key={`${item.name}-${item.date}`}>
            <div className="v2-feed-index">{item.date}</div>
            <div className="v2-feed-body">
              <strong>{item.name}</strong>
              <p>{item.city} / {item.industry}</p>
              <p>{item.note}</p>
            </div>
            <span className="v2-feed-action">现场</span>
          </article>
        ))}
      </section>
    </div>
  )
}
