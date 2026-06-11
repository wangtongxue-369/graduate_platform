import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import SimpleMarkdownContent from '@/components/SimpleMarkdownContent.jsx'
import {
  canUseCommunityPreview,
  createCommunityPreviewComments,
  findCommunityPreviewPostById,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

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

function normalizeAttachments(post) {
  if (!Array.isArray(post?.attachments)) return []

  return post.attachments
    .filter((item) => item && item.id)
    .map((item) => ({
      id: item.id,
      originalName: item.originalName || `附件-${item.id}`,
      fileSize: Number(item.fileSize ?? 0),
      downloadCount: Number(item.downloadCount ?? 0),
    }))
}

function normalizePost(post, comments) {
  const attachments = normalizeAttachments(post)

  return {
    ...post,
    tags: parseTags(post),
    attachments,
    attachmentCount: Number(post.attachmentCount ?? attachments.length),
    hasAttachment: Boolean(post.hasAttachment) || attachments.length > 0,
    viewCount: Number(post.viewCount ?? post.views ?? 0),
    commentCount: Number(post.commentCount ?? countComments(comments)),
    likeCount: Number(post.likeCount ?? 0),
    favoriteCount: Number(post.favoriteCount ?? 0),
    reportCount: Number(post.reportCount ?? 0),
    liked: Boolean(post.liked),
    favorited: Boolean(post.favorited),
    visibility: post.visibility || 'public',
  }
}

function createPlainPreview(content) {
  return (content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '未知大小'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function formatTimeLabel(value) {
  if (!value) return '刚刚更新'
  return value.replace('T', ' ').slice(0, 16)
}

function getAuthorLabel(post) {
  if (post?.anonymous) return '匿名发布'
  if (post?.authorName) return post.authorName
  if (post?.authorId) return `用户 ${post.authorId}`
  return '社区成员'
}

function getVisibilityLabel(post) {
  return post?.visibility === 'members' ? '仅注册成员可见' : '公开可见'
}

function CommentList({ items, depth = 0 }) {
  if (!items.length) return null

  return (
    <div className={`v1-community-comment-list ${depth > 0 ? 'is-nested' : ''}`}>
      {items.map((item) => (
        <article className="v1-community-comment-card" key={item.id}>
          <div className="v1-community-comment-head">
            <strong>{item.authorName || (item.authorId ? `用户 ${item.authorId}` : '匿名用户')}</strong>
            <span>{formatTimeLabel(item.createdAt)}</span>
          </div>
          <p>{item.content}</p>
          {Array.isArray(item.replies) && item.replies.length ? (
            <CommentList depth={depth + 1} items={item.replies} />
          ) : null}
        </article>
      ))}
    </div>
  )
}

const COMMUNITY_DETAIL_TIMEOUT_MESSAGE = '帖子详情请求超时，请检查后端服务是否可用。'
const COMMUNITY_DETAIL_PREVIEW_NOTICE = '当前为开发预览：帖子正文、附件和评论基于后端字段结构展示，实时互动状态需连接后端。'

function CommunityStatusPanel({ id, mode, error }) {
  const isError = mode === 'error'

  return (
    <section className={`v1-community-status-layout ${isError ? 'is-error' : 'is-loading'}`}>
      <article className="v1-community-status-sheet">
        <div className="v1-community-status-kicker">
          <span>{isError ? '详情读取中断' : '详情正在整理'}</span>
          <span>{id ? `帖子 #${id}` : '社区详情'}</span>
        </div>

        <div className="v1-community-status-main">
          <div className="v1-community-status-copy">
            <p className="v1-community-status-label">{isError ? '阅读入口已经找到' : '阅读位置已保留'}</p>
            <h1>{isError ? '这条阅读入口已经接住，但正文暂时没有取回。' : '正文、附件和评论正在回到这页。'}</h1>
            <p>
              {isError
                ? '路径本身没有问题，当前是详情接口在这个时段没有及时返回。页面不会把你抛回首页，你可以先继续浏览公开内容，再回来重试这篇帖子。'
                : '当前详情页已经接住了这条路径，正在向后端请求正文、附件列表和讨论记录。等待期间，返回路径会始终保留在上面。'}
            </p>
          </div>

          {isError ? (
            <div className="v1-action-row v1-community-status-actions">
              <Link className="v1-btn v1-btn--primary v1-btn--blocky" to="/community">
                返回社区列表
              </Link>
              <button
                className="v1-btn v1-btn--blocky"
                type="button"
                onClick={() => window.location.reload()}
              >
                重新载入
              </button>
            </div>
          ) : null}
        </div>

        <div className="v1-community-status-log">
          <span>{isError ? '接口状态' : '当前进度'}</span>
          <strong>{isError ? error : '正在等待后端返回正文、附件和评论。'}</strong>
        </div>
      </article>

      <aside className="v1-community-status-aside">
        <div className="v1-community-status-aside-head">
          <p className="v1-eyebrow">{isError ? '接下来' : '当前页面会保留什么'}</p>
          <h2>{isError ? '你现在还能继续什么' : '这不是空白等待页。'}</h2>
        </div>

        <ul className="v1-community-status-list">
          {isError ? (
            <>
              <li>先回社区列表继续浏览公开帖子，不会丢失入口层级。</li>
              <li>后端恢复后重新打开这条详情，仍然沿用同一条阅读路径。</li>
              <li>游客依然可以继续看社区和题库，互动动作再通过登录进入。</li>
            </>
          ) : (
            <>
              <li>页面不会把你弹回社区首页，也不会把发帖页和列表页混进来。</li>
              <li>正文回来后会直接展开在这页，附件和评论区也会顺着出现。</li>
              <li>如果等待时间过长，你仍然可以从上方返回社区列表继续浏览。</li>
            </>
          )}
        </ul>

        <div className="v1-community-status-ticket">
          <span>{isError ? '建议处理' : '当前路径'}</span>
          <strong>{isError ? '先继续浏览公开内容，稍后再回来重试这条帖子。' : `/community/${id}`}</strong>
        </div>
      </aside>
    </section>
  )
}

export default function CommunityDetailPage() {
  const { id } = useParams()
  const { token, isAuthed } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [acting, setActing] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [previewNotice, setPreviewNotice] = useState('')
  const isForcedPreview = shouldForceCommunityPreview(token)
  const isPreviewMode = Boolean(previewNotice)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setPreviewNotice('')

      function applyPreviewDetail() {
        const previewPost = findCommunityPreviewPostById(id)
        if (!previewPost) return false

        const previewComments = createCommunityPreviewComments(id)
        setComments(previewComments)
        setPost(normalizePost(previewPost, previewComments))
        setPreviewNotice(COMMUNITY_DETAIL_PREVIEW_NOTICE)
        return true
      }

      if (isForcedPreview) {
        if (!active) return
        if (!applyPreviewDetail()) {
          setError('当前预览集中没有这篇帖子。')
        }
        setLoading(false)
        return
      }

      try {
        const [postData, commentData] = await withRequestTimeout(
          Promise.all([
            communityApi.postDetail(id, token),
            communityApi.comments(id, token),
          ]),
          8000,
          COMMUNITY_DETAIL_TIMEOUT_MESSAGE,
        )

        if (!active) return

        const nextComments = Array.isArray(commentData) ? commentData : (commentData?.content || [])
        setComments(nextComments)
        setPost(normalizePost(postData, nextComments))
        setPreviewNotice('')
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview() && applyPreviewDetail()) {
          setError('')
        } else {
          setError(requestError.message || '帖子详情加载失败，请稍后再试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [id, isForcedPreview, token])

  async function refreshComments() {
    if (isPreviewMode) return
    const nextComments = await communityApi.comments(id, token)
    const normalized = Array.isArray(nextComments) ? nextComments : (nextComments?.content || [])
    setComments(normalized)
    setPost((current) => (current ? { ...current, commentCount: countComments(normalized) } : current))
  }

  async function handleToggleLike() {
    if (!isAuthed) {
      setActionMessage('登录后继续互动')
      return
    }

    if (isPreviewMode) {
      setPost((current) => (
        current
          ? {
              ...current,
              liked: !current.liked,
              likeCount: current.liked ? Math.max(0, current.likeCount - 1) : current.likeCount + 1,
            }
          : current
      ))
      setActionMessage('当前为开发预览：已模拟更新点赞状态。')
      return
    }

    setActing(true)
    setActionMessage('')
    try {
      const result = await communityApi.toggleLike(id, token)
      setPost((current) => (
        current
          ? {
              ...current,
              liked: result.liked,
              likeCount: Number(result.likeCount ?? current.likeCount),
            }
          : current
      ))
    } catch (requestError) {
      setActionMessage(requestError.message || '点赞没有成功，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleToggleFavorite() {
    if (!isAuthed) {
      setActionMessage('登录后继续互动')
      return
    }

    if (isPreviewMode) {
      setPost((current) => (
        current
          ? {
              ...current,
              favorited: !current.favorited,
              favoriteCount: current.favorited ? Math.max(0, current.favoriteCount - 1) : current.favoriteCount + 1,
            }
          : current
      ))
      setActionMessage('当前为开发预览：已模拟更新收藏状态。')
      return
    }

    setActing(true)
    setActionMessage('')
    try {
      const result = await communityApi.toggleFavorite(id, token)
      setPost((current) => (
        current
          ? {
              ...current,
              favorited: result.favorited,
              favoriteCount: Number(result.favoriteCount ?? current.favoriteCount),
            }
          : current
      ))
    } catch (requestError) {
      setActionMessage(requestError.message || '收藏没有成功，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleReport() {
    if (!isAuthed) {
      setActionMessage('登录后继续互动')
      return
    }

    const reason = window.prompt('请输入举报原因（不超过 300 字）')
    if (reason == null) return

    const normalizedReason = reason.trim()
    if (!normalizedReason) {
      setActionMessage('举报原因不能为空。')
      return
    }

    if (isPreviewMode) {
      setPost((current) => (
        current
          ? {
              ...current,
              reportCount: current.reportCount + 1,
            }
          : current
      ))
      setActionMessage('当前为开发预览：已模拟提交举报，正式处理仍需连接后端。')
      return
    }

    setActing(true)
    setActionMessage('')
    try {
      const result = await communityApi.reportPost(id, normalizedReason, token)
      setPost((current) => (
        current
          ? {
              ...current,
              reportCount: Number(result.reportCount ?? current.reportCount),
            }
          : current
      ))
      setActionMessage('举报已提交，管理员会继续处理。')
    } catch (requestError) {
      setActionMessage(requestError.message || '举报没有成功，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleDownloadAttachment(attachment) {
    if (isPreviewMode) {
      setActionMessage(`当前为开发预览：已模拟下载 ${attachment.originalName}。`)
      return
    }

    setDownloadingId(attachment.id)
    setActionMessage('')

    try {
      await communityApi.downloadPostAttachment(id, attachment.id, token)
      setActionMessage(`已开始下载：${attachment.originalName}`)
    } catch (requestError) {
      setActionMessage(requestError.message || '附件下载失败，请稍后重试。')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleSubmitComment(event) {
    event.preventDefault()

    if (!isAuthed) {
      setCommentError('请先登录后评论。')
      return
    }

    const normalized = commentText.trim()
    if (!normalized) {
      setCommentError('评论内容不能为空。')
      return
    }
    if (normalized.length > 300) {
      setCommentError('评论内容不能超过 300 字。')
      return
    }

    if (isPreviewMode) {
      setComments((current) => (
        [
          ...current,
          {
            id: Date.now(),
            content: normalized,
            authorId: 'preview-user',
            authorName: '当前预览账号',
            parentId: null,
            status: 'PUBLISHED',
            reportCount: 0,
            editable: true,
            deleted: false,
            hidden: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replyCount: 0,
            replies: [],
          },
        ]
      ))
      setPost((current) => (current ? { ...current, commentCount: current.commentCount + 1 } : current))
      setCommentText('')
      setActionMessage('当前为开发预览：已模拟新增评论。')
      setCommentError('')
      return
    }

    setCommentSubmitting(true)
    setCommentError('')

    try {
      await communityApi.createComment(id, { content: normalized, parentId: null }, token)
      setCommentText('')
      await refreshComments()
    } catch (requestError) {
      setCommentError(requestError.message || '评论提交失败，请稍后再试。')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const postLead = useMemo(() => {
    if (!post) return ''
    return createPlainPreview(post.content).slice(0, 96)
  }, [post])

  return (
    <section className="v1-community-detail-page">
      <ReturnBar
        items={[
          { label: '游客门厅', to: '/' },
          { label: '社区', to: '/community' },
          { label: '帖子详情' },
        ]}
        hint="读完这篇帖子后，回到社区列表继续找下一篇，而不是退回一堆混杂入口。"
      />

      {previewNotice ? <PreviewBanner>{previewNotice}</PreviewBanner> : null}

      {loading ? (
        <CommunityStatusPanel id={id} mode="loading" />
      ) : error ? (
        <CommunityStatusPanel error={error} id={id} mode="error" />
      ) : (
        <>
          <section className="v1-community-dossier">
            <article className="v1-community-dossier-paper">
              <header className="v1-community-dossier-head">
                <div className="v1-community-dossier-flag">
                  <span>{post?.category?.name || post?.category?.code || '社区帖子'}</span>
                  <span>{getVisibilityLabel(post)}</span>
                  {post?.hasAttachment ? <span>附件 {post.attachmentCount}</span> : null}
                </div>

                <div className="v1-community-dossier-titleblock">
                  <p className="v1-eyebrow">帖子正文</p>
                  <h1>{post?.title}</h1>
                  <p className="v1-community-dossier-lead">
                    {postLead || '这篇帖子当前没有单独摘要，正文会直接展开在下面。'}
                  </p>
                </div>

                <div className="v1-community-dossier-meta-grid">
                  <div className="v1-community-dossier-meta-card">
                    <span>发布方式</span>
                    <strong>{getAuthorLabel(post)}</strong>
                  </div>
                  <div className="v1-community-dossier-meta-card">
                    <span>发布时间</span>
                    <strong>{formatTimeLabel(post?.createdAt)}</strong>
                  </div>
                  <div className="v1-community-dossier-meta-card">
                    <span>讨论状态</span>
                    <strong>{post?.commentCount ? `${post.commentCount} 条公开评论` : '暂时还没有公开评论'}</strong>
                  </div>
                </div>
              </header>

              {post?.tags?.length ? (
                <div className="v1-community-taxonomy">
                  {post.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              ) : null}

              <div className="v1-community-markdown">
                <SimpleMarkdownContent content={post?.content || ''} />
              </div>

              {post?.attachmentNote ? (
                <div className="v1-community-notice">
                  <strong>附件说明</strong>
                  <p>{post.attachmentNote}</p>
                </div>
              ) : null}

              <footer className="v1-community-dossier-foot">
                <span>浏览 {post?.viewCount ?? 0}</span>
                <span>评论 {post?.commentCount ?? 0}</span>
                <span>点赞 {post?.likeCount ?? 0}</span>
                <span>收藏 {post?.favoriteCount ?? 0}</span>
                <span>举报 {post?.reportCount ?? 0}</span>
              </footer>
            </article>

            <aside className="v1-community-tools">
              <section className="v1-panel v1-community-tool-section">
                <div className="v1-panel-head">
                  <p className="v1-eyebrow">资料区</p>
                  <h2>附件与资料</h2>
                </div>

                {post?.hasAttachment && post.attachments.length ? (
                  <div className="v1-community-tool-stack">
                    {post.attachments.map((attachment) => (
                      <div className="v1-community-attachment-row" key={attachment.id}>
                        <div>
                          <strong>{attachment.originalName}</strong>
                          <span>{formatFileSize(attachment.fileSize)}</span>
                        </div>
                        <button
                          className="v1-btn v1-btn--blocky"
                          type="button"
                          onClick={() => handleDownloadAttachment(attachment)}
                          disabled={downloadingId === attachment.id}
                        >
                          {downloadingId === attachment.id ? '下载中' : '下载'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="v1-community-action-card">
                    <strong>这篇帖子没有附件。</strong>
                    <p>当前阅读页只保留正文、资料和互动入口，不把发帖编辑动作塞进来。</p>
                  </div>
                )}
              </section>

              <section className="v1-panel v1-community-tool-section">
                <div className="v1-panel-head">
                  <p className="v1-eyebrow">互动区</p>
                  <h2>先读清楚，再决定要不要参与。</h2>
                </div>

                <div className="v1-community-action-grid">
                  <button
                    className={`v1-btn v1-btn--blocky ${post?.liked ? 'v1-btn--primary' : ''}`}
                    type="button"
                    onClick={handleToggleLike}
                    disabled={acting}
                  >
                    {post?.liked ? '已点赞' : '点赞'}
                  </button>
                  <button
                    className={`v1-btn v1-btn--blocky ${post?.favorited ? 'v1-btn--primary' : ''}`}
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={acting}
                  >
                    {post?.favorited ? '已收藏' : '收藏'}
                  </button>
                  <button
                    className="v1-btn v1-btn--blocky"
                    type="button"
                    onClick={handleReport}
                    disabled={acting}
                  >
                    举报
                  </button>
                </div>

                {!isAuthed ? (
                  <div className="v1-community-login-callout">
                    <strong>登录后继续互动</strong>
                    <p>当前你可以先阅读内容；如果要评论、点赞或收藏，请从这里进入登录流程。</p>
                    <RoleAuthLink className="v1-btn v1-btn--primary v1-btn--blocky">
                      去登录
                    </RoleAuthLink>
                  </div>
                ) : null}

                {actionMessage ? <div className="v1-message">{actionMessage}</div> : null}
              </section>
            </aside>
          </section>

          <section className="v1-panel v1-community-comments-ledger">
            <div className="v1-community-comments-ledger-head">
              <div>
                <p className="v1-eyebrow">讨论记录</p>
                <h2>这篇帖子下面的公开回应</h2>
              </div>
              <span>{comments.length ? `${comments.length} 组讨论` : '暂时还没有公开回应'}</span>
            </div>

            {comments.length ? (
              <CommentList items={comments} />
            ) : (
              <div className="v1-community-action-card">
                <strong>还没有公开评论。</strong>
                <p>如果你已经读完正文，登录后可以留下第一条回应。</p>
              </div>
            )}

            <form className="v1-community-comment-form" onSubmit={handleSubmitComment}>
              <label className="v1-field">
                <span>写一条评论</span>
                <textarea
                  rows="5"
                  value={commentText}
                  placeholder={isAuthed ? '把观点写清楚，单条评论最多 300 字。' : '请先登录后评论。'}
                  disabled={!isAuthed}
                  onChange={(event) => setCommentText(event.target.value)}
                />
              </label>

              <div className="v1-community-comment-meta">
                <span>评论上限 300 字</span>
                <span>{commentText.trim().length}/300</span>
              </div>

              {commentError ? <div className="v1-error">{commentError}</div> : null}

              <div className="v1-action-row">
                {!isAuthed ? (
                  <RoleAuthLink className="v1-btn v1-btn--blocky">
                    去登录后评论
                  </RoleAuthLink>
                ) : null}
                <button
                  className="v1-btn v1-btn--primary v1-btn--blocky"
                  type="submit"
                  disabled={!isAuthed || !commentText.trim() || commentSubmitting}
                >
                  {commentSubmitting ? '提交中' : '发布评论'}
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </section>
  )
}
