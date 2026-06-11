import { Link, useParams } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import { createPracticePreview, findPracticePreviewBank } from '@/lib/practicePreview.js'

const practiceStages = [
  { title: '练习会话', note: '进入题库后开始具体做题，不和目录混在一起。' },
  { title: '历史记录', note: '每次提交单独沉淀，方便回看节奏。' },
  { title: '统计看板', note: '准确率和连续训练独立展示。' },
  { title: '错题重练', note: '错题单独回流，不挤占选库页面。' },
]

export default function PracticeDirectoryPage() {
  const preview = createPracticePreview()

  return (
    <div className="v2-main-column">
      <PageIntro
        actions={<RoleAuthLink className="v2-secondary-link">登录后继续训练</RoleAuthLink>}
        kicker="训练入口"
        title="先选题库，再进入具体训练回路。"
        lead="题库目录页只负责选择和分流，把做题、历史、统计、错题拆成后续页面，首页保持清爽。"
      />

      <section className="v2-summary-strip" aria-label="题库摘要">
        <article className="v2-summary-card">
          <span>可选题库</span>
          <strong>{String(preview.banks.length).padStart(2, '0')}</strong>
          <p>按方向与章节进入，不在这里直接做题。</p>
        </article>
        <article className="v2-summary-card">
          <span>连续训练</span>
          <strong>{preview.statistics.streakDays} 天</strong>
          <p>最近一次提交在 {preview.statistics.lastSessionAt.slice(5, 16).replace('T', ' ')}</p>
        </article>
        <article className="v2-summary-card">
          <span>累计场次</span>
          <strong>{preview.statistics.totalSessions}</strong>
          <p>当前预览的是有数据时的题库目录状态。</p>
        </article>
      </section>

      <section className="v2-feed-list" aria-label="题库目录">
        {preview.banks.map((bank) => (
          <Link className="v2-feed-item" key={bank.id} to={`/practice/banks/${bank.id}`}>
            <div className="v2-feed-index">{String(bank.id).padStart(2, '0')}</div>
            <div className="v2-feed-body">
              <div className="v2-article-meta">
                <span>{bank.target}</span>
                <span>{bank.subject}</span>
                <span>{bank.chapter}</span>
                <span>{bank.questionCount} 题</span>
              </div>
              <strong>{bank.title}</strong>
              <p>{bank.description}</p>
            </div>
            <span className="v2-feed-action">进入预览</span>
          </Link>
        ))}
      </section>

      <section className="v2-split-board" aria-label="训练后续">
        <article className="v2-article-card">
          <p className="v2-kicker">最近训练</p>
          <div className="v2-check-list">
            {preview.history.map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.bankTitle}</strong>
                <span>{item.mode} / 得分 {item.score}</span>
                <span>{item.submittedAt.slice(5, 16).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="v2-article-card">
          <p className="v2-kicker">错题回看</p>
          <div className="v2-check-list">
            {preview.wrongQuestions.map((item) => (
              <div className="v2-check-row" key={item.questionId}>
                <strong>{item.title}</strong>
                <span>{item.subject} / {item.chapter}</span>
                <span>已错 {item.wrongCount} 次</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="v2-article-card" aria-label="训练链路">
        <p className="v2-kicker">进入后会看到</p>
        <div className="v2-process-strip">
          {practiceStages.map((item) => (
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

export function PracticeBankPreviewPage() {
  const { bankId } = useParams()
  const preview = createPracticePreview()
  const bank = findPracticePreviewBank(bankId)

  return (
    <div className="v2-main-column">
      <PageIntro
        actions={<RoleAuthLink className="v2-secondary-link">登录后开始做题</RoleAuthLink>}
        kicker="题库预览"
        pathItems={[
          { label: '题库目录', to: '/practice' },
          { label: bank ? bank.title : '题库预览' },
        ]}
        title={bank ? `${bank.subject} / ${bank.chapter}` : '题库不存在'}
        lead={bank ? `${bank.description} 这里重点模拟选中题库后，历史、统计和错题如何围绕它展开。` : '没有找到这个题库。'}
      />

      {bank ? (
        <>
          <section className="v2-summary-strip" aria-label="题库概览">
            <article className="v2-summary-card">
              <span>适用方向</span>
              <strong>{bank.target}</strong>
              <p>{bank.subject} / {bank.chapter}</p>
            </article>
            <article className="v2-summary-card">
              <span>题量</span>
              <strong>{bank.questionCount} 题</strong>
              <p>难度 {bank.difficulty}</p>
            </article>
            <article className="v2-summary-card">
              <span>当前正确率</span>
              <strong>{Math.round(preview.statistics.accuracyRate * 100)}%</strong>
              <p>连续训练 {preview.statistics.streakDays} 天</p>
            </article>
          </section>

          <section className="v2-split-board" aria-label="题库状态">
            <article className="v2-article-card">
              <p className="v2-kicker">最近训练</p>
              <div className="v2-check-list">
                {preview.history.map((item) => (
                  <div className="v2-check-row" key={item.id}>
                    <strong>{item.bankTitle}</strong>
                    <span>{item.mode} / 得分 {item.score}</span>
                    <span>{item.submittedAt.slice(5, 16).replace('T', ' ')}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="v2-article-card">
              <p className="v2-kicker">错题重练</p>
              <div className="v2-check-list">
                {preview.wrongQuestions.map((item) => (
                  <div className="v2-check-row" key={item.questionId}>
                    <strong>{item.title}</strong>
                    <span>{item.subject} / {item.chapter}</span>
                    <span>需要回炉 {item.wrongCount} 次</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="v2-article-card">
            <p className="v2-kicker">训练闭环</p>
            <div className="v2-process-strip">
              {practiceStages.map((item) => (
                <article className="v2-process-node" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.note}</strong>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
