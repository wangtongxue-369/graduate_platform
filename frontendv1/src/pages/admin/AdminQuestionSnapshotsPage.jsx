import { useParams } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const snapshots = [
  '2026-06-02 14:22 导入批次修订答案',
  '2026-05-29 09:10 手动下线旧版本',
]

export default function AdminQuestionSnapshotsPage() {
  const { bankId, questionId } = useParams()

  return (
    <section className="v1-task-page">
      <ReturnBar
        items={[
          { label: '值班总台', to: '/admin' },
          { label: '题库治理', to: '/admin/question-banks' },
          { label: `题库 ${bankId} 题目列表`, to: `/admin/question-banks/${bankId}/questions` },
          { label: `题目 ${questionId} 快照` },
        ]}
        hint="快照页是独立深页，不回退成模糊弹窗。"
      />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / question snapshots</p>
        <h1>题目快照</h1>
      </header>
      <div className="v1-card-stack">
        {snapshots.map((item) => (
          <article className="v1-list-card" key={item}>
            <strong>{item}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}
