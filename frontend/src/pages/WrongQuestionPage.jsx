import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { practiceApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

function WrongQuestionPage() {
  const { token, isAuthed } = useAuth()
  const canUsePractice = Boolean(isAuthed && token && token !== 'dev-token')

  const [filters, setFilters] = useState({
    target: '',
    subject: '',
    chapter: '',
    minWrongCount: '',
  })
  const [wrongs, setWrongs] = useState([])
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

  const loadWrongs = useCallback(async () => {
    if (!canUsePractice) return
    setLoading(true)
    setError('')
    try {
      const query = {}
      if (filters.target) query.target = filters.target
      if (filters.subject) query.subject = filters.subject
      if (filters.chapter) query.chapter = filters.chapter
      if (filters.minWrongCount) query.minWrongCount = Number(filters.minWrongCount)
      const data = await practiceApi.wrongQuestions(query, token)
      setWrongs(data || [])
    } catch (err) {
      setError(err.message || '加载错题失败')
    } finally {
      setLoading(false)
    }
  }, [canUsePractice, filters, token])

  useEffect(() => {
    loadWrongs()
  }, [loadWrongs])

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    return dateStr.replace('T', ' ').substring(0, 16)
  }

  if (!canUsePractice) {
    return (
      <div className="app">
        <Navbar />
        <main className="shell">
          <section className="section">
            <div className="section-head">
              <p className="eyebrow">错题本</p>
              <h2>需要登录</h2>
              <p className="muted">查看错题本需要登录真实账号。</p>
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
            <p className="eyebrow">错题本</p>
            <h2>我的错题</h2>
            <p className="muted">按方向、科目、章节筛选错题，支持一键重练。</p>
            <Link className="btn ghost small" to="/practice">返回题库首页</Link>
          </div>

          <div className="feature-card">
            <div className="card-title">筛选条件</div>
            <div className="filter-grid">
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
                <span>章节</span>
                <select value={filters.chapter} onChange={(e) => updateFilter('chapter', e.target.value)}>
                  <option value="">全部</option>
                  {(options.chapters || []).map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>最少错误次数</span>
                <input
                  type="number"
                  min="1"
                  value={filters.minWrongCount}
                  onChange={(e) => updateFilter('minWrongCount', e.target.value)}
                  placeholder="不限"
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : error ? (
            <div className="feature-card">
              <div className="card-title">加载失败</div>
              <p className="muted">{error}</p>
              <button className="btn outline small" type="button" onClick={loadWrongs}>重试</button>
            </div>
          ) : wrongs.length === 0 ? (
            <div className="feature-card">
              <div className="card-title">暂无错题</div>
              <p className="muted">交卷后客观题错误会自动加入错题本。</p>
              <Link className="btn primary small" to="/practice">去练习</Link>
            </div>
          ) : (
            <div className="wrong-list-full">
              {wrongs.map((item) => (
                <div className="feature-card" key={item.id}>
                  <div className="track-head">
                    <h3 className="wrong-stem">{item.stem}</h3>
                    <span className="tag subtle">错误 {item.wrongCount} 次</span>
                  </div>
                  <div className="metric-row">
                    <span>方向 {item.target || '-'}</span>
                    <span>科目 {item.subject || '-'}</span>
                    <span>章节 {item.chapter || '-'}</span>
                    <span>知识点 {item.knowledgePoint || '-'}</span>
                  </div>
                  <div className="metric-row">
                    <span className="muted">最近错误：{formatDateTime(item.lastWrongAt)}</span>
                    <span className="muted">最近作答：{item.lastAnswer || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default WrongQuestionPage
