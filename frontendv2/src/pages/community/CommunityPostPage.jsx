import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import CommunityCommentComposer from '@/components/community/CommunityCommentComposer.jsx'
import CommunityCommentThread from '@/components/community/CommunityCommentThread.jsx'
import CommunityPostActions from '@/components/community/CommunityPostActions.jsx'
import FrontendV2MarkdownContent from '@/components/markdown/FrontendV2MarkdownContent.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import SubnavTabs from '@/components/SubnavTabs.jsx'
import {
  canUseCommunityPreview,
  createCommunityPreviewComments,
  findCommunityPreviewPostById,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import {
  cloneCommentTree,
  countComments,
  flattenCommentThreadForDisplay,
  findCommentInTree,
  formatFileSize,
  insertCommentIntoTree,
  normalizeCommunityComment,
  normalizeCommunityPost,
  postStatusLabelMap,
  removeCommentFromTree,
  updateCommentInTree,
} from '@/lib/communityUi.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const communityTabs = [
  { label: '社区目录', to: '/community', note: '浏览与筛选' },
  { label: '发布帖子', to: '/community/new', note: '提交正文与附件' },
  { label: '消息通知', to: '/community/notifications', note: '查看互动提醒' },
]

function getCommentAuthorLabel(comment) {
  if (comment?.authorName) return comment.authorName
  if (comment?.authorId) return `用户 ${comment.authorId}`
  return '匿名用户'
}

export default function CommunityPostPage() {
  const location = useLocation()
  const { postId } = useParams()
  const { user, token, isAuthed } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [composer, setComposer] = useState({
    mode: 'new',
    target: null,
    value: '',
  })
  const [reportPanel, setReportPanel] = useState({
    type: '',
    target: null,
    reason: '',
  })
  const [acting, setActing] = useState(false)
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null)
  const isForcedPreview = shouldForceCommunityPreview(token)
  const currentUserId = user?.id ?? null
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin'
  const returnTo = location.state?.returnTo || '/community'

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setNotice('')

      function applyPreview(message) {
        const previewPost = findCommunityPreviewPostById(postId)
        if (!previewPost) {
          setError('没有找到这篇帖子。')
          setLoading(false)
          return
        }

        const previewComments = createCommunityPreviewComments(postId).map(normalizeCommunityComment)

        if (!active) return
        setPost(normalizeCommunityPost(previewPost, previewComments))
        setComments(previewComments)
        setNotice(message)
      }

      if (isForcedPreview) {
        applyPreview('当前使用演示帖子数据，适合观察评论、附件和互动区的使用层次。')
        setLoading(false)
        return
      }

      try {
        const [postData, commentData] = await withRequestTimeout(
          Promise.all([
            communityApi.postDetail(postId, token),
            communityApi.comments(postId, token),
          ]),
          8000,
          '帖子详情请求超时，请检查后端服务是否正常启动。',
        )

        if (!active) return
        const normalizedComments = (commentData || []).map(normalizeCommunityComment)
        setPost(normalizeCommunityPost(postData, normalizedComments))
        setComments(normalizedComments)
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview()) {
          applyPreview('后端未返回帖子详情，已自动切换到演示数据。')
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
  }, [isForcedPreview, postId, token])

  const interactionSummary = useMemo(() => ([
    { label: '评论', value: post?.commentCount ?? 0 },
    { label: '点赞', value: post?.likeCount ?? 0 },
    { label: '收藏', value: post?.favoriteCount ?? 0 },
  ]), [post?.commentCount, post?.favoriteCount, post?.likeCount])
  const displayComments = useMemo(() => flattenCommentThreadForDisplay(comments), [comments])

  function syncPreviewComments(nextComments) {
    const normalized = cloneCommentTree(nextComments)
    setComments(normalized)
    setPost((current) => (
      current
        ? {
            ...current,
            commentCount: countComments(normalized),
          }
        : current
    ))
  }

  function ensureAuthForAction(messageText) {
    if (!isAuthed || !user) {
      setActionMessage(messageText)
      return false
    }
    return true
  }

  function handleStartReply(comment) {
    if (!ensureAuthForAction('请先登录后再回复评论。')) return
    setComposer({
      mode: 'reply',
      target: comment,
      value: '',
    })
    setReportPanel({ type: '', target: null, reason: '' })
    setActionMessage('')
    setReportMessage('')
  }

  function handleStartEdit(comment) {
    if (!ensureAuthForAction('请先登录后再编辑评论。')) return
    setComposer({
      mode: 'edit',
      target: comment,
      value: comment.content || '',
    })
    setReportPanel({ type: '', target: null, reason: '' })
    setActionMessage('')
    setReportMessage('')
  }

  function resetComposer() {
    setComposer({
      mode: 'new',
      target: null,
      value: '',
    })
  }

  async function handleSubmitComposer() {
    const content = composer.value.trim()
    const replyParentId = composer.mode === 'reply' ? (composer.target?.rootId ?? composer.target?.id ?? null) : null
    const replyTargetId = composer.mode === 'reply'
      && String(composer.target?.rootId ?? composer.target?.id ?? '') !== String(composer.target?.id ?? '')
      ? composer.target?.id ?? null
      : null

    if (!ensureAuthForAction('请先登录后再发表评论。')) return
    if (!content) {
      setActionMessage('评论内容不能为空。')
      return
    }
    if (content.length > 300) {
      setActionMessage('评论内容不能超过 300 字。')
      return
    }

    setActing(true)
    setActionMessage('')

    try {
      if (isForcedPreview) {
        if (composer.mode === 'edit' && composer.target) {
          syncPreviewComments(updateCommentInTree(comments, composer.target.id, (item) => ({
            ...item,
            content,
            updatedAt: new Date().toISOString(),
          })))
        } else {
          const previewComment = normalizeCommunityComment({
            id: `preview-${Date.now()}`,
            authorId: currentUserId,
            authorName: user?.name || '演示用户',
            content,
            parentId: replyParentId,
            replyToId: replyTargetId,
            replyToAuthorId: replyTargetId ? composer.target?.authorId ?? null : null,
            replyToAuthorName: replyTargetId ? composer.target?.authorName || '' : '',
            status: 'PUBLISHED',
            editable: true,
            deleted: false,
            hidden: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            replies: [],
            replyCount: 0,
          })

          syncPreviewComments(insertCommentIntoTree(comments, previewComment, previewComment.parentId))
        }

        setNotice('演示模式下已更新本地评论状态。')
      } else if (composer.mode === 'edit' && composer.target) {
        await communityApi.updateComment(postId, composer.target.id, { content }, token)
        const latest = await communityApi.comments(postId, token)
        const normalized = (latest || []).map(normalizeCommunityComment)
        setComments(normalized)
        setPost((current) => (current ? { ...current, commentCount: countComments(normalized) } : current))
      } else {
        await communityApi.createComment(postId, {
          content,
          parentId: replyParentId,
          replyToId: replyTargetId,
        }, token)
        const latest = await communityApi.comments(postId, token)
        const normalized = (latest || []).map(normalizeCommunityComment)
        setComments(normalized)
        setPost((current) => (current ? { ...current, commentCount: countComments(normalized) } : current))
      }

      resetComposer()
    } catch (requestError) {
      setActionMessage(requestError.message || '评论操作失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleDeleteComment(comment) {
    if (!ensureAuthForAction('请先登录后再删除评论。')) return
    if (!window.confirm('确认删除这条评论吗？')) return

    setActing(true)
    setActionMessage('')

    try {
      if (isForcedPreview) {
        syncPreviewComments(removeCommentFromTree(comments, comment.id))
        setNotice('演示模式下已移除本地评论。')
      } else {
        await communityApi.deleteComment(postId, comment.id, token)
        const latest = await communityApi.comments(postId, token)
        const normalized = (latest || []).map(normalizeCommunityComment)
        setComments(normalized)
        setPost((current) => (current ? { ...current, commentCount: countComments(normalized) } : current))
      }

      if (String(composer.target?.id || '') === String(comment.id)) {
        resetComposer()
      }
    } catch (requestError) {
      setActionMessage(requestError.message || '评论删除失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  function openPostReport() {
    if (!ensureAuthForAction('请先登录后再举报帖子。')) return
    setReportPanel({
      type: 'post',
      target: post,
      reason: '',
    })
    setReportMessage('')
  }

  function openCommentReport(comment) {
    if (!ensureAuthForAction('请先登录后再举报评论。')) return
    setReportPanel({
      type: 'comment',
      target: comment,
      reason: '',
    })
    setReportMessage('')
  }

  async function handleSubmitReport() {
    const reason = reportPanel.reason.trim()

    if (!reason) {
      setReportMessage('请先填写举报原因。')
      return
    }
    if (reason.length > 300) {
      setReportMessage('举报原因不能超过 300 字。')
      return
    }

    setActing(true)
    setReportMessage('')

    try {
      if (isForcedPreview) {
        setNotice('演示模式下已记录举报动作，真实提交请用后端账号联调。')
      } else if (reportPanel.type === 'post') {
        await communityApi.reportPost(postId, reason, token)
      } else if (reportPanel.type === 'comment' && reportPanel.target) {
        await communityApi.reportComment(postId, reportPanel.target.id, reason, token)
      }

      setReportPanel({ type: '', target: null, reason: '' })
      setReportMessage('举报已提交。')
    } catch (requestError) {
      setReportMessage(requestError.message || '举报提交失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleToggleLike() {
    if (!ensureAuthForAction('请先登录后再点赞。')) return

    setActing(true)
    try {
      if (isForcedPreview) {
        setPost((current) => (current
          ? {
              ...current,
              liked: !current.liked,
              likeCount: current.likeCount + (current.liked ? -1 : 1),
            }
          : current
        ))
      } else {
        const result = await communityApi.toggleLike(postId, token)
        setPost((current) => (current
          ? {
              ...current,
              liked: Boolean(result?.liked),
              likeCount: Number(result?.likeCount ?? current.likeCount),
            }
          : current
        ))
      }
    } catch (requestError) {
      setActionMessage(requestError.message || '点赞失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleToggleFavorite() {
    if (!ensureAuthForAction('请先登录后再收藏。')) return

    setActing(true)
    try {
      if (isForcedPreview) {
        setPost((current) => (current
          ? {
              ...current,
              favorited: !current.favorited,
              favoriteCount: current.favoriteCount + (current.favorited ? -1 : 1),
            }
          : current
        ))
      } else {
        const result = await communityApi.toggleFavorite(postId, token)
        setPost((current) => (current
          ? {
              ...current,
              favorited: Boolean(result?.favorited),
              favoriteCount: Number(result?.favoriteCount ?? current.favoriteCount),
            }
          : current
        ))
      }
    } catch (requestError) {
      setActionMessage(requestError.message || '收藏失败，请稍后再试。')
    } finally {
      setActing(false)
    }
  }

  async function handleDownloadAttachment(attachment) {
    if (!attachment?.id) return

    setDownloadingAttachmentId(attachment.id)
    setActionMessage('')

    try {
      if (isForcedPreview) {
        setNotice(`演示模式下不下载文件：${attachment.originalName}`)
      } else {
        await communityApi.downloadPostAttachment(postId, attachment.id, token)
      }
    } catch (requestError) {
      setActionMessage(requestError.message || '附件下载失败，请稍后再试。')
    } finally {
      setDownloadingAttachmentId(null)
    }
  }

  const activeCommentId = composer.target?.id || reportPanel.target?.id
  const composerTargetPreview = composer.target
    ? findCommentInTree(comments, composer.target.id)?.content?.slice(0, 36) || '评论'
    : ''

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="社区帖子"
          title={post?.title || '正在加载帖子'}
          lead="帖子详情页只处理正文、评论、附件和互动动作，其他入口都返回到对应列表页。"
          pathItems={[
            { label: '社区目录', to: '/community' },
            { label: '帖子详情' },
          ]}
          actions={(
            <Link className="v2-secondary-link" to={returnTo}>{'\u8fd4\u56de\u793e\u533a\u76ee\u5f55'}</Link>
          )}
        />

        <SubnavTabs items={communityTabs} />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}
        {actionMessage ? <div className="v2-status-note">{actionMessage}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在加载帖子内容...</div>
        ) : post ? (
          <>
            <section className="v2-article-card v2-post-detail-card">
              <div className="v2-post-header">
                <div className="v2-article-meta">
                  <span>{post.category?.name || '社区'}</span>
                  <span>{post.visibility === 'members' ? '成员可见' : '公开可见'}</span>
                  <span>{post.anonymous ? '匿名发布' : (post.authorName || '实名发布')}</span>
                  <span>{postStatusLabelMap[post.status] || post.status}</span>
                </div>
                <div className="v2-tag-row">
                  {post.tags.map((tag) => (
                    <span key={`${post.id}-${tag}`}>#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="v2-post-markdown">
                <FrontendV2MarkdownContent content={post.content || ''} />
              </div>
            </section>

            {post.attachmentNote ? (
              <section className="v2-article-card">
                <div className="v2-section-head">
                  <div>
                    <p className="v2-kicker">附件说明</p>
                    <h3>先看说明，再决定是否下载附件</h3>
                  </div>
                </div>
                <p>{post.attachmentNote}</p>
              </section>
            ) : null}

            <section className="v2-article-card">
              <div className="v2-section-head">
                <div>
                  <p className="v2-kicker">评论区</p>
                  <h3>评论列表和评论操作都放回评论区本体</h3>
                </div>
              </div>

              <CommunityCommentThread
                comments={displayComments}
                activeCommentId={activeCommentId}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onReply={handleStartReply}
                onEdit={handleStartEdit}
                onDelete={handleDeleteComment}
                onReport={openCommentReport}
              />

              <CommunityCommentComposer
                mode={composer.mode}
                variant="dock"
                target={composer.target ? {
                  ...composer.target,
                  authorName: getCommentAuthorLabel(composer.target),
                } : null}
                targetPreview={composerTargetPreview}
                value={composer.value}
                acting={acting}
                onChange={(value) => setComposer((current) => ({ ...current, value }))}
                onReset={resetComposer}
                onSubmit={handleSubmitComposer}
              />

              {reportPanel.type === 'comment' ? (
                <div className="v2-comment-editor v2-comment-editor--report">
                  <div className="v2-section-head">
                    <div>
                      <p className="v2-kicker">评论举报</p>
                      <h3>举报当前评论</h3>
                    </div>
                    <button
                      className="v2-ghost-link"
                      type="button"
                      onClick={() => setReportPanel({ type: '', target: null, reason: '' })}
                    >
                      取消
                    </button>
                  </div>

                  {reportMessage ? <div className="v2-status-note">{reportMessage}</div> : null}

                  <label className="v2-field">
                    <span>举报原因</span>
                    <textarea
                      rows="5"
                      value={reportPanel.reason}
                      placeholder="请写清楚举报原因，例如广告、辱骂、无关内容等。"
                      onChange={(event) => setReportPanel((current) => ({ ...current, reason: event.target.value }))}
                    />
                  </label>

                  <button className="v2-primary-link" type="button" disabled={acting} onClick={handleSubmitReport}>
                    提交举报
                  </button>
                </div>
              ) : null}
            </section>
          </>
        ) : (
          <div className="v2-article-card">没有找到这篇帖子。</div>
        )}
      </div>

      <aside className="v2-side-column">
        <CommunityPostActions
          interactionSummary={interactionSummary}
          liked={post?.liked}
          favorited={post?.favorited}
          acting={acting}
          onToggleLike={handleToggleLike}
          onToggleFavorite={handleToggleFavorite}
          onReportPost={openPostReport}
        />

        <section className="v2-side-card">
          <p className="v2-kicker">举报面板</p>
          {reportPanel.type === 'post' ? (
            <>
              {reportMessage ? <div className="v2-status-note">{reportMessage}</div> : null}
              <div className="v2-side-card__head">
                <strong>举报当前帖子</strong>
                <button
                  className="v2-ghost-link"
                  type="button"
                  onClick={() => setReportPanel({ type: '', target: null, reason: '' })}
                >
                  取消
                </button>
              </div>
              <label className="v2-field">
                <span>举报原因</span>
                <textarea
                  rows="5"
                  value={reportPanel.reason}
                  placeholder="请写清楚举报原因，例如广告、辱骂、无关内容等。"
                  onChange={(event) => setReportPanel((current) => ({ ...current, reason: event.target.value }))}
                />
              </label>
              <button className="v2-primary-link" type="button" disabled={acting} onClick={handleSubmitReport}>
                提交举报
              </button>
            </>
          ) : (
            <p className="v2-note-text">这里现在只保留帖子举报。评论举报已经回到中间评论区，跟随具体评论处理。</p>
          )}
        </section>

        {post?.attachments?.length ? (
          <section className="v2-side-card">
            <p className="v2-kicker">附件下载</p>
            <div className="v2-check-list">
              {post.attachments.map((attachment) => (
                <div className="v2-check-row v2-check-row--action" key={attachment.id}>
                  <div>
                    <strong>{attachment.originalName}</strong>
                    <span>{formatFileSize(attachment.fileSize)} · 下载 {attachment.downloadCount}</span>
                  </div>
                  <button
                    className="v2-secondary-link"
                    type="button"
                    disabled={downloadingAttachmentId === attachment.id}
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    {downloadingAttachmentId === attachment.id ? '下载中...' : '下载'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </>
  )
}
