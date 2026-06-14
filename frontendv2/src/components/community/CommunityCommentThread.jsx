import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/communityUi.js'

function getCommentAuthorLabel(comment) {
  if (comment?.deleted) return '评论已删除'
  if (comment?.authorName) return comment.authorName
  if (comment?.authorId) return `用户 ${comment.authorId}`
  return '匿名用户'
}

function getCommentAvatarLabel(comment) {
  if (comment?.deleted) return '删'
  return getCommentAuthorLabel(comment).trim().slice(0, 1) || '匿'
}

function sameUserId(left, right) {
  if (left == null || right == null) return false
  return String(left) === String(right)
}

function hasCommentInTree(items, targetId) {
  if (targetId == null) return false

  return items.some((item) => {
    if (String(item.id) === String(targetId)) return true
    return item.replies?.length ? hasCommentInTree(item.replies, targetId) : false
  })
}

function getReplyLabel(replyCount) {
  return replyCount > 0 ? `${replyCount} 条回复` : '可继续回复'
}

function getReplyToggleLabel(isExpanded, replyCount) {
  return isExpanded ? '收起回复' : `展开 ${replyCount} 条回复`
}

function CommunityCommentNode({
  comment,
  activeCommentId,
  currentUserId,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
  onReport,
}) {
  const ownedByCurrentUser = sameUserId(comment.authorId, currentUserId)
  const canReply = comment.editable
  const canEdit = comment.editable && ownedByCurrentUser
  const canDelete = comment.editable && (ownedByCurrentUser || isAdmin)
  const canReport = comment.editable && currentUserId && !ownedByCurrentUser
  const isActive = String(activeCommentId || '') === String(comment.id)
  const replyCount = Math.max(Number(comment.replyCount ?? 0), comment.replies?.length ?? 0)
  const hasReplies = replyCount > 0 && Array.isArray(comment.replies) && comment.replies.length > 0
  const hasActiveReply = hasReplies ? hasCommentInTree(comment.replies, activeCommentId) : false
  const [isRepliesExpanded, setRepliesExpanded] = useState(hasActiveReply)

  useEffect(() => {
    if (hasActiveReply) {
      setRepliesExpanded(true)
    }
  }, [hasActiveReply])

  return (
    <article className={`v2-comment-card ${isActive ? 'is-active' : ''}`}>
      <div className={`v2-comment-card__avatar ${comment.deleted ? 'is-deleted' : ''}`} aria-hidden="true">
        {getCommentAvatarLabel(comment)}
      </div>

      <div className="v2-comment-card__body">
        <div className="v2-comment-card__head">
          <div className="v2-comment-card__meta">
            <strong>{getCommentAuthorLabel(comment)}</strong>
            <span>{formatDateTime(comment.updatedAt || comment.createdAt)}</span>
          </div>
          <small>{getReplyLabel(replyCount)}</small>
        </div>

        <p className="v2-comment-card__content">
          {comment.replyToAuthorName ? (
            <span className="v2-comment-card__reply-prefix">{`回复 @${comment.replyToAuthorName}：`}</span>
          ) : null}
          {comment.content}
        </p>

        <div className="v2-inline-actions v2-comment-card__actions">
          {canReply ? (
            <button className="v2-ghost-link" type="button" onClick={() => onReply(comment)}>
              回复
            </button>
          ) : null}
          {hasReplies ? (
            <button
              className={`v2-ghost-link v2-comment-card__reply-toggle ${isRepliesExpanded ? 'is-open' : ''}`}
              type="button"
              onClick={() => setRepliesExpanded((current) => !current)}
            >
              {getReplyToggleLabel(isRepliesExpanded, replyCount)}
            </button>
          ) : null}
          {canEdit ? (
            <button className="v2-ghost-link" type="button" onClick={() => onEdit(comment)}>
              编辑
            </button>
          ) : null}
          {canDelete ? (
            <button className="v2-ghost-link v2-ghost-link--danger" type="button" onClick={() => onDelete(comment)}>
              删除
            </button>
          ) : null}
          {canReport ? (
            <button className="v2-ghost-link v2-ghost-link--danger" type="button" onClick={() => onReport(comment)}>
              举报
            </button>
          ) : null}
        </div>

        {hasReplies && isRepliesExpanded ? (
          <div className="v2-comment-card__replies">
            <CommunityCommentThread
              comments={comment.replies}
              activeCommentId={activeCommentId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReport={onReport}
            />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function CommunityCommentThread({
  comments,
  activeCommentId,
  currentUserId,
  isAdmin,
  onReply,
  onEdit,
  onDelete,
  onReport,
}) {
  if (!comments.length) {
    return <div className="v2-empty-card">当前还没有评论，可以直接在评论区下方写下第一条。</div>
  }

  return (
    <div className="v2-comment-thread">
      {comments.map((comment) => (
        <CommunityCommentNode
          key={comment.id}
          comment={comment}
          activeCommentId={activeCommentId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onReport={onReport}
        />
      ))}
    </div>
  )
}
