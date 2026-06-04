import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const statusLabelMap = {
  normal: '正常',
  muted: '禁言',
  upload_limited: '限制上传',
  temporary_locked: '临时锁定',
  banned: '封禁',
}

const targets = [
  { value: '', label: '全部方向' },
  { value: 'kaoyan', label: '考研' },
  { value: 'kaogong', label: '考公' },
  { value: 'job', label: '就业' },
  { value: 'liuxue', label: '留学' },
]

const actions = [
  { status: 'normal', label: '恢复正常', tone: 'outline' },
  { status: 'muted', label: '禁言', tone: 'outline-neutral' },
  { status: 'banned', label: '封禁', tone: 'outline-danger' },
]

const statusClassMap = {
  normal: 'is-success',
  muted: 'is-warning',
  upload_limited: 'is-warning',
  temporary_locked: 'is-warning',
  banned: 'is-danger',
}

const statusFilters = ['', 'normal', 'muted', 'upload_limited', 'temporary_locked', 'banned']

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
      setUsers((prev) => prev.map((item) => (
        item.id === userId ? { ...item, status: newStatus } : item
      )))
    } catch (e) {
      setError(e.message)
    } finally {
      setActing(null)
    }
  }

  if (!isAuthed || user?.role !== 'admin') return <Navigate to="/login" replace />

  const restrictedCount = users.filter((item) => item.status !== 'normal').length
  const adminCount = users.filter((item) => item.role === 'admin').length

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

          <div className="admin-page-shell">
            <div className="admin-summary-grid">
              <article className="admin-summary-card">
                <span className="admin-summary-label">当前列表</span>
                <strong className="admin-summary-value">{users.length}</strong>
                <p className="muted">符合当前筛选条件的用户数。</p>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">受限用户</span>
                <strong className="admin-summary-value">{restrictedCount}</strong>
                <span className={`admin-status-chip ${restrictedCount > 0 ? 'is-warning' : 'is-neutral'}`}>
                  {restrictedCount > 0 ? '需要关注' : '状态正常'}
                </span>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">管理员账号</span>
                <strong className="admin-summary-value">{adminCount}</strong>
                <p className="muted">管理员账号不提供状态变更。</p>
              </article>
            </div>

            <div className="admin-toolbar-card">
              <div className="track-head">
                <h3>筛选条件</h3>
                <span className="admin-status-chip is-neutral">用户范围</span>
              </div>
              <div className="admin-filter-stack">
                <div className="admin-filter-bar">
                  {targets.map((target) => (
                    <button
                      key={target.value || 'all-target'}
                      type="button"
                      className={`admin-filter-pill ${filterTarget === target.value ? 'is-active' : ''}`}
                      onClick={() => setFilterTarget(target.value)}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
                <div className="admin-filter-bar">
                  {statusFilters.map((status) => (
                    <button
                      key={status || 'all-status'}
                      type="button"
                      className={`admin-filter-pill ${filterStatus === status ? 'is-active' : ''}`}
                      onClick={() => setFilterStatus(status)}
                    >
                      {status ? (statusLabelMap[status] || status) : '全部状态'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-surface-card">加载中...</div>
            ) : users.length === 0 ? (
              <div className="admin-surface-card">
                <div className="track-head">
                  <h3>暂无符合条件的用户</h3>
                  <span className="admin-status-chip is-neutral">0 项</span>
                </div>
              </div>
            ) : (
              <div className="admin-record-grid">
                {users.map((account) => (
                  <article className="admin-record-card" key={account.id}>
                    <div className="track-head">
                      <h3>{account.name}</h3>
                      <span className={`admin-status-chip ${statusClassMap[account.status] || 'is-neutral'}`}>
                        {statusLabelMap[account.status] || account.status}
                      </span>
                    </div>
                    <div className="admin-record-main">
                      <p className="muted">邮箱: {account.email || '未设置'}</p>
                      <p className="muted">手机: {account.phone || '未设置'}</p>
                    </div>
                    <div className="admin-record-meta">
                      <span>方向: {account.target || '未设置'}</span>
                      <span>学校: {account.school || '未设置'}</span>
                      <span>角色: {account.role}</span>
                      <span>注册: {account.createdAt?.replace('T', ' ').slice(0, 10)}</span>
                    </div>
                    <div className="admin-record-side">
                      <span className="muted small">
                        {account.role === 'admin' ? '管理员账号不可调整状态' : '选择要执行的账号状态'}
                      </span>
                      {account.role !== 'admin' ? (
                        <div className="admin-inline-actions">
                          {actions.map((action) => (
                            <button
                              key={action.status}
                              type="button"
                              className={`btn ${action.tone} small`}
                              disabled={acting === account.id || account.status === action.status}
                              onClick={() => handleStatusChange(account.id, action.status)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Link className="btn ghost" to="/admin">返回控制台</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
