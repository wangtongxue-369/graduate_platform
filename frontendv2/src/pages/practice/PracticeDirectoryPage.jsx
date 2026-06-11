import { Link, useParams } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import { createPracticePreview, findPracticePreviewBank } from '@/lib/practicePreview.js'

export default function PracticeDirectoryPage() {
  const preview = createPracticePreview()

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          actions={<RoleAuthLink className="v2-secondary-link">登录后继续训练</RoleAuthLink>}
          kicker="训练入口"
          title="先挑题库，再进入具体训练回路。"
          lead="题库目录页只负责选择与分流，不把做题、统计和错题重练硬塞进同一屏。"
        />

        <section className="v2-feed-list" aria-label="题库目录">
          {preview.banks.map((bank) => (
            <Link className="v2-feed-item" key={bank.id} to={`/practice/banks/${bank.id}`}>
              <div className="v2-feed-index">{String(bank.id).padStart(2, '0')}</div>
              <div className="v2-feed-body">
                <strong>{bank.title}</strong>
                <p>{bank.target} / {bank.subject} / {bank.chapter} / {bank.questionCount} 题</p>
              </div>
              <span className="v2-feed-action">预览</span>
            </Link>
          ))}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">训练后续</p>
          <ul>
            <li>练习会话</li>
            <li>历史记录</li>
            <li>统计看板</li>
            <li>错题重练</li>
          </ul>
        </section>
      </aside>
    </>
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
        title={bank ? `${bank.subject} / ${bank.chapter}` : '题库不存在'}
        lead={bank ? `${bank.description} 这里重点模拟题库被选中之后，历史、错题和统计如何围绕它展开。` : '没有找到这个题库。'}
      />

      {bank ? (
        <>
          <section className="v2-card-grid">
            <article className="v2-module-card">
              <strong>题库摘要</strong>
              <p>方向：{bank.target}</p>
              <p>科目：{bank.subject}</p>
              <p>难度：{bank.difficulty}</p>
              <p>题量：{bank.questionCount}</p>
            </article>
            <article className="v2-module-card">
              <strong>统计摘要</strong>
              <p>准确率：{Math.round(preview.statistics.accuracyRate * 100)}%</p>
              <p>连续训练：{preview.statistics.streakDays} 天</p>
              <p>训练场次：{preview.statistics.totalSessions}</p>
            </article>
          </section>

          <section className="v2-feed-list" aria-label="最近练习">
            {preview.history.map((item) => (
              <div className="v2-feed-item" key={item.id}>
                <div className="v2-feed-index">HS</div>
                <div className="v2-feed-body">
                  <strong>{item.bankTitle}</strong>
                  <p>{item.mode} / 得分 {item.score} / {item.submittedAt.slice(5, 16).replace('T', ' ')}</p>
                </div>
                <span className="v2-feed-action">历史</span>
              </div>
            ))}
          </section>

          <section className="v2-article-card">
            <p className="v2-kicker">错题重练</p>
            <div className="v2-check-list">
              {preview.wrongQuestions.map((item) => (
                <div className="v2-check-row" key={item.questionId}>
                  <strong>{item.title}</strong>
                  <span>{item.subject} / {item.chapter}</span>
                  <span>错了 {item.wrongCount} 次</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
