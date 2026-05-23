import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

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

          <div className="grid-two">
            <div className="feature-card">
              <div className="card-title">快速概览</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{stats?.totalUsers ?? '-'}</div>
                  <div className="mini-label">注册用户</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value" style={{ color: stats?.pendingPosts > 0 ? '#d97706' : undefined }}>
                    {stats?.pendingPosts ?? '-'}
                  </div>
                  <div className="mini-label">待审核帖子</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value" style={{ color: stats?.pendingReports > 0 ? '#b91c1c' : undefined }}>
                    {stats?.pendingReports ?? '-'}
                  </div>
                  <div className="mini-label">待处理举报</div>
                </div>
              </div>
            </div>

            <div className="feature-card soft">
              <div className="card-title">快捷操作</div>
              <Link className="btn primary" to="/admin/review">内容审核</Link>
              <Link className="btn outline" to="/admin/users">用户管理</Link>
              <Link className="btn outline" to="/admin/reports">举报处理</Link>
              <Link className="btn outline" to="/admin/employment">Employment management</Link>
              <Link className="btn outline" to="/admin/kaogong-data">考公数据维护</Link>
              <Link className="btn outline" to="/admin/kaoyan-data">考研数据维护</Link>
              <Link className="btn outline" to="/admin/material-review">资料审核</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>管理功能</h2>
          </div>
          <div className="track-grid">
            <div className="track-card">
              <div className="track-head">
                <h3>内容审核</h3>
                <span className="tag subtle">UC-26</span>
              </div>
              <p className="muted">审核待处理帖子：通过、驳回或下架，支持按状态筛选和操作留痕。</p>
              <Link className="btn primary small" to="/admin/review">进入审核</Link>
            </div>
            <div className="track-card">
              <div className="track-head">
                <h3>用户管理</h3>
                <span className="tag subtle">UC-25</span>
              </div>
              <p className="muted">查看用户列表，按目标方向和状态筛选，支持禁言、封禁和解锁。</p>
              <Link className="btn primary small" to="/admin/users">管理用户</Link>
            </div>
            <div className="track-card">
              <div className="track-head">
                <h3>举报处理</h3>
                <span className="tag subtle">UC-30</span>
              </div>
              <p className="muted">查看举报列表，支持举报成立后下架帖子或驳回举报。</p>
              <Link className="btn primary small" to="/admin/reports">处理举报</Link>
            </div>
            <div className="track-card">
              <div className="track-head">
                <h3>Employment source data</h3>
                <span className="tag subtle">JOB</span>
              </div>
              <p className="muted">Create career fairs and job postings, then trigger matched in-app notifications.</p>
              <Link className="btn primary small" to="/admin/employment">Manage employment</Link>
            </div>
            <div className="track-card">
              <div className="track-head">
                <h3>考公数据维护</h3>
                <span className="tag subtle">UC-32</span>
              </div>
              <p className="muted">维护岗位、进面分数线和考试节点，支持筛选、后端分页与新增数据。</p>
              <Link className="btn primary small" to="/admin/kaogong-data">维护考公数据</Link>
            </div>
            <div className="track-card">
              <div className="track-head">
                <h3>题库管理</h3>
                <span className="tag subtle">UC-28</span>
              </div>
              <p className="muted">新增、修改、删除题库与试题，预留批量导入接口。</p>
              <Link className="btn primary small" to="/admin/question-banks">进入管理</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
