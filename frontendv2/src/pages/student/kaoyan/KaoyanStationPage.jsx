import { Link } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import { kaoyanWorkspace } from '@/lib/workspacePreview.js'

const overviewSteps = [
  { title: '先比院校', note: '把学校、专业和分数线先放到一张对照表里。' },
  { title: '再排计划', note: '把一天的推进拆成时间节点，避免所有任务混写。' },
  { title: '再用资料', note: '按用途取资料，不把下载列表直接摊开。' },
  { title: '最后协同', note: '碰到卡点时再进入陪跑和答疑页面。' },
]

export default function KaoyanStationPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="考研工作台"
        title="把择校、计划和资料放进同一条复习链路。"
        lead="考研主站不再只是功能入口，而是先把院校比较、今日推进、资料状态和陪跑协同预览出来，再进入对应页面继续深入。"
      />

      <section className="v2-summary-strip" aria-label="考研摘要">
        {kaoyanWorkspace.summary.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{kaoyanWorkspace.summary.description}</p>
          </article>
        ))}
      </section>

      <section className="v2-overview-grid" aria-label="核心工作台">
        <Link className="v2-preview-panel" to="/station/kaoyan/schools">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">院校比较</p>
              <strong>先看分数线和趋势，再决定是否保留目标院校。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {kaoyanWorkspace.compareBoard.map((item) => (
              <div className="v2-preview-row" key={`${item.school}-${item.major}`}>
                <strong>{item.school}</strong>
                <span>{item.major}</span>
                <small>{item.line} / {item.trend} / {item.note}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/plans">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">今日计划</p>
              <strong>每个时间段只承载一个动作，方便打卡和回看。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {kaoyanWorkspace.plans.map((item) => (
              <div className="v2-preview-row" key={`${item.slot}-${item.title}`}>
                <strong>{item.slot}</strong>
                <span>{item.title}</span>
                <small>{item.state} / {item.note}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-overview-grid" aria-label="资料与协同">
        <Link className="v2-preview-panel" to="/station/kaoyan/materials">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">资料架</p>
              <strong>资料按用途分层摆放，而不是只有下载列表。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {kaoyanWorkspace.shelves.map((item) => (
              <div className="v2-preview-row" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.count} 份资料</span>
                <small>{item.note}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/support">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">陪跑协同</p>
              <strong>导师答疑和自习房间都为推进复习服务。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {kaoyanWorkspace.support.mentors.map((item) => (
              <div className="v2-preview-row" key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.field}</span>
                <small>{item.status} / {item.note}</small>
              </div>
            ))}
            {kaoyanWorkspace.support.rooms.map((item) => (
              <div className="v2-preview-row" key={item.room}>
                <strong>{item.room}</strong>
                <span>{item.topic}</span>
                <small>{item.online} 人在线 / {item.rank}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-article-card" aria-label="考研路径">
        <p className="v2-kicker">使用路径</p>
        <div className="v2-process-strip">
          {overviewSteps.map((item) => (
            <article className="v2-process-node" key={item.title}>
              <span>{item.title}</span>
              <strong>{item.note}</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export function KaoyanSchoolsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="院校比较"
        pathItems={[
          { label: '考研总览', to: '/station/kaoyan' },
          { label: '院校比较' },
        ]}
        title="先把院校与分数线放上同一张对照桌。"
        lead="这一页同时承接 schools 和 score-lines 的判断逻辑，所以更适合做成比较账本，而不是普通文章流。"
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
        pathItems={[
          { label: '考研总览', to: '/station/kaoyan' },
          { label: '学习计划' },
        ]}
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
        pathItems={[
          { label: '考研总览', to: '/station/kaoyan' },
          { label: '资料架' },
        ]}
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
        pathItems={[
          { label: '考研总览', to: '/station/kaoyan' },
          { label: '陪跑协同' },
        ]}
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
