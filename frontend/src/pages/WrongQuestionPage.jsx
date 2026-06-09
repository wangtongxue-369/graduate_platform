import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import Pagination from '../components/Pagination.jsx'
import { practiceApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

function WrongQuestionPage() {
  const { token, isAuthed } = useAuth()
  const navigate = useNavigate()
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
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [retrying, setRetrying] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const SIZE = 20

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
      const query = { page, size: SIZE }
      if (filters.target) query.target = filters.target
      if (filters.subject) query.subject = filters.subject
      if (filters.chapter) query.chapter = filters.chapter
      if (filters.minWrongCount) query.minWrongCount = Number(filters.minWrongCount)
      const data = await practiceApi.wrongQuestions(query, token)
      if (Array.isArray(data)) {
        setWrongs(data)
        setTotalPages(1)
        setTotalCount(data.length)
      } else {
        setWrongs(data.items || data.content || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(typeof data.total === 'number' ? data.total : (data.items?.length || 0))
      }
    } catch (err) {
      setError(err.message || '加载错题失败')
    } finally {
      setLoading(false)
    }
  }, [canUsePractice, filters, token, page])

  useEffect(() => {
    loadWrongs()
  }, [loadWrongs])

  useEffect(() => {
    setPage(0)
    setSelectedIds(new Set())
  }, [filters])

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === wrongs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(wrongs.map((w) => w.id)))
    }
  }

  async function handleRetry(ids) {
    if (ids.length === 0) return
    setRetrying(true)
    setError('')
    try {
      const data = await practiceApi.rebuildWrongSession(ids, token)
      // 路由 :id 是题库 id，会话 id 必须经 ?sessionId= 传入；
      // 否则作答页会误把 sessionId 当 bankId 去新建一个普通会话
      navigate(`/practice/${data.bankId}?sessionId=${data.id}`)
    } catch (err) {
      setError(err.message || '创建重练会话失败')
    } finally {
      setRetrying(false)
    }
  }

  // 重练全部（跨页）：按当前筛选条件再拉一次全量错题，再走 rebuild-session。
  // 直接用 wrongs.map 仅能拿到当前页的 20 题，名不副实。
  async function handleRetryAll() {
    if (totalCount === 0) return
    if (!window.confirm(`将创建一个包含 ${totalCount} 题的练习，确认开始？`)) return
    setRetrying(true)
    setError('')
    try {
      const query = { page: 0, size: Math.max(totalCount, 1) }
      if (filters.target) query.target = filters.target
      if (filters.subject) query.subject = filters.subject
      if (filters.chapter) query.chapter = filters.chapter
      if (filters.minWrongCount) query.minWrongCount = Number(filters.minWrongCount)
      const all = await practiceApi.wrongQuestions(query, token)
      const items = Array.isArray(all) ? all : (all?.items || all?.content || [])
      const ids = items.map((w) => w.id)
      if (ids.length === 0) {
        setError('当前筛选条件下没有可重练的错题')
        setRetrying(false)
        return
      }
      const data = await practiceApi.rebuildWrongSession(ids, token)
      navigate(`/practice/${data.bankId}?sessionId=${data.id}`)
    } catch (err) {
      setError(err.message || '创建重练会话失败')
    } finally {
      setRetrying(false)
    }
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

          {/* 操作栏 */}
          {wrongs.length > 0 && (
            <div className="feature-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === wrongs.length && wrongs.length > 0}
                  onChange={toggleSelectAll}
                />
                <span>全选</span>
              </label>
              <span className="muted">已选 {selectedIds.size} 题 / 本页 {wrongs.length} 题 / 共 {totalCount} 题</span>
              {selectedIds.size > 0 && (
                <button
                  className="btn primary small"
                  type="button"
                  disabled={retrying}
                  onClick={() => handleRetry(Array.from(selectedIds))}
                >
                  {retrying ? '创建中...' : `重练选中 (${selectedIds.size})`}
                </button>
              )}
              {totalPages > 1 && (
                <button
                  className="btn outline small"
                  type="button"
                  disabled={retrying}
                  onClick={() => handleRetry(wrongs.map((w) => w.id))}
                >
                  {retrying ? '创建中...' : `重练本页 (${wrongs.length})`}
                </button>
              )}
              <button
                className="btn outline small"
                type="button"
                disabled={retrying || totalCount === 0}
                onClick={handleRetryAll}
              >
                {retrying ? '创建中...' : `重练全部 (${totalCount})`}
              </button>
            </div>
          )}

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
            <>
              <div className="wrong-list-full">
                {wrongs.map((item) => (
                  <div className="feature-card" key={item.id} style={{ position: 'relative' }}>
                    <label style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </label>
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
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default WrongQuestionPage
