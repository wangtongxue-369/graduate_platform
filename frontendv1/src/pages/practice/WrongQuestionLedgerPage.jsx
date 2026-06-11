import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import { createPracticePreview } from '@/lib/practicePreview.js'

export default function WrongQuestionLedgerPage() {
  const { wrongQuestions } = createPracticePreview()

  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '题库目录', to: '/practice' }, { label: '错题账本' }]} hint="错题和统计、历史分开，让复练路径更清楚。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">practice / wrong ledger</p>
        <h1>错题账本</h1>
        <p>这里专门看错题条目和重练入口，不把目录树与错题混在一起。</p>
      </header>
      <div className="v1-card-stack">
        {wrongQuestions.map((item) => (
          <article className="v1-list-card" key={item.questionId}>
            <strong>{item.title}</strong>
            <span>{item.subject} / {item.chapter}</span>
            <span>累计做错 {item.wrongCount} 次</span>
          </article>
        ))}
      </div>
      <div className="v1-action-row">
        <RoleAuthLink className="v1-btn v1-btn--primary">登录后错题重练</RoleAuthLink>
      </div>
    </section>
  )
}
