import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import MarkdownContent from '../../components/MarkdownContent.jsx'
import { adminApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const statusLabelMap = {
  PENDING: '待审核', PUBLISHED: '已发布', REJECTED: '驳回', OFFLINE: '已下架', DRAFT: '草稿',
}

const statusClassMap = {
  PENDING: 'is-warning',
  PUBLISHED: 'is-success',
  REJECTED: 'is-danger',
  OFFLINE: 'is-neutral',
  DRAFT: 'is-neutral',
}

export default function ReviewPage() {
  const { user, token, isAuthed } = useAuth()
  const [posts, setPosts] = useState([])
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = filterStatus
        ? await adminApi.reviewList(filterStatus, 0, 50, token)
        : await adminApi.reviewList('', 0, 50, token)
      setPosts(data.content || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, token])

  useEffect(() => { load() }, [load])

  async function handleAction(postId, action) {
    let reason = ''
    if (action === 'REJECT' || action === 'OFFLINE') {
      reason = window.prompt('请输入处理原因') || ''
      if (!reason.trim()) {
        setError('该操作必须填写原因')
        return
      }
    }

    setActing(postId)
    try {
      await adminApi.reviewPost(postId, action, reason.trim(), token)
      setPosts(prev => prev.filter(p => p.id !== postId))
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
            <h2>内容审核</h2>
            <p className="muted">审核帖子：通过（变为已发布）、驳回、下架。操作即时生效。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div className="feature-card">
            <div className="card-title">筛选</div>
            <div className="tag-row">
              {['PENDING', 'PUBLISHED', 'REJECTED', 'OFFLINE'].map(s => (
                <button
                  key={s}
                  type="button"
                  className={`tag tag-btn ${filterStatus === s ? 'selected' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {statusLabelMap[s]} ({s})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="feature-card">
              <div className="card-title">暂无 {statusLabelMap[filterStatus] || ''} 帖子</div>
            </div>
          ) : (
            <div className="track-grid">
              {posts.map(post => (
                <article className="track-card" key={post.id}>
                  <div className="track-head">
                    <h3>{post.title}</h3>
                    <span className={`admin-status-chip ${statusClassMap[post.status] || 'is-neutral'}`}>
                      {statusLabelMap[post.status]}
                    </span>
                  </div>
                  <div className="notice-box review-markdown-preview">
                    <MarkdownContent content={post.content || ''} />
                  </div>
                  <div className="tag-row">
                    <span className="admin-status-chip is-neutral">{post.category?.name}</span>
                    <span className="admin-status-chip is-neutral">作者: {post.authorName || post.authorId}</span>
                    {post.tags?.split(',').filter(Boolean).map(t => (
                      <span className="admin-status-chip is-neutral" key={t}>#{t.trim()}</span>
                    ))}
                  </div>
                  <div className="metric-row">
                    <span>浏览{post.viewCount}</span>
                    <span>评论{post.commentCount}</span>
                    <span>举报{post.reportCount}</span>
                  </div>
                  {post.reviewReason ? <div className="muted">处理原因：{post.reviewReason}</div> : null}
                  <div className="muted small">
                    {post.createdAt?.replace('T', ' ').slice(0, 16)}
                  </div>

                  {post.status === 'PENDING' && (
                    <div className="admin-inline-actions">
                      <button
                        className="btn primary small"
                        disabled={acting === post.id}
                        onClick={() => handleAction(post.id, 'APPROVE')}
                      >
                        通过
                      </button>
                      <button
                        className="btn outline-danger small"
                        disabled={acting === post.id}
                        onClick={() => handleAction(post.id, 'REJECT')}
                      >
                        驳回
                      </button>
                    </div>
                  )}
                  {post.status === 'PUBLISHED' && (
                    <button
                      className="btn outline-neutral small"
                      disabled={acting === post.id}
                      onClick={() => handleAction(post.id, 'OFFLINE')}
                    >
                      下架
                    </button>
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
