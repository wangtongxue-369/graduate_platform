import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const users = [
  { id: 1, name: '就业测试用户', target: 'job', status: 'temporary_locked', action: '查看投递异常' },
  { id: 2, name: '资料互助测试用户', target: 'kaoyan', status: 'upload_limited', action: '核对附件违规记录' },
  { id: 3, name: '社区高频举报用户', target: 'kaogong', status: 'muted', action: '复核评论举报链路' },
]

export default function AdminUsersLedgerPage() {
  return (
    <section className="v1-task-page">
      <ReturnBar
        items={[
          { label: '值班总台', to: '/admin' },
          { label: '社区治理', to: '/admin/community' },
          { label: '用户状态管理' },
        ]}
        hint="先看风险状态，再决定是否进入更深的处置动作。"
      />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / users ledger</p>
        <h1>用户状态管理</h1>
        <p>按方向、状态和处置建议组织用户治理视图，让管理员先判断风险，再决定进入更深的处置动作。</p>
      </header>
      <div className="v1-card-stack">
        {users.map((item) => (
          <article className="v1-list-card" key={item.id}>
            <strong>{item.name}</strong>
            <span>{item.target} / {item.status}</span>
            <span>{item.action}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
