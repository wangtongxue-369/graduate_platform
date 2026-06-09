import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
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

  // 后端约定：客观题数为 0 时 averageAccuracy=null（"该周期未练客观题"）。
  // 这里保留 null 让 recharts 在该点自然断线，而不是用 ?? 0 强制画成 0%
  // 误导用户以为"全错"。
  const trendData = (stats?.trend || []).map((item) => ({
    ...item,
    accuracy: item.averageAccuracy,
  }))

  const wrongPointData = (stats?.frequentWrongKnowledgePoints || []).map((item) => ({
    name: item.knowledgePoint,
    wrongCount: item.wrongCount,
  }))

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

                {/* 趋势图表 */}
                {trendData.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3>趋势</h3>
                    <div style={{ width: '100%', height: 280, marginTop: '1rem' }}>
                      <ResponsiveContainer>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 12, fill: 'var(--muted, #6b7280)' }}
                            tickFormatter={(v) => v.length > 7 ? v.substring(5) : v}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12, fill: 'var(--muted, #6b7280)' }}
                            label={{ value: '次数', angle: -90, position: 'insideLeft', fontSize: 12 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 100]}
                            tick={{ fontSize: 12, fill: 'var(--muted, #6b7280)' }}
                            label={{ value: '正确率%', angle: 90, position: 'insideRight', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--surface, #fff)',
                              border: '1px solid var(--border, #e5e7eb)',
                              borderRadius: 8,
                              fontSize: 13,
                            }}
                            formatter={(value, name) => {
                              if (name === 'accuracy') return [`${value}%`, '正确率']
                              return [value, '练习次数']
                            }}
                          />
                          <Legend formatter={(value) => value === 'accuracy' ? '正确率' : '练习次数'} />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="practiceCount"
                            stroke="var(--accent, #6366f1)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="accuracy"
                            stroke="var(--success, #22c55e)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 保留表格作为数据明细 */}
                    <details style={{ marginTop: '1rem' }}>
                      <summary style={{ cursor: 'pointer', color: 'var(--muted, #6b7280)', fontSize: '0.875rem' }}>
                        查看数据明细
                      </summary>
                      <div className="table-wrap" style={{ marginTop: '0.5rem' }}>
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
                    </details>
                  </div>
                )}
              </>
            ) : (
              <p className="muted">暂无统计数据，完成一次练习后会自动生成。</p>
            )}
          </div>

          {/* 高频错点图表 */}
          <div className="feature-card">
            <div className="card-title">高频错点 TopN</div>
            {wrongPointData.length > 0 ? (
              <>
                <div style={{ width: '100%', height: Math.max(200, wrongPointData.length * 40 + 40), marginTop: '1rem' }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={wrongPointData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--muted, #6b7280)' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12, fill: 'var(--muted, #6b7280)' }}
                        width={75}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--surface, #fff)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                        formatter={(value) => [`${value} 次`, '错误次数']}
                      />
                      <Bar
                        dataKey="wrongCount"
                        fill="var(--danger, #ef4444)"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 保留列表作为降级 */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--muted, #6b7280)', fontSize: '0.875rem' }}>
                    查看列表
                  </summary>
                  <div className="wrong-list" style={{ marginTop: '0.5rem' }}>
                    {stats.frequentWrongKnowledgePoints.map((item) => (
                      <div className="wrong-item" key={item.knowledgePoint}>
                        <div className="wrong-title">{item.knowledgePoint}</div>
                        <div className="muted">累计错误 {item.wrongCount} 次</div>
                      </div>
                    ))}
                  </div>
                </details>
              </>
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
