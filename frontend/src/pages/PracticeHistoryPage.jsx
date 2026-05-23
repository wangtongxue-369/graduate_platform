import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { practiceApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const modeLabels = {
  chapter: '章节练习',
  random: '随机练习',
  mock: '模拟练习',
}

const modeOptions = [
  { value: '', label: '全部' },
  { value: 'chapter', label: '章节练习' },
  { value: 'random', label: '随机练习' },
  { value: 'mock', label: '模拟练习' },
]

function PracticeHistoryPage() {
  const { token, isAuthed } = useAuth()
  const canUsePractice = Boolean(isAuthed && token && token !== 'dev-token')

  const [filters, setFilters] = useState({
    mode: '',
    target: '',
    subject: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    size: 20,
  })
  const [history, setHistory] = useState({ items: [], total: 0, page: 1, size: 20, totalPages: 0 })
  const [options, setOptions] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!canUsePractice) {
      setLoading(false)
      return
    }
    practiceApi.options().then(setOptions).catch(() => {})
  }, [canUsePractice])

  const loadHistory = useCallback(async () => {
    if (!canUsePractice) return
    setLoading(true)
    setError('')
    try {
      const query = { page: filters.page, size: filters.size }
      if (filters.mode) query.mode = filters.mode
      if (filters.target) query.target = filters.target
      if (filters.subject) query.subject = filters.subject
      if (filters.dateFrom) query.dateFrom = filters.dateFrom
      if (filters.dateTo) query.dateTo = filters.dateTo
      const data = await practiceApi.history(query, token)
      setHistory(data || { items: [], total: 0, page: 1, size: 20, totalPages: 0 })
    } catch (err) {
      setError(err.message || '加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }, [canUsePractice, filters, token])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }))
  }

  function formatDuration(seconds) {
    if (!seconds) return '-'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    return dateStr.replace('T', ' ').substring(0, 19)
  }

  if (!canUsePractice) {
    return (
      <div className="app">
        <Navbar />
        <main className="shell">
          <section className="section">
            <div className="section-head">
              <p className="eyebrow">练习历史</p>
              <h2>需要登录</h2>
              <p className="muted">查看练习历史需要登录真实账号。</p>
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
            <p className="eyebrow">练习历史</p>
            <h2>历史交卷记录</h2>
            <p className="muted">查看每次练习的时间、模式、正确率和用时。</p>
            <Link className="btn ghost small" to="/practice">返回题库首页</Link>
          </div>

          <div className="feature-card">
            <div className="card-title">筛选条件</div>
            <div className="filter-grid">
              <label className="field">
                <span>模式</span>
                <select value={filters.mode} onChange={(e) => updateFilter('mode', e.target.value)}>
                  {modeOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>方向</span>
                <select value={filters.target} onChange={(e) => updateFilter('target', e.target.value)}>
                  <option value="">全部</option>
                  {(options.targets || []).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>科目</span>
                <select value={filters.subject} onChange={(e) => updateFilter('subject', e.target.value)}>
                  <option value="">全部</option>
                  {(options.subjects || []).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>开始日期</span>
                <input type="date" value={filters.dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
              </label>
              <label className="field">
                <span>结束日期</span>
                <input type="date" value={filters.dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : error ? (
            <div className="feature-card">
              <div className="card-title">加载失败</div>
              <p className="muted">{error}</p>
              <button className="btn outline small" type="button" onClick={loadHistory}>重试</button>
            </div>
          ) : history.items.length === 0 ? (
            <div className="feature-card">
              <div className="card-title">暂无历史记录</div>
              <p className="muted">完成一次练习并交卷后，记录会显示在这里。</p>
              <Link className="btn primary small" to="/practice">去练习</Link>
            </div>
          ) : (
            <>
              <div className="feature-card">
                <div className="card-title">
                  共 {history.total} 条记录
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>交卷时间</th>
                        <th>题库</th>
                        <th>模式</th>
                        <th>总分</th>
                        <th>正确率</th>
                        <th>用时</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.items.map((item) => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.submittedAt)}</td>
                          <td>{item.bankName || '-'}</td>
                          <td>{modeLabels[item.mode] || item.mode}</td>
                          <td>{item.score ?? '-'}</td>
                          <td>{item.accuracy != null ? `${item.accuracy}%` : '-'}</td>
                          <td>{formatDuration(item.durationSeconds)}</td>
                          <td>
                            <Link
                              className="btn ghost small"
                              to={`/practice/${item.bankId || ''}?sessionId=${item.id}`}
                            >
                              查看详情
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {history.totalPages > 1 ? (
                <div className="pagination-row">
                  <button
                    className="btn ghost small"
                    disabled={filters.page <= 1}
                    onClick={() => updateFilter('page', filters.page - 1)}
                    type="button"
                  >
                    上一页
                  </button>
                  <span className="pagination-info">
                    {history.page} / {history.totalPages}
                  </span>
                  <button
                    className="btn ghost small"
                    disabled={filters.page >= history.totalPages}
                    onClick={() => updateFilter('page', filters.page + 1)}
                    type="button"
                  >
                    下一页
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default PracticeHistoryPage
