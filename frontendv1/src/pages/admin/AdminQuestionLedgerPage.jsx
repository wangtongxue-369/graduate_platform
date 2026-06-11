import { Link, useParams } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const questions = [
  { id: '101', title: '阅读理解第 1 题', status: 'published' },
  { id: '102', title: '数量关系第 4 题', status: 'disabled' },
]

export default function AdminQuestionLedgerPage() {
  const { bankId } = useParams()

  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '题库治理', to: '/admin/question-banks' }, { label: `题库 ${bankId} 题目列表` }]} hint="在题目列表里进入编辑、批量导入和快照。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / question ledger</p>
        <h1>题目列表</h1>
        <p>题目治理承接更新、删除、状态切换与快照查看，不把深操作塞回总台首页。</p>
      </header>
      <div className="v1-admin-governance-shell">
        <section className="v1-admin-filter-strip">
          <span>发布状态</span>
          <span>批量编辑</span>
          <span>批量导入</span>
        </section>
        <div className="v1-admin-table-list">
          {questions.map((question) => (
            <Link className="v1-admin-table-row" key={question.id} to={`/admin/question-banks/${bankId}/questions/${question.id}/snapshots`}>
              <strong>{question.title}</strong>
              <span>{question.status}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
