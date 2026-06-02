import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const statusLabelMap = {
  normal: '正常', muted: '禁言', upload_limited: '限制上传',
  temporary_locked: '临时锁定', banned: '封禁',
}

const targets = [
  { value: '', label: '全部方向' },
  { value: 'kaoyan', label: '考研' },
  { value: 'kaogong', label: '考公' },
  { value: 'job', label: '就业' },
  { value: 'liuxue', label: '留学' },
]

const actions = [
  { status: 'normal', label: '恢复正常' },
  { status: 'muted', label: '禁言' },
  { status: 'banned', label: '封禁' },
]

const statusClassMap = {
  normal: 'is-success',
  muted: 'is-warning',
  upload_limited: 'is-warning',
  temporary_locked: 'is-warning',
  banned: 'is-danger',
}

export default function UserManagementPage() {
  const { user, token, isAuthed } = useAuth()
  const [users, setUsers] = useState([])
  const [filterTarget, setFilterTarget] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.users(filterTarget || undefined, filterStatus || undefined, 0, 50, token)
      setUsers(data.content || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filterTarget, filterStatus, token])

  useEffect(() => { load() }, [load])

  async function handleStatusChange(userId, newStatus) {
    setActing(userId)
    try {
      await adminApi.updateUserStatus(userId, newStatus, '', token)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
    } catch (e) {
      setError(e.message)
    } finally {
      setActing(null)
    }
  }

  if (!isAuthed || user?.role !== 'admin') return <Navigate to="/login" replace />

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">管理后台</p>
            <h2>用户管理</h2>
            <p className="muted">查看用户列表，按方向筛选，执行禁言/封禁/恢复正常操作。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div className="grid-two">
            <div className="feature-card">
              <div className="card-title">方向筛选</div>
              <div className="tag-row">
                {targets.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`tag tag-btn ${filterTarget === t.value ? 'selected' : ''}`}
                    onClick={() => setFilterTarget(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="tag-row">
                {['', 'normal', 'muted', 'upload_limited', 'temporary_locked', 'banned'].map(status => (
                  <button
                    key={status || 'all'}
                    type="button"
                    className={`tag tag-btn ${filterStatus === status ? 'selected' : ''}`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status ? (statusLabelMap[status] || status) : 'All status'}
                  </button>
                ))}
              </div>
            </div>
            <div className="feature-card metrics">
              <div className="card-title">统计</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{users.length}</div>
                  <div className="mini-label">当前列表</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{users.filter(u => u.status !== 'normal').length}</div>
                  <div className="mini-label">受限用户</div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : (
            <div className="track-grid">
              {users.map(u => (
                <article className="track-card" key={u.id}>
                  <div className="track-head">
                    <h3>{u.name}</h3>
                    <span className={`admin-status-chip ${statusClassMap[u.status] || 'is-neutral'}`}>
                      {statusLabelMap[u.status] || u.status}
                    </span>
                  </div>
                  <ul className="feature-list compact">
                    <li>邮箱: {u.email || '未设置'}</li>
                    <li>手机: {u.phone || '未设置'}</li>
                    <li>方向: {u.target}</li>
                    <li>学校: {u.school || '未设置'}</li>
                    <li>角色: {u.role}</li>
                    <li>注册: {u.createdAt?.replace('T', ' ').slice(0, 10)}</li>
                  </ul>
                  {u.role !== 'admin' && (
                    <div className="admin-inline-actions">
                      {actions.map(a => (
                        <button
                          key={a.status}
                          className={`tag tag-btn ${u.status === a.status ? 'selected' : ''}`}
                          disabled={acting === u.id || u.status === a.status}
                          onClick={() => handleStatusChange(u.id, a.status)}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          <Link className="btn ghost" to="/admin">返回控制台</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
