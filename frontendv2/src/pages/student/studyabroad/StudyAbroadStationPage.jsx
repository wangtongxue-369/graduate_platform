import { Link } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import { studyAbroadWorkspace } from '@/lib/workspacePreview.js'

export default function StudyAbroadStationPage() {
  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="留学工作台"
          title="让项目、案例、申请和材料待在同一张路线图里。"
          lead="留学方向的后端更像申请过程管理系统，所以主站围着申请路线图组织，而不是资讯式首页。"
        />

        <section className="v2-card-grid">
          {studyAbroadWorkspace.nav.slice(1).map((item) => (
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
            {studyAbroadWorkspace.timeline.map((item) => (
              <li key={`${item.stage}-${item.window}`}>{item.stage} / {item.window} / {item.note}</li>
            ))}
          </ul>
        </section>
      </aside>
    </>
  )
}

export function StudyAbroadProgramsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="项目目录"
        pathItems={[
          { label: '留学总览', to: '/station/studyabroad' },
          { label: '项目目录' },
        ]}
        title="先比较项目，再决定主申与备选。"
        lead="项目页承接 schools/page 的浏览行为，更适合做成项目书架而不是普通文章流。"
      />

      <section className="v2-card-grid">
        {studyAbroadWorkspace.programs.map((item) => (
          <article className="v2-module-card" key={`${item.school}-${item.track}`}>
            <strong>{item.school}</strong>
            <p>{item.track}</p>
            <p>{item.round}</p>
            <p>{item.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export function StudyAbroadCasesPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="案例档案"
        pathItems={[
          { label: '留学总览', to: '/station/studyabroad' },
          { label: '案例档案' },
        ]}
        title="把录取案例做成一组可快速判断用途的档案。"
        lead="案例页用档案卡而不是表格，因为人真正要看的是每个案例能提供什么参考价值。"
      />

      <section className="v2-card-grid">
        {studyAbroadWorkspace.cases.map((item) => (
          <article className="v2-module-card" key={item.accent}>
            <strong>{item.accent}</strong>
            <p>{item.title}</p>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export function StudyAbroadApplicationsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="申请跟踪"
        pathItems={[
          { label: '留学总览', to: '/station/studyabroad' },
          { label: '申请跟踪' },
        ]}
        title="把每个项目的申请状态挂成一条进度线。"
        lead="申请页本质是 pipeline，所以采用进度行而不是普通卡片。"
      />

      <section className="v2-timeline-card">
        {studyAbroadWorkspace.applications.map((item) => (
          <article className="v2-timeline-row" key={`${item.school}-${item.status}`}>
            <div className="v2-timeline-pin">{item.status.slice(0, 2)}</div>
            <div className="v2-timeline-body">
              <strong>{item.school}</strong>
              <p>{item.owner}</p>
              <span>{item.nextStep}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export function StudyAbroadTimelinePage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="时间线"
        pathItems={[
          { label: '留学总览', to: '/station/studyabroad' },
          { label: '时间线' },
        ]}
        title="每一个申请节点都需要明确的时间窗。"
        lead="时间线页直接对应 timeline 接口，重点是阶段、窗口和下一步。"
      />

      <section className="v2-timeline-card">
        {studyAbroadWorkspace.timeline.map((item) => (
          <article className="v2-timeline-row" key={`${item.stage}-${item.window}`}>
            <div className="v2-timeline-pin">{item.window}</div>
            <div className="v2-timeline-body">
              <strong>{item.stage}</strong>
              <span>{item.note}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export function StudyAbroadMaterialsPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="材料清单"
        pathItems={[
          { label: '留学总览', to: '/station/studyabroad' },
          { label: '材料清单' },
        ]}
        title="先维护材料状态，再进入补件动作。"
        lead="材料页更适合做成状态清单，直接体现 materials 与附件操作的维护感。"
      />

      <section className="v2-check-card">
        <div className="v2-check-list">
          {studyAbroadWorkspace.materials.map((item) => (
            <div className="v2-check-row" key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.state}</span>
              <span>{item.note}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
