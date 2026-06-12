import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const shortcutLinks = [
  { to: '/admin/review', label: '内容审核', variant: 'btn primary' },
  { to: '/admin/users', label: '用户管理', variant: 'btn outline' },
  { to: '/admin/reports', label: '举报处理', variant: 'btn outline' },
  { to: '/admin/categories', label: '社区分类管理', variant: 'btn outline' },
  { to: '/admin/employment', label: '就业管理', variant: 'btn outline' },
  { to: '/admin/kaogong-data', label: '考公数据维护', variant: 'btn outline' },
  { to: '/admin/kaoyan-data', label: '考研数据维护', variant: 'btn outline' },
  { to: '/admin/studyabroad', label: '留学管理', variant: 'btn outline' },
  { to: '/admin/material-review', label: '资料审核', variant: 'btn outline' },
]

const capabilityCards = [
  {
    title: '内容审核',
    code: 'UC-26',
    description: '审核待处理帖子：通过、驳回或下架，支持按状态筛选和操作留痕。',
    to: '/admin/review',
    cta: '进入审核',
  },
  {
    title: '用户管理',
    code: 'UC-25',
    description: '查看用户列表，按目标方向和状态筛选，支持禁言、封禁和解锁。',
    to: '/admin/users',
    cta: '管理用户',
  },
  {
    title: '举报处理',
    code: 'UC-30',
    description: '查看举报列表，支持举报成立后下架帖子或驳回举报。',
    to: '/admin/reports',
    cta: '处理举报',
  },
  {
    title: '社区分类管理',
    code: 'SRS',
    description: '维护社区分类的新增、启停、排序和合并，控制前台分类筛选展示。',
    to: '/admin/categories',
    cta: '管理分类',
  },
  {
    title: '就业数据管理',
    code: 'JOB',
    description: '维护招聘会和岗位信息，并向匹配用户触发站内提醒。',
    to: '/admin/employment',
    cta: '管理就业',
  },
  {
    title: '考公数据维护',
    code: 'UC-32',
    description: '维护岗位、进面分数线和考试节点，支持筛选、后端分页与新增数据。',
    to: '/admin/kaogong-data',
    cta: '维护考公数据',
  },
  {
    title: '留学数据管理',
    code: 'SA',
    description: '维护留学院校项目库，管理录取案例和经验分享内容。',
    to: '/admin/studyabroad',
    cta: '管理留学数据',
  },
  {
    title: '题库管理',
    code: 'UC-28',
    description: '新增、修改、删除题库与试题，预留批量导入接口。',
    to: '/admin/question-banks',
    cta: '进入管理',
  },
]

export default function AdminPage() {
  const { user, token, isAuthed } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.dashboard(token).then(setStats).catch((e) => setError(e.message))
  }, [token])

  if (!isAuthed || user?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">管理后台</p>
            <h2>管理员控制台</h2>
            <p className="muted">内容审核、用户管理、举报处理和考公基础数据维护入口。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div className="admin-page-shell">
            <div className="admin-summary-grid">
              <article className="admin-summary-card">
                <span className="admin-summary-label">注册用户</span>
                <strong className="admin-summary-value">{stats?.totalUsers ?? '-'}</strong>
                <span className="muted">当前系统累计注册用户数。</span>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">待审核帖子</span>
                <strong className="admin-summary-value">{stats?.pendingPosts ?? '-'}</strong>
                <span className={`admin-status-chip ${stats?.pendingPosts > 0 ? 'is-warning' : 'is-neutral'}`}>
                  {stats?.pendingPosts > 0 ? '需要处理' : '队列正常'}
                </span>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">待处理举报</span>
                <strong className="admin-summary-value">{stats?.pendingReports ?? '-'}</strong>
                <span className={`admin-status-chip ${stats?.pendingReports > 0 ? 'is-danger' : 'is-neutral'}`}>
                  {stats?.pendingReports > 0 ? '需要关注' : '暂无积压'}
                </span>
              </article>
            </div>

            <div className="admin-toolbar-card">
              <div className="track-head">
                <h3>快捷操作</h3>
                <span className="admin-status-chip is-neutral">控制台入口</span>
              </div>
              <div className="admin-inline-actions">
                {shortcutLinks.map((item) => (
                  <Link key={item.to} className={item.variant} to={item.to}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="section-head">
                <h2>管理功能</h2>
              </div>
              <div className="admin-capability-grid">
                {capabilityCards.map((item) => (
                  <article className="admin-record-card" key={item.to}>
                    <div className="track-head">
                      <h3>{item.title}</h3>
                      <span className="admin-status-chip is-neutral">{item.code}</span>
                    </div>
                    <div className="admin-record-main">
                      <p className="muted">{item.description}</p>
                    </div>
                    <div className="admin-record-side">
                      <span className="muted small">后台能力入口</span>
                      <Link className="btn primary small" to={item.to}>
                        {item.cta}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
