import { Link } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const banks = [
  { id: '1', name: '考研英语真题库', meta: '214 题 / active', next: '/admin/question-banks/1/questions' },
  { id: '2', name: '考公行测刷题库', meta: '168 题 / inactive', next: '/admin/question-banks/2/questions' },
]

export default function AdminQuestionBankLedgerPage() {
  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '题库治理' }]} hint="先筛题库，再进入题目治理、导入与快照。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / question bank governance</p>
        <h1>题库治理</h1>
        <p>题库治理使用数据治理台：检索、主表、批量动作和对象摘要，而不是审核流页面。</p>
      </header>
      <div className="v1-admin-governance-shell">
        <section className="v1-admin-filter-strip">
          <span>题库列表</span>
          <span>批量导入</span>
          <span>状态切换</span>
        </section>
        <div className="v1-admin-governance-grid">
          <div className="v1-admin-table-list">
            {banks.map((bank) => (
              <Link className="v1-admin-table-row" key={bank.id} to={bank.next}>
                <strong>{bank.name}</strong>
                <span>{bank.meta}</span>
              </Link>
            ))}
          </div>
          <aside className="v1-admin-object-summary">
            <strong>对象摘要</strong>
            <span>题目快照</span>
            <span>导入历史</span>
          </aside>
        </div>
      </div>
    </section>
  )
}
