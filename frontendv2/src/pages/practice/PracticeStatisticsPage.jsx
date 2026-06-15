import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeStatisticsDashboard from '@/components/practice/PracticeStatisticsDashboard.jsx'

export default function PracticeStatisticsPage() {
  const { token, isAuthed } = useAuth()
  const canUsePractice = Boolean(isAuthed && token && token !== 'dev-token')

  const [granularity, setGranularity] = useState('day')
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState(canUsePractice ? 'loading' : 'guest')
  const [message, setMessage] = useState('')

  const loadStats = useCallback(async () => {
    if (!canUsePractice) return

    setStatus('loading')
    setMessage('')

    try {
      const data = await practiceApi.statistics(granularity, token)
      const nextStats = data || null
      const isEmpty = !nextStats || ((nextStats.practiceCount ?? 0) === 0 && !(nextStats.trend || []).length)
      setStats(nextStats)
      setStatus(isEmpty ? 'empty' : 'ready')
    } catch (error) {
      setStats(null)
      setStatus('error')
      setMessage(error.message || '练习统计暂时不可用')
    }
  }, [canUsePractice, granularity, token])

  useEffect(() => {
    if (!canUsePractice) {
      setStatus('guest')
      setStats(null)
      setMessage('')
      return
    }

    loadStats()
  }, [canUsePractice, loadStats])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="练习复盘"
        pathItems={[
          { label: '题库目录', to: '/practice' },
          { label: '练习统计' },
        ]}
        title="练习统计"
        lead="按日、周、月回看练习频率、正确率、投入时长与高频错点。"
      />

      {status === 'guest' ? (
        <section className="v2-article-card v2-practice-dashboard-state">
          <p className="v2-kicker">个人数据</p>
          <h3>登录后查看训练复盘</h3>
          <p>统计会汇总你已交卷的练习记录、正确率走势和高频错点。</p>
          <div className="v2-inline-actions v2-practice-dashboard-actions">
            <Link className="v2-primary-button" to="/login">去登录</Link>
            <Link className="v2-secondary-link" to="/practice">返回题库目录</Link>
          </div>
        </section>
      ) : null}

      {status === 'loading' ? (
        <section className="v2-article-card v2-practice-dashboard-shell">
          <div className="v2-practice-dashboard-skeleton-band" />
          <div className="v2-practice-stats-grid v2-practice-stats-band">
            <div className="v2-summary-card is-skeleton" />
            <div className="v2-summary-card is-skeleton" />
            <div className="v2-summary-card is-skeleton" />
          </div>
          <div className="v2-practice-dashboard-body">
            <div className="v2-practice-chart-card is-skeleton" />
            <div className="v2-practice-insight-card is-skeleton" />
          </div>
        </section>
      ) : null}

      {status === 'error' ? (
        <section className="v2-article-card v2-practice-dashboard-state">
          <p className="v2-kicker">请求失败</p>
          <h3>练习统计暂时不可用</h3>
          <p>{message}</p>
          <div className="v2-inline-actions v2-practice-dashboard-actions">
            <button type="button" className="v2-primary-button" onClick={loadStats}>重新加载</button>
            <Link className="v2-secondary-link" to="/practice">返回题库目录</Link>
          </div>
        </section>
      ) : null}

      {status === 'empty' ? (
        <section className="v2-article-card v2-practice-dashboard-state">
          <p className="v2-kicker">练习记录</p>
          <h3>还没有可复盘的练习记录</h3>
          <p>完成一次交卷后，这里会自动生成趋势与错点分析。</p>
          <div className="v2-inline-actions v2-practice-dashboard-actions">
            <Link className="v2-primary-button" to="/practice">去开始练习</Link>
          </div>
        </section>
      ) : null}

      {status === 'ready' ? (
        <PracticeStatisticsDashboard
          granularity={granularity}
          onGranularityChange={setGranularity}
          stats={stats}
        />
      ) : null}
    </div>
  )
}
