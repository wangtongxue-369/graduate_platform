import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { normalizePagedResult } from '@/lib/practice/normalizers.js'

const emptySummary = {
  history: [],
  wrongTotal: 0,
  practiceCount: 0,
}

function formatTime(value) {
  return String(value || '').slice(0, 16).replace('T', ' ')
}

export default function SettingsPracticePage() {
  const { token, isAuthed } = useAuth()
  const [summary, setSummary] = useState(emptySummary)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthed || !token || token === 'dev-token') {
      setSummary(emptySummary)
      setMessage('登录后可查看你的练习摘要。')
      return undefined
    }

    let active = true

    async function loadSummary() {
      try {
        const [history, wrongs, stats] = await Promise.all([
          practiceApi.history({ page: 1, size: 5 }, token),
          practiceApi.wrongQuestions({ page: 0, size: 1 }, token),
          practiceApi.statistics('day', token),
        ])

        if (!active) return
        setSummary({
          history: normalizePagedResult(history).items,
          wrongTotal: normalizePagedResult(wrongs).total,
          practiceCount: stats?.practiceCount ?? 0,
        })
        setMessage('')
      } catch (error) {
        if (!active) return
        setSummary(emptySummary)
        setMessage(error.message || '练习摘要暂时不可用。')
      }
    }

    loadSummary()
    return () => {
      active = false
    }
  }, [isAuthed, token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="practice summary"
        pathItems={[
          { label: '个人设置', to: '/settings/profile' },
          { label: '练习摘要' },
        ]}
        title="练习摘要"
        lead="这里只做总览和跳转，不再把完整练习流程塞进设置页。"
        actions={(
          <div className="v2-inline-actions">
            <Link className="v2-secondary-link" to="/practice">进入题库目录</Link>
            <Link className="v2-secondary-link" to="/practice/history">进入练习历史</Link>
            <Link className="v2-secondary-link" to="/practice/wrong-questions">进入错题回练</Link>
            <Link className="v2-secondary-link" to="/practice/statistics">进入练习统计</Link>
          </div>
        )}
      />

      {message ? <div className="v2-status-note">{message}</div> : null}

      <section className="v2-summary-strip" aria-label="练习摘要">
        <article className="v2-summary-card">
          <span>今日练习</span>
          <strong>{summary.practiceCount}</strong>
          <p>今日累计已完成的练习场次。</p>
        </article>
        <article className="v2-summary-card">
          <span>待回练错题</span>
          <strong>{summary.wrongTotal}</strong>
          <p>错题会单独进入回练会话，不再夹在设置页里。</p>
        </article>
        <article className="v2-summary-card">
          <span>最近提交</span>
          <strong>{summary.history.length}</strong>
          <p>展示最近几次练习提交的摘要。</p>
        </article>
      </section>

      <section className="v2-article-card">
        <div className="v2-section-head">
          <div>
            <p className="v2-kicker">最近历史</p>
            <h3>从这里跳回完整练习分析页</h3>
          </div>
        </div>

        {summary.history.length ? (
          <div className="v2-check-list">
            {summary.history.map((item) => (
              <article className="v2-check-row" key={item.id}>
                <strong>{item.bankName || `题库 ${item.bankId}`}</strong>
                <span>
                  {item.mode || 'chapter'}
                  {' / 得分 '}
                  {item.score ?? '-'}
                </span>
                <span>{formatTime(item.submittedAt)}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="v2-empty-card">最近还没有可展示的练习提交。</div>
        )}
      </section>
    </div>
  )
}
