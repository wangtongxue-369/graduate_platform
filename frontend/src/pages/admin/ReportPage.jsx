import { useCallback, useEffect, useState } from 'react'
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

const statusClassMap = {
  PENDING: 'is-warning',
  RESOLVED: 'is-success',
  REJECTED: 'is-neutral',
}

const reportTypeLabelMap = {
  POST: '帖子举报',
  COMMENT: '评论举报',
}

const reportTypes = ['POST', 'COMMENT']
const reportStatuses = ['PENDING', 'RESOLVED', 'REJECTED']

export default function ReportPage() {
  const { user, token, isAuthed } = useAuth()
  const [reports, setReports] = useState([])
  const [reportType, setReportType] = useState('POST')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback(async () => {
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
  }, [filterStatus, reportType, token])

  useEffect(() => { load() }, [load])

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

          <div className="admin-page-shell">
            <div className="admin-toolbar-card">
              <div className="track-head">
                <h3>筛选条件</h3>
                <span className="admin-status-chip is-neutral">举报队列</span>
              </div>
              <div className="admin-filter-stack">
                <div className="admin-filter-bar">
                  {reportTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`admin-filter-pill ${reportType === type ? 'is-active' : ''}`}
                      onClick={() => setReportType(type)}
                    >
                      {reportTypeLabelMap[type]}
                    </button>
                  ))}
                </div>
                <div className="admin-filter-bar">
                  {reportStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`admin-filter-pill ${filterStatus === status ? 'is-active' : ''}`}
                      onClick={() => setFilterStatus(status)}
                    >
                      {statusLabelMap[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-surface-card">加载中...</div>
            ) : reports.length === 0 ? (
              <div className="admin-surface-card">
                <div className="track-head">
                  <h3>暂无 {statusLabelMap[filterStatus]} 的 {reportTypeLabelMap[reportType]}</h3>
                  <span className="admin-status-chip is-neutral">0 项</span>
                </div>
              </div>
            ) : (
              <div className="admin-record-grid">
                {reports.map((item) => {
                  const actingKey = `${reportType}-${item.id}`
                  const post = item.post || null
                  const comment = item.comment || null

                  return (
                    <article className="admin-record-card" key={item.id}>
                      <div className="track-head">
                        <h3>{reportTypeLabelMap[reportType]} #{item.id}</h3>
                        <span className={`admin-status-chip ${statusClassMap[item.status] || 'is-neutral'}`}>
                          {statusLabelMap[item.status] || item.status}
                        </span>
                      </div>
                      <div className="admin-record-main">
                        <p className="muted">举报人: {item.reporter?.name} (ID: {item.reporter?.id})</p>
                        <p className="muted">举报原因: {item.reason}</p>
                        <p className="muted">处理说明: {item.reviewNote || '暂无'}</p>
                        {reportType === 'COMMENT' ? (
                          <>
                            <p className="muted">评论内容: {comment?.content}</p>
                            <p className="muted">所属帖子: {comment?.postTitle} (ID: {comment?.postId})</p>
                          </>
                        ) : (
                          <p className="muted">帖子: {post?.title}</p>
                        )}
                      </div>
                      <div className="admin-record-meta">
                        <span>提交时间: {item.createdAt?.replace('T', ' ').slice(0, 16)}</span>
                        {reportType === 'COMMENT' ? (
                          <>
                            <span>评论状态: {comment?.status || '未知'}</span>
                            <span>评论作者: {comment?.authorName} (ID: {comment?.authorId})</span>
                          </>
                        ) : (
                          <>
                            <span>帖子状态: {post?.status || '未知'}</span>
                            <span>帖子作者: {post?.authorName} (ID: {post?.authorId})</span>
                          </>
                        )}
                      </div>
                      <div className="admin-record-side">
                        <span className="muted small">
                          {item.status === 'PENDING' ? '待确认是否成立并执行处置' : '该举报已完成处理'}
                        </span>
                        {item.status === 'PENDING' ? (
                          <div className="admin-inline-actions">
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
                      </div>
                    </article>
                  )
                })}
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
