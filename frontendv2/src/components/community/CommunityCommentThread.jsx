import { formatDateTime } from '@/lib/communityUi.js'

function getCommentAuthorLabel(comment) {
  if (comment?.authorName) return comment.authorName
  if (comment?.authorId) return `用户 ${comment.authorId}`
  return '匿名用户'
}

function sameUserId(left, right) {
  if (left == null || right == null) return false
  return String(left) === String(right)
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
      {comments.map((comment) => {
        const ownedByCurrentUser = sameUserId(comment.authorId, currentUserId)
        const canReply = comment.editable
        const canEdit = comment.editable && ownedByCurrentUser
        const canDelete = comment.editable && (ownedByCurrentUser || isAdmin)
        const canReport = comment.editable && currentUserId && !ownedByCurrentUser
        const isActive = String(activeCommentId || '') === String(comment.id)

        return (
          <article className={`v2-comment-card ${isActive ? 'is-active' : ''}`} key={comment.id}>
            <div className="v2-comment-card__head">
              <div>
                <strong>{getCommentAuthorLabel(comment)}</strong>
                <span>{formatDateTime(comment.updatedAt || comment.createdAt)}</span>
              </div>
              <small>{comment.replyCount ? `${comment.replyCount} 条回复` : '可继续回复'}</small>
            </div>

            <p>{comment.content}</p>

            <div className="v2-inline-actions">
              {canReply ? (
                <button className="v2-ghost-link" type="button" onClick={() => onReply(comment)}>
                  回复
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

            {comment.replies?.length ? (
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
          </article>
        )
      })}
    </div>
  )
}
