import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import MarkdownContent from '../components/MarkdownContent.jsx'
import { communityApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const statusLabelMap = {
  DRAFT: '草稿',
  PENDING: '待审核',
  PUBLISHED: '已发布',
  REJECTED: '已驳回',
  OFFLINE: '已下线',
}

function parseTags(post) {
  if (Array.isArray(post?.tags)) return post.tags
  if (typeof post?.tags === 'string') {
    return post.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function countComments(items = []) {
  return items.reduce((total, item) => total + 1 + countComments(item.replies || []), 0)
}

function normalizePost(postData, commentData) {
  return {
    ...postData,
    tags: parseTags(postData),
    status: (postData.auditStatus || postData.status || 'PUBLISHED').toUpperCase(),
    contentFormat: postData.contentFormat || 'plain',
    sourceFileName: postData.sourceFileName || '',
    viewCount: postData.viewCount ?? postData.views ?? 0,
    commentCount: postData.commentCount ?? countComments(commentData || []),
    likeCount: postData.likeCount ?? 0,
    favoriteCount: postData.favoriteCount ?? 0,
    reportCount: postData.reportCount ?? 0,
    liked: Boolean(postData.liked),
    favorited: Boolean(postData.favorited),
  }
}

function getCommentAuthorLabel(comment) {
  if (comment?.authorName) return comment.authorName
  if (comment?.authorId) return `用户 ${comment.authorId}`
  return '匿名用户'
}

function sameUserId(left, right) {
  if (left == null || right == null) return false
  return String(left) === String(right)
}

function CommentThread({
  comments,
  depth = 0,
  onReply,
  replyingToId,
  currentUserId,
  isAdmin,
  actingCommentId,
  onEdit,
  onDelete,
  onReport,
}) {
  if (!comments.length) return null

  return (
    <div className={depth === 0 ? 'comment-thread-root' : 'comment-thread-nested'}>
      {comments.map((item) => {
        const hasReplies = Array.isArray(item.replies) && item.replies.length > 0
        const authorLabel = getCommentAuthorLabel(item)
        const ownedByCurrentUser = sameUserId(item.authorId, currentUserId)
        const canEdit = ownedByCurrentUser && item.editable
        const canDelete = item.editable && (ownedByCurrentUser || isAdmin)
        const canReport = item.editable && currentUserId && !ownedByCurrentUser
        const canReply = item.editable
        const isActing = actingCommentId === item.id

        return (
          <article
            className={`comment ${depth > 0 ? 'is-reply' : ''} ${replyingToId === item.id ? 'is-target' : ''}`}
            key={item.id}
            style={{ '--comment-depth': depth }}
          >
            <div className="comment-head">
              <span className="comment-author">{authorLabel}</span>
              <span className="comment-time">{item.createdAt?.replace('T', ' ').slice(0, 16)}</span>
            </div>

            <div className="comment-body">{item.content}</div>

            <div className="comment-foot">
              <div className="comment-meta-row">
                {item.replyCount > 0 ? <span>{item.replyCount} 条回复</span> : <span>可继续回复</span>}
              </div>
              <div className="comment-op-row">
                {canReply ? (
                  <button className="btn ghost small" type="button" onClick={() => onReply(item)} disabled={isActing}>回复</button>
                ) : null}
                {canEdit ? (
                  <button className="btn ghost small" type="button" onClick={() => onEdit(item)} disabled={isActing}>编辑</button>
                ) : null}
                {canDelete ? (
                  <button className="btn ghost small" type="button" onClick={() => onDelete(item)} disabled={isActing} style={{ color: '#b91c1c' }}>删除</button>
                ) : null}
                {canReport ? (
                  <button className="btn ghost small" type="button" onClick={() => onReport(item)} disabled={isActing} style={{ color: '#b91c1c' }}>举报</button>
                ) : null}
              </div>
            </div>

            {hasReplies ? (
              <div className="comment-replies">
                <CommentThread
                  comments={item.replies}
                  depth={depth + 1}
                  onReply={onReply}
                  replyingToId={replyingToId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  actingCommentId={actingCommentId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReport={onReport}
                />
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export default function CommunityDetailPage() {
  const { id } = useParams()
  const { user, token, isAuthed } = useAuth()
  const composerRef = useRef(null)

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentActionMessage, setCommentActionMessage] = useState('')
  const [commentActingId, setCommentActingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [acting, setActing] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)

  const currentUserId = user?.id ?? null
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [postData, commentData] = await Promise.all([
          communityApi.postDetail(id, token),
          communityApi.comments(id, token),
        ])
        if (!active) return
        setPost(normalizePost(postData, commentData))
        setComments(commentData || [])
      } catch (requestError) {
        if (active) setError(requestError.message || '加载帖子失败')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [id, token])

  async function refreshComments() {
    const commentData = await communityApi.comments(id, token)
    setComments(commentData || [])
    setPost((prev) => (
      prev
        ? {
            ...prev,
            commentCount: countComments(commentData || []),
          }
        : prev
    ))
  }

  function handleStartReply(comment) {
    if (!isAuthed || !user) {
      setCommentError('请先登录后再回复评论')
      return
    }
    if (!comment?.editable) {
      setCommentError('该评论当前不可回复')
      return
    }

    setReplyTarget({ id: comment.id, authorName: getCommentAuthorLabel(comment) })
    setCommentError('')
    setCommentActionMessage('')

    window.requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function handleCancelReply() {
    setReplyTarget(null)
    setCommentError('')
  }

  async function handleSubmitComment(event) {
    event.preventDefault()
    if (!isAuthed || !user) {
      setCommentError('请先登录后评论')
      return
    }
    if (!commentText.trim()) {
      setCommentError('评论内容不能为空')
      return
    }
    if (commentText.trim().length > 300) {
      setCommentError('评论内容不能超过 300 字')
      return
    }

    setSubmitting(true)
    setCommentError('')
    try {
      await communityApi.createComment(
        id,
        { content: commentText.trim(), parentId: replyTarget?.id ?? null },
        token,
      )
      await refreshComments()
      setCommentText('')
      setReplyTarget(null)
    } catch (requestError) {
      setCommentError(requestError.message || '评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditComment(comment) {
    if (!isAuthed || !user) {
      setCommentActionMessage('请先登录后再编辑评论')
      return
    }
    if (!sameUserId(comment.authorId, currentUserId)) {
      setCommentActionMessage('只能编辑自己的评论')
      return
    }
    if (!comment.editable) {
      setCommentActionMessage('该评论当前不可编辑')
      return
    }

    const nextContent = window.prompt('请输入新的评论内容（不超过 300 字）', comment.content || '')
    if (nextContent == null) return
    const normalized = nextContent.trim()
    if (!normalized) {
      setCommentActionMessage('评论内容不能为空')
      return
    }
    if (normalized.length > 300) {
      setCommentActionMessage('评论内容不能超过 300 字')
      return
    }

    setCommentActingId(comment.id)
    setCommentActionMessage('')
    try {
      await communityApi.updateComment(id, comment.id, { content: normalized }, token)
      await refreshComments()
      setCommentActionMessage('评论已更新')
    } catch (requestError) {
      setCommentActionMessage(requestError.message || '评论编辑失败')
    } finally {
      setCommentActingId(null)
    }
  }

  async function handleDeleteComment(comment) {
    if (!isAuthed || !user) {
      setCommentActionMessage('请先登录后再删除评论')
      return
    }
    if (!comment.editable) {
      setCommentActionMessage('该评论当前不可删除')
      return
    }
    const canDelete = sameUserId(comment.authorId, currentUserId) || isAdmin
    if (!canDelete) {
      setCommentActionMessage('无权限删除该评论')
      return
    }
    if (!window.confirm('确认删除这条评论吗？删除后将显示为“该评论已删除”。')) {
      return
    }

    setCommentActingId(comment.id)
    setCommentActionMessage('')
    try {
      await communityApi.deleteComment(id, comment.id, token)
      await refreshComments()
      if (replyTarget?.id === comment.id) setReplyTarget(null)
      setCommentActionMessage('评论已删除')
    } catch (requestError) {
      setCommentActionMessage(requestError.message || '评论删除失败')
    } finally {
      setCommentActingId(null)
    }
  }

  async function handleReportComment(comment) {
    if (!isAuthed || !user) {
      setCommentActionMessage('请先登录后再举报评论')
      return
    }
    if (!comment.editable) {
      setCommentActionMessage('该评论当前不可举报')
      return
    }
    if (sameUserId(comment.authorId, currentUserId)) {
      setCommentActionMessage('不能举报自己的评论')
      return
    }

    const reason = window.prompt('请输入举报原因（不超过 300 字）')
    if (reason == null) return
    const normalized = reason.trim()
    if (!normalized) {
      setCommentActionMessage('举报原因不能为空')
      return
    }
    if (normalized.length > 300) {
      setCommentActionMessage('举报原因不能超过 300 字')
      return
    }

    setCommentActingId(comment.id)
    setCommentActionMessage('')
    try {
      await communityApi.reportComment(id, comment.id, normalized, token)
      await refreshComments()
      setCommentActionMessage('评论举报已提交，等待管理员处理')
    } catch (requestError) {
      setCommentActionMessage(requestError.message || '评论举报失败')
    } finally {
      setCommentActingId(null)
    }
  }

  async function handleToggleLike() {
    if (!isAuthed) {
      setActionMessage('请先登录后再点赞')
      return
    }

    setActing(true)
    setActionMessage('')
    try {
      const data = await communityApi.toggleLike(id, token)
      setPost((prev) => (prev ? { ...prev, liked: data.liked, likeCount: data.likeCount } : prev))
    } catch (requestError) {
      setActionMessage(requestError.message || '点赞操作失败')
    } finally {
      setActing(false)
    }
  }

  async function handleToggleFavorite() {
    if (!isAuthed) {
      setActionMessage('请先登录后再收藏')
      return
    }

    setActing(true)
    setActionMessage('')
    try {
      const data = await communityApi.toggleFavorite(id, token)
      setPost((prev) => (prev ? { ...prev, favorited: data.favorited, favoriteCount: data.favoriteCount } : prev))
    } catch (requestError) {
      setActionMessage(requestError.message || '收藏操作失败')
    } finally {
      setActing(false)
    }
  }

  async function handleReport() {
    if (!isAuthed) {
      setActionMessage('请先登录后再举报')
      return
    }

    const reason = window.prompt('请输入举报原因（不超过 300 字）')
    if (reason == null) return
    if (!reason.trim()) {
      setActionMessage('举报原因不能为空')
      return
    }

    setActing(true)
    setActionMessage('')
    try {
      const data = await communityApi.reportPost(id, reason.trim(), token)
      setPost((prev) => (prev ? { ...prev, reportCount: data.reportCount } : prev))
      setActionMessage('举报已提交，等待管理员处理')
    } catch (requestError) {
      setActionMessage(requestError.message || '举报失败')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : error ? (
            <div className="error-text">{error}</div>
          ) : (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">帖子详情</p>
                  <h2>{post?.title}</h2>
                  <div className="detail-meta">
                    <span className="tag subtle">{post?.category?.name || '社区'}</span>
                    <span className="tag subtle">{statusLabelMap[post?.status] || '已发布'}</span>
                    <span className="tag subtle">{post?.visibility === 'members' ? '仅注册用户可见' : '公开可见'}</span>
                    {post?.contentFormat === 'markdown' ? <span className="tag subtle">Markdown</span> : null}
                    {post?.anonymous ? <span className="tag subtle">匿名发布</span> : null}
                    {post?.hasAttachment ? <span className="tag subtle">含附件说明</span> : null}
                  </div>
                  <div className="detail-meta">
                    <span>{post?.sourceFileName || (post?.anonymous ? '匿名用户' : `作者 ID: ${post?.authorId}`)}</span>
                    <span>{post?.createdAt?.replace('T', ' ').slice(0, 16)}</span>
                  </div>
                </div>
              </div>

              <div className="feature-card">
                {post?.tags?.length ? (
                  <div className="tag-row">
                    {post.tags.map((tag) => (
                      <span className="tag subtle" key={tag}>#{tag}</span>
                    ))}
                  </div>
                ) : null}

                <MarkdownContent content={post?.content || ''} />

                {post?.attachmentNote ? <div className="notice-box">{post.attachmentNote}</div> : null}

                <div className="metric-row">
                  <span>浏览 {post?.viewCount ?? 0}</span>
                  <span>评论 {post?.commentCount ?? 0}</span>
                  <span>点赞 {post?.likeCount ?? 0}</span>
                  <span>收藏 {post?.favoriteCount ?? 0}</span>
                  <span>举报 {post?.reportCount ?? 0}</span>
                </div>

                <div className="comment-actions">
                  <button className={`btn outline small ${post?.liked ? 'selected' : ''}`} type="button" onClick={handleToggleLike} disabled={acting}>
                    {post?.liked ? '取消点赞' : '点赞'}
                  </button>
                  <button className={`btn outline small ${post?.favorited ? 'selected' : ''}`} type="button" onClick={handleToggleFavorite} disabled={acting}>
                    {post?.favorited ? '取消收藏' : '收藏'}
                  </button>
                  <button className="btn outline small" type="button" onClick={handleReport} disabled={acting} style={{ color: '#b91c1c', borderColor: '#b91c1c' }}>
                    举报
                  </button>
                </div>
                {actionMessage ? <div className="muted">{actionMessage}</div> : null}
              </div>
            </>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">评论区</p>
            <h2>讨论交流</h2>
            <p className="muted">支持直接评论与楼中楼回复，登录后即可参与讨论。</p>
          </div>

          <div className="feature-card soft">
            <div className="comment-list">
              {comments.length ? (
                <CommentThread
                  comments={comments}
                  onReply={handleStartReply}
                  replyingToId={replyTarget?.id ?? null}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  actingCommentId={commentActingId}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  onReport={handleReportComment}
                />
              ) : (
                <div className="muted">还没有评论，来发布第一条吧。</div>
              )}
            </div>

            {commentActionMessage ? <div className="muted">{commentActionMessage}</div> : null}

            <form className="comment-box" onSubmit={handleSubmitComment} ref={composerRef}>
              {replyTarget ? (
                <div className="comment-reply-banner">
                  <div>
                    正在回复 <span className="comment-reply-target">@{replyTarget.authorName}</span>
                  </div>
                  <button className="btn outline small" type="button" onClick={handleCancelReply}>取消回复</button>
                </div>
              ) : null}

              <textarea
                rows="4"
                placeholder={isAuthed ? (replyTarget ? `回复 ${replyTarget.authorName}...` : '写下你的评论...') : '请先登录后评论'}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                disabled={!isAuthed}
              ></textarea>
              <div className="comment-form-meta">
                <span className="muted">支持普通评论和楼中楼回复</span>
                <span className="muted">评论字数：{commentText.trim().length}/300</span>
              </div>
              {commentError ? <div className="error-text">{commentError}</div> : null}
              <div className="comment-actions">
                {!isAuthed ? <Link className="btn ghost" to="/login">去登录</Link> : null}
                <button className="btn primary small" type="submit" disabled={!commentText.trim() || submitting || !isAuthed}>
                  {submitting ? '发送中...' : (replyTarget ? '发送回复' : '发送评论')}
                </button>
              </div>
            </form>
          </div>

          <Link className="btn ghost" to="/community">返回社区</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
