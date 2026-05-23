import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { practiceApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const granularityOptions = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
]

function PracticeStatisticsPage() {
  const { token, isAuthed } = useAuth()
  const canUsePractice = Boolean(isAuthed && token && token !== 'dev-token')

  const [granularity, setGranularity] = useState('day')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStats = useCallback(async () => {
    if (!canUsePractice) return
    setLoading(true)
    setError('')
    try {
      const data = await practiceApi.statistics(granularity, token)
      setStats(data || null)
    } catch (err) {
      setError(err.message || '加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }, [canUsePractice, granularity, token])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  function formatDuration(seconds) {
    if (!seconds) return '0s'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  if (!canUsePractice) {
    return (
      <div className="app">
        <Navbar />
        <main className="shell">
          <section className="section">
            <div className="section-head">
              <p className="eyebrow">统计分析</p>
              <h2>需要登录</h2>
              <p className="muted">查看练习统计需要登录真实账号。</p>
            </div>
            <Link className="btn primary" to="/login">去登录</Link>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">统计分析</p>
            <h2>练习统计</h2>
            <p className="muted">日/周/月趋势，累计表现及高频错点。</p>
            <Link className="btn ghost small" to="/practice">返回题库首页</Link>
          </div>

          <div className="feature-card">
            <div className="track-head">
              <div className="card-title">累计表现</div>
              <select value={granularity} onChange={(e) => setGranularity(e.target.value)}>
                {granularityOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            {loading ? (
              <p className="muted">加载中...</p>
            ) : error ? (
              <div className="error-text">{error}</div>
            ) : stats ? (
              <>
                <div className="mini-grid">
                  <MiniCard value={stats.practiceCount ?? 0} label="练习次数" />
                  <MiniCard value={`${stats.averageAccuracy ?? 0}%`} label="平均正确率" />
                  <MiniCard value={formatDuration(stats.totalDurationSeconds || 0)} label="累计时长" />
                </div>

                {stats.trend && stats.trend.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: '1.5rem' }}>趋势</h3>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>时段</th>
                            <th>练习次数</th>
                            <th>平均正确率</th>
                            <th>累计时长</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.trend.map((item, index) => (
                            <tr key={index}>
                              <td>{item.period}</td>
                              <td>{item.practiceCount}</td>
                              <td>{item.averageAccuracy != null ? `${item.averageAccuracy}%` : '-'}</td>
                              <td>{formatDuration(item.totalDurationSeconds)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <p className="muted">暂无统计数据，完成一次练习后会自动生成。</p>
            )}
          </div>

          <div className="feature-card">
            <div className="card-title">高频错点 TopN</div>
            {stats?.frequentWrongKnowledgePoints?.length > 0 ? (
              <div className="wrong-list">
                {stats.frequentWrongKnowledgePoints.map((item) => (
                  <div className="wrong-item" key={item.knowledgePoint}>
                    <div className="wrong-title">{item.knowledgePoint}</div>
                    <div className="muted">累计错误 {item.wrongCount} 次</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">暂无高频错点。</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function MiniCard({ value, label }) {
  return (
    <div className="mini-card">
      <div className="mini-value">{value}</div>
      <div className="mini-label">{label}</div>
    </div>
  )
}

export default PracticeStatisticsPage
