import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const statusLabelMap = {
  PENDING: '待处理',
  RESOLVED: '已处理',
  REJECTED: '已驳回',
}

const statusColors = {
  PENDING: '#d97706',
  RESOLVED: '#0f766e',
  REJECTED: '#6b7280',
}

const reportTypeLabelMap = {
  POST: '帖子举报',
  COMMENT: '评论举报',
}

export default function ReportPage() {
  const { user, token, isAuthed } = useAuth()
  const [reports, setReports] = useState([])
  const [reportType, setReportType] = useState('POST')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = reportType === 'COMMENT'
        ? await adminApi.commentReports(filterStatus, 0, 50, token)
        : await adminApi.reports(filterStatus, 0, 50, token)
      setReports(data.content || [])
    } catch (e) {
      setError(e.message || '加载举报列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [reportType, filterStatus, token])

  async function handleAction(reportId, action) {
    const note = window.prompt(action === 'RESOLVE' ? '处理说明（可选）' : '驳回说明（可选）') || ''
    setActing(`${reportType}-${reportId}`)
    try {
      if (reportType === 'COMMENT') {
        await adminApi.reviewCommentReport(reportId, action, note, token)
      } else {
        await adminApi.reviewReport(reportId, action, note, token)
      }
      await load()
    } catch (e) {
      setError(e.message || '处理失败')
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
            <h2>举报处理</h2>
            <p className="muted">支持帖子举报与评论举报，举报成立后可一键下线帖子或隐藏评论。</p>
            {error ? <div className="error-text">{error}</div> : null}
          </div>

          <div className="feature-card">
            <div className="card-title">举报类型</div>
            <div className="tag-row" style={{ marginBottom: 12 }}>
              {['POST', 'COMMENT'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`tag tag-btn ${reportType === type ? 'selected' : ''}`}
                  onClick={() => setReportType(type)}
                  style={reportType === type ? { background: '#0f766e' } : undefined}
                >
                  {reportTypeLabelMap[type]}
                </button>
              ))}
            </div>

            <div className="card-title">处理状态</div>
            <div className="tag-row">
              {['PENDING', 'RESOLVED', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tag tag-btn ${filterStatus === s ? 'selected' : ''}`}
                  onClick={() => setFilterStatus(s)}
                  style={filterStatus === s ? { background: statusColors[s] } : undefined}
                >
                  {statusLabelMap[s]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : reports.length === 0 ? (
            <div className="feature-card">
              <div className="card-title">暂无 {statusLabelMap[filterStatus]} 的 {reportTypeLabelMap[reportType]}</div>
            </div>
          ) : (
            <div className="track-grid">
              {reports.map((item) => {
                const actingKey = `${reportType}-${item.id}`
                const post = item.post || null
                const comment = item.comment || null
                return (
                  <article className="track-card" key={item.id}>
                    <div className="track-head">
                      <h3>{reportTypeLabelMap[reportType]} #{item.id}</h3>
                      <span
                        className="tag subtle"
                        style={{ background: `${statusColors[item.status]}18`, color: statusColors[item.status] }}
                      >
                        {statusLabelMap[item.status] || item.status}
                      </span>
                    </div>

                    <ul className="feature-list compact">
                      <li>举报人: {item.reporter?.name} (ID: {item.reporter?.id})</li>
                      <li>举报原因: {item.reason}</li>
                      <li>提交时间: {item.createdAt?.replace('T', ' ').slice(0, 16)}</li>
                      <li>处理说明: {item.reviewNote || '暂无'}</li>
                      {reportType === 'COMMENT' ? (
                        <>
                          <li>评论内容: {comment?.content}</li>
                          <li>评论状态: {comment?.status}</li>
                          <li>评论作者: {comment?.authorName} (ID: {comment?.authorId})</li>
                          <li>所属帖子: {comment?.postTitle} (ID: {comment?.postId})</li>
                        </>
                      ) : (
                        <>
                          <li>帖子: {post?.title}</li>
                          <li>帖子状态: {post?.status}</li>
                          <li>帖子作者: {post?.authorName} (ID: {post?.authorId})</li>
                        </>
                      )}
                    </ul>

                    {item.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn primary small"
                          type="button"
                          disabled={acting === actingKey}
                          onClick={() => handleAction(item.id, 'RESOLVE')}
                        >
                          举报成立并处置
                        </button>
                        <button
                          className="btn outline small"
                          type="button"
                          disabled={acting === actingKey}
                          onClick={() => handleAction(item.id, 'REJECT')}
                        >
                          驳回举报
                        </button>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}

          <Link className="btn ghost" to="/admin">返回控制台</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
