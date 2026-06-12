import { useMemo, useState } from 'react'
import PageIntro from '@/components/PageIntro.jsx'
import { adminWorkspace } from '@/lib/workspacePreview.js'

const priorityOptions = [
  { value: 'all', label: '全部队列' },
  { value: 'high', label: '高优先' },
  { value: 'medium', label: '中优先' },
  { value: 'low', label: '低优先' },
]

function getQueuePriority(count) {
  if (count >= 12) return 'high'
  if (count >= 6) return 'medium'
  return 'low'
}

function matchesKeyword(queue, keyword) {
  if (!keyword) return true
  const text = `${queue.name || ''} ${queue.note || ''}`.toLowerCase()
  return text.includes(String(keyword).trim().toLowerCase())
}

export default function AdminMainPage() {
  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="值班总台"
        title="首页先分诊，再进入各管理模块处理队列。"
        lead="先看待处理工作，再切入具体治理模块。"
      />

      <section className="v2-card-grid v2-card-grid--dense">
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
              <p>处理完当前队列后再切下一个模块。</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

function AdminDomainPage({ domainKey, title, lead }) {
  const domain = adminWorkspace.domains[domainKey]
  const [keyword, setKeyword] = useState('')
  const [priority, setPriority] = useState('all')
  const pathItems = [
    { label: '管理员主站', to: '/admin' },
    { label: domain.heading },
  ]
  const filteredQueues = useMemo(() => (
    domain.queues.filter((item) => matchesKeyword(item, keyword))
      .filter((item) => priority === 'all' || getQueuePriority(item.count) === priority)
  ), [domain.queues, keyword, priority])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker={domain.heading}
          lead={lead}
          pathItems={pathItems}
          title={title}
        />

        <section className="v2-card-grid">
          {filteredQueues.map((item) => (
            <article className="v2-module-card" key={item.name}>
              <strong>{item.name}</strong>
              <p>{item.count} 项</p>
              <p>{item.note}</p>
            </article>
          ))}
        </section>

        <section className="v2-feed-list" aria-label={`${domain.heading}处理节奏`}>
          {filteredQueues.length ? filteredQueues.map((item, index) => (
            <div className="v2-feed-item" key={`${item.name}-${index}`}>
              <div className="v2-feed-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="v2-feed-body">
                <strong>{item.name}</strong>
                <p>{item.note}</p>
              </div>
              <span className="v2-feed-action">{item.count} 项</span>
            </div>
          )) : (
            <div className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有匹配的治理队列</strong>
                <p>可以放宽关键词或切回全部优先级，再继续处理中间区域的结果。</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>检索队列</span>
              <input
                type="text"
                value={keyword}
                placeholder="搜队列名称或处理提示"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>

            <label className="v2-field">
              <span>优先级</span>
              <div className="v2-segment-group" role="group" aria-label="优先级">
                {priorityOptions.map((item) => (
                  <button
                    className={`v2-segment-button ${priority === item.value ? 'is-active' : ''}`}
                    key={item.value}
                    type="button"
                    onClick={() => setPriority(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
          </form>
        </section>
      </aside>
    </>
  )
}

export function AdminCommunityPage() {
  return (
    <AdminDomainPage
      domainKey="community"
      title="把帖子、评论和举报拉回同一条治理链路。"
      lead="先看待审与待处置，再进入具体处理。"
    />
  )
}

export function AdminQuestionBanksPage() {
  return (
    <AdminDomainPage
      domainKey="questionBanks"
      title="题库后台更像编辑台，而不是总览海报。"
      lead="重点放在导入、快照和错题申诉。"
    />
  )
}

export function AdminKaoyanPage() {
  return (
    <AdminDomainPage
      domainKey="kaoyan"
      title="先保证资料质量，再放大考研内容规模。"
      lead="围绕资料审核、分数线维护与导师入驻。"
    />
  )
}

export function AdminKaogongPage() {
  return (
    <AdminDomainPage
      domainKey="kaogong"
      title="岗位、节点和面试房间都要回到治理回路。"
      lead="重点看岗位更新、日历异常和房间反馈。"
    />
  )
}

export function AdminEmploymentPage() {
  return (
    <AdminDomainPage
      domainKey="employment"
      title="先处理招聘会、岗位和通知，再谈运营效果。"
      lead="先处理招聘会、岗位清洗和通知触达。"
    />
  )
}
