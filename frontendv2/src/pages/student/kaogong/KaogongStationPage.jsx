import { Link } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import { kaogongWorkspace } from '@/lib/workspacePreview.js'

export default function KaogongStationPage() {
  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考公工作台"
          title="把岗位选择、备考节奏和面试训练串成一条线。"
          lead="考公方向的核心不是资讯浏览，而是岗位判断、时间节点和面试训练，所以主站直接围着这条链路展开。"
        />

        <section className="v2-card-grid">
          {kaogongWorkspace.nav.slice(1).map((item) => (
            <Link className="v2-module-card" key={item.to} to={item.to}>
              <strong>{item.label}</strong>
              <p>{item.summary}</p>
            </Link>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">最近节点</p>
          <ul>
            {kaogongWorkspace.calendar.map((item) => (
              <li key={`${item.date}-${item.title}`}>{item.date} / {item.title} / {item.note}</li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  )
}

export function KaogongJobsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="岗位匹配"
        pathItems={[
          { label: '考公总览', to: '/station/kaogong' },
          { label: '岗位匹配' },
        ]}
        title="先做岗位筛选，再继续备考投入。"
        lead="岗位页展示的是匹配结果，而不是泛岗位列表，所以每一行都强调地区、岗位与适配理由。"
      />

      <section className="v2-feed-list" aria-label="岗位匹配">
        {kaogongWorkspace.hotZones.map((item) => (
          <article className="v2-feed-item" key={`${item.region}-${item.title}`}>
            <div className="v2-feed-index">{item.openings}</div>
            <div className="v2-feed-body">
              <strong>{item.region} / {item.title}</strong>
              <p>{item.fit}</p>
            </div>
            <span className="v2-feed-action">名额</span>
          </article>
        ))}
      </section>
    </div>
  )
}

export function KaogongScoreLinesPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="分数线账本"
        pathItems={[
          { label: '考公总览', to: '/station/kaogong' },
          { label: '分数线账本' },
        ]}
        title="把你关注的分数线排成一张连续账本。"
        lead="分数线页适合账本式比较，因为真正需要的是年份、岗位和涨跌关系。"
      />

      <section className="v2-ledger-card">
        {kaogongWorkspace.scoreLedger.map((item) => (
          <div className="v2-ledger-row" key={`${item.year}-${item.title}`}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.year}</p>
            </div>
            <div>
              <strong>{item.score}</strong>
              <p>{item.delta}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

export function KaogongCalendarPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="考试日历"
        pathItems={[
          { label: '考公总览', to: '/station/kaogong' },
          { label: '考试日历' },
        ]}
        title="每个考试节点都要带着下一步动作出现。"
        lead="日历页直接模拟 calendar 和 subscription 的使用场景，用时间墙承接考试节点和行动提醒。"
      />

      <section className="v2-timeline-card">
        {kaogongWorkspace.calendar.map((item) => (
          <article className="v2-timeline-row" key={`${item.date}-${item.title}`}>
            <div className="v2-timeline-pin">{item.date}</div>
            <div className="v2-timeline-body">
              <strong>{item.title}</strong>
              <span>{item.note}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export function KaogongInterviewsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="模拟面试"
        pathItems={[
          { label: '考公总览', to: '/station/kaogong' },
          { label: '模拟面试' },
        ]}
        title="进房间训练，然后把反馈沉淀下来。"
        lead="面试页把房间和反馈放成双区布局，贴近 interviews / messages / feedback 的组合关系。"
      />

      <section className="v2-split-board">
        <article className="v2-article-card">
          <p className="v2-kicker">房间</p>
          <div className="v2-check-list">
            {kaogongWorkspace.interviews.rooms.map((item) => (
              <div className="v2-check-row" key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.status}</span>
                <span>{item.people} 人</span>
                <span>{item.note}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="v2-article-card">
          <p className="v2-kicker">反馈</p>
          <div className="v2-check-list">
            {kaogongWorkspace.interviews.feedback.map((item) => (
              <div className="v2-check-row" key={`${item.from}-${item.topic}`}>
                <strong>{item.from}</strong>
                <span>{item.topic}</span>
                <span>{item.note}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
