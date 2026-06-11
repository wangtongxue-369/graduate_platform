import PageIntro from '@/components/PageIntro.jsx'
import { adminWorkspace } from '@/lib/workspacePreview.js'

export default function AdminMainPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="值班总台"
        title="首页先分诊，再进入各管理模块处理队列。"
        lead="管理员首页不再堆一整屏说明卡，而是先展示真实待处理工作，再切入社区、题库、考研、考公与就业治理。"
      />

      <section className="v2-card-grid">
        {adminWorkspace.queues.map((item) => (
          <article className="v2-module-card" key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.count} 项待处理</p>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>

      <section className="v2-feed-list" aria-label="最近处理">
        {adminWorkspace.recentActions.map((item, index) => (
          <div className="v2-feed-item" key={item}>
            <div className="v2-feed-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="v2-feed-body">
              <strong>{item}</strong>
              <p>处理完成后回到治理队列，不把无关说明堆在首页。</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function AdminDomainPage({ domainKey, title, lead }) {
  const domain = adminWorkspace.domains[domainKey]

  return (
    <div className="v2-main-column">
      <PageIntro kicker={domain.heading} lead={lead} title={title} />

      <section className="v2-card-grid">
        {domain.queues.map((item) => (
          <article className="v2-module-card" key={item.name}>
            <strong>{item.name}</strong>
            <p>{item.count} 项</p>
            <p>{item.note}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export function AdminCommunityPage() {
  return (
    <AdminDomainPage
      domainKey="community"
      title="把帖子、评论和举报拉回同一条治理链路。"
      lead="社区治理更适合队列式工作台，先看待审、待处置与分类调整，再进入具体处理。"
    />
  )
}

export function AdminQuestionBanksPage() {
  return (
    <AdminDomainPage
      domainKey="questionBanks"
      title="题库后台更像编辑台，而不是总览海报。"
      lead="题库治理的重心是导入、快照和错题申诉，所以中心区优先呈现批次与版本。"
    />
  )
}

export function AdminKaoyanPage() {
  return (
    <AdminDomainPage
      domainKey="kaoyan"
      title="先保证资料质量，再放大考研内容规模。"
      lead="考研治理围绕资料审核、分数线维护与导师入驻，布局会更偏管理台。"
    />
  )
}

export function AdminKaogongPage() {
  return (
    <AdminDomainPage
      domainKey="kaogong"
      title="岗位、节点和面试房间都要回到治理回路。"
      lead="考公治理强调岗位更新、日历异常和房间反馈，所以页面结构优先承载流程。"
    />
  )
}

export function AdminEmploymentPage() {
  return (
    <AdminDomainPage
      domainKey="employment"
      title="先处理招聘会、岗位和通知，再谈运营效果。"
      lead="就业运营页要承接招聘会、岗位清洗和通知触达三类后端能力，不再做空泛总览。"
    />
  )
}
