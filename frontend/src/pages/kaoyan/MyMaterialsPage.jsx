import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { materialApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const TABS = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已拒绝' },
]

export default function MyMaterialsPage() {
  const navigate = useNavigate()
  const { token, isAuthed } = useAuth()
  const [materials, setMaterials] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 })

  const fetchMyMaterials = useCallback(async () => {
    if (!isAuthed) { navigate('/login'); return }
    setLoading(true)
    setMessage('')
    try {
      const filters = { page, size }
      if (activeTab) filters.status = activeTab
      const data = await materialApi.myMaterials(filters, token)
      setMaterials(data?.content || [])
      setTotalElements(data?.totalElements || 0)
      setTotalPages(data?.totalPages || 1)
    } catch (e) {
      setMessage(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, size, activeTab, isAuthed, token, navigate])

  useEffect(() => { fetchMyMaterials() }, [fetchMyMaterials])

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [all, pending, approved, rejected] = await Promise.all([
          materialApi.myMaterials({ page: 0, size: 1 }, token),
          materialApi.myMaterials({ status: 'PENDING', page: 0, size: 1 }, token),
          materialApi.myMaterials({ status: 'APPROVED', page: 0, size: 1 }, token),
          materialApi.myMaterials({ status: 'REJECTED', page: 0, size: 1 }, token),
        ])
        setCounts({
          ALL: all?.totalElements || 0,
          PENDING: pending?.totalElements || 0,
          APPROVED: approved?.totalElements || 0,
          REJECTED: rejected?.totalElements || 0,
        })
      } catch { /* ignore */ }
    }
    if (isAuthed) loadCounts()
  }, [isAuthed, token])

  const statusLabel = (s) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已拒绝' }[s] || s)
  const statusClass = (s) => ({ PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }[s] || '')

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">考研 · 资源共享</p>
            <h2>我的资料</h2>
            <p className="muted">管理您上传的备考资料，审核状态一目了然。</p>
          </div>

          <div className="action-row" style={{ marginBottom: '1rem' }}>
            <button className="btn primary" onClick={() => navigate('/kaoyan/materials/upload')}>上传新资料</button>
            <button className="btn outline" onClick={() => navigate('/kaoyan/materials')}>浏览资料</button>
          </div>

          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.key); setPage(0) }}
              >
                {t.label}
                <span className="tab-count">{counts[t.key || 'ALL']}</span>
              </button>
            ))}
          </div>

          {activeTab && (
            <div className="track-head" style={{ marginBottom: '0.75rem' }}>
              <h3>我的上传</h3>
              <span className="tag subtle">共 {totalElements} 条</span>
            </div>
          )}
          {loading ? (
            <p className="muted">加载中...</p>
          ) : materials.length === 0 ? (
            <div className="notice-box">
              <p>暂无资料，点击上方按钮上传您的第一份资料</p>
            </div>
          ) : (
            <div className="material-list">
              {materials.map(m => (
                <article className="material-card" key={m.id} onClick={() => navigate(`/kaoyan/materials/${m.id}`)}>
                  <div className="track-head">
                    <h3>{m.title}</h3>
                    <span className={`material-status status-${statusClass(m.status)}`}>{statusLabel(m.status)}</span>
                  </div>
                  <div className="tag-row">
                    {m.school && <span className="tag subtle">📍 {m.school}</span>}
                    {m.major && <span className="tag subtle">📚 {m.major}</span>}
                    {m.subject && <span className="tag subtle">📖 {m.subject}</span>}
                    {m.year && <span className="tag subtle">📅 {m.year}</span>}
                    {m.materialType && <span className="tag subtle">{m.materialType}</span>}
                  </div>
                  {m.description && <p className="muted">{m.description.slice(0, 80)}{m.description.length > 80 ? '...' : ''}</p>}
                  <div className="metric-row">
                    <span>附件 {m.attachments?.length || 0} 个</span>
                    <span>👁 {m.viewCount || 0} 浏览</span>
                    <span>⬇ {m.downloadCount || 0} 下载</span>
                  </div>
                  <div className="panel-footer">
                    <span>{m.createdAt?.slice(0, 10)}</span>
                    <button className="btn outline small" type="button" onClick={e => { e.stopPropagation(); navigate(`/kaoyan/materials/${m.id}`) }}>
                      查看详情
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {materials.length > 0 && (
            <Pagination
              page={page + 1}
              total={totalPages}
              totalItems={totalElements}
              onChange={(nextPage) => setPage(nextPage - 1)}
            />
          )}
          {message ? <div className="error-text" style={{ marginTop: '0.5rem' }}>{message}</div> : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}