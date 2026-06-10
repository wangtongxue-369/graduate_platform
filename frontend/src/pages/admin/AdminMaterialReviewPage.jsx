import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import Pagination from '../../components/Pagination.jsx'
import { adminMaterialApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'all', label: '全部' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已拒绝' },
]

export default function AdminMaterialReviewPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [materials, setMaterials] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(0)
  const size = 10
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [counts, setCounts] = useState({ pending: 0, all: 0, APPROVED: 0, REJECTED: 0 })

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const filters = { page, size }
      let data
      if (activeTab === 'all') {
        data = await adminMaterialApi.listPage(filters, token)
      } else if (activeTab === 'pending') {
        data = await adminMaterialApi.pending(filters, token)
      } else {
        data = await adminMaterialApi.listPage({ ...filters, status: activeTab }, token)
      }
      setMaterials(data?.content || [])
      setTotalElements(data?.totalElements || 0)
      setTotalPages(data?.totalPages || 1)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, size, activeTab, token])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [pending, all, approved, rejected] = await Promise.all([
          adminMaterialApi.pending({ page: 0, size: 1 }, token),
          adminMaterialApi.listPage({ page: 0, size: 1 }, token),
          adminMaterialApi.listPage({ status: 'APPROVED', page: 0, size: 1 }, token),
          adminMaterialApi.listPage({ status: 'REJECTED', page: 0, size: 1 }, token),
        ])
        setCounts({
          pending: pending?.totalElements || 0,
          all: all?.totalElements || 0,
          APPROVED: approved?.totalElements || 0,
          REJECTED: rejected?.totalElements || 0,
        })
      } catch { /* ignore */ }
    }
    if (user?.role === 'admin') loadCounts()
  }, [user, token])

  const handleReview = async (id, status) => {
    if (!confirm(`确定要${status === 'APPROVED' ? '通过' : '拒绝'}此资料吗？`)) return
    setActionLoading(id)
    try {
      await adminMaterialApi.review(id, status, token)
      alert('审核完成')
      fetchMaterials()
    } catch (e) {
      alert('操作失败: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除此资料吗？')) return
    setActionLoading(id)
    try {
      await adminMaterialApi.delete(id, token)
      alert('已删除')
      fetchMaterials()
    } catch (e) {
      alert('删除失败: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const statusLabel = (s) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已拒绝' }[s] || s)
  const statusClass = (s) => ({ PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }[s] || '')

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">管理员</p>
            <h2>资料审核</h2>
            <p className="muted">审核用户上传的备考资料，通过后将对所有用户可见。</p>
          </div>

          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`tab ${activeTab === t.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.key); setPage(0) }}
              >
                {t.label}
                <span className="tab-count">{counts[t.key] || 0}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 16, marginBottom: '1.25rem' }}>
            <div className="track-head">
              <h3>审核列表</h3>
              <span className="admin-status-chip is-neutral">共 {totalElements} 条</span>
            </div>
            {loading ? (
              <p className="muted">加载中...</p>
            ) : materials.length === 0 ? (
              <p className="muted">暂无待审核资料</p>
            ) : (
              <div className="material-list">
                {materials.map(m => (
                  <article className="material-card admin" key={m.id}>
                    <div className="track-head">
                      <div>
                        <h3>{m.title}</h3>
                        <span className={`material-status status-${statusClass(m.status)}`}>{statusLabel(m.status)}</span>
                      </div>
                      <div className="material-actions">
                        {m.status === 'PENDING' && (
                          <>
                            <button
                              className="btn primary small"
                              disabled={actionLoading === m.id}
                              onClick={() => handleReview(m.id, 'APPROVED')}
                            >
                              {actionLoading === m.id ? '处理中...' : '通过'}
                            </button>
                            <button
                              className="btn danger small"
                              disabled={actionLoading === m.id}
                              onClick={() => handleReview(m.id, 'REJECTED')}
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        <button
                          className="btn ghost small"
                          disabled={actionLoading === m.id}
                          onClick={() => handleDelete(m.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="tag-row">
                      {m.school && <span className="admin-status-chip is-neutral">📍 {m.school}</span>}
                      {m.major && <span className="admin-status-chip is-neutral">📚 {m.major}</span>}
                      {m.subject && <span className="admin-status-chip is-neutral">📖 {m.subject}</span>}
                      {m.year && <span className="admin-status-chip is-neutral">📅 {m.year}</span>}
                      {m.materialType && <span className="admin-status-chip is-neutral">{m.materialType}</span>}
                      <span className="muted small">上传者ID: {m.uploaderId}</span>
                    </div>
                    {m.description && <p className="muted">{m.description}</p>}
                    {m.attachments?.length > 0 && (
                      <div className="material-files">
                        {m.attachments.map(a => (
                          <span key={a.id} className="muted small admin-attachment-pill">📎 {a.originalName} ({formatFileSize(a.fileSize)})</span>
                        ))}
                      </div>
                    )}
                    <div className="metric-row">
                      <span>👁 {m.viewCount || 0} 浏览</span>
                      <span>⬇ {m.downloadCount || 0} 下载</span>
                      <span>{m.createdAt?.slice(0, 19)}</span>
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
          </div>

          <Link className="btn ghost" to="/admin">返回管理后台</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
