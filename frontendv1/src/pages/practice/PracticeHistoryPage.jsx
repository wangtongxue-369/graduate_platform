import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import { createPracticePreview } from '@/lib/practicePreview.js'

export default function PracticeHistoryPage() {
  const { history } = createPracticePreview()

  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '题库目录', to: '/practice' }, { label: '练习历史' }]} hint="历史单独成页，不和题库目录揉在一起。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">practice / history</p>
        <h1>练习历史</h1>
        <p>回看每次练习记录，确认练习模式、成绩和时间，而不是回目录反复找入口。</p>
      </header>
      <div className="v1-card-stack">
        {history.map((item) => (
          <article className="v1-list-card" key={item.id}>
            <strong>{item.bankTitle}</strong>
            <span>{item.mode} / 成绩 {item.score}</span>
            <span>{item.submittedAt.replace('T', ' ').slice(0, 16)}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
