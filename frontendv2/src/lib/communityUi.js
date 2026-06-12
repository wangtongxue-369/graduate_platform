export const fallbackCommunityCategories = [
  { id: 'kaoyan', code: 'kaoyan', name: '考研' },
  { id: 'kaogong', code: 'kaogong', name: '考公考编' },
  { id: 'job', code: 'job', name: '就业' },
  { id: 'liuxue', code: 'liuxue', name: '留学' },
  { id: 'experience', code: 'experience', name: '经验分享' },
  { id: 'resource', code: 'resource', name: '资料互助' },
]

export const communitySortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热度优先' },
]

export const communityAttachmentOptions = [
  { value: 'all', label: '全部帖子' },
  { value: 'yes', label: '仅看有附件' },
  { value: 'no', label: '仅看无附件' },
]

export const communityVisibilityOptions = [
  { value: 'public', label: '公开可见' },
  { value: 'members', label: '仅注册用户可见' },
]

export const communityNotificationFilters = [
  { value: 'all', label: '全部通知' },
  { value: 'unread', label: '只看未读' },
]

export const adminReviewStatusOptions = [
  { value: 'PENDING', label: '待审核' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'REJECTED', label: '已驳回' },
  { value: 'OFFLINE', label: '已下线' },
]

export const adminReportStatusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'RESOLVED', label: '已处理' },
  { value: 'REJECTED', label: '已驳回' },
]

export const adminUserStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'muted', label: '禁言' },
  { value: 'upload_limited', label: '限制上传' },
  { value: 'temporary_locked', label: '临时锁定' },
  { value: 'banned', label: '封禁' },
]

export const adminUserStatusActionOptions = [
  { value: 'normal', label: '恢复正常' },
  { value: 'muted', label: '设为禁言' },
  { value: 'upload_limited', label: '限制上传' },
  { value: 'temporary_locked', label: '临时锁定' },
  { value: 'banned', label: '封禁账号' },
]

export const postStatusLabelMap = {
  DRAFT: '草稿',
  PENDING: '待审核',
  PUBLISHED: '已发布',
  REJECTED: '已驳回',
  OFFLINE: '已下线',
}

export const reportStatusLabelMap = {
  PENDING: '待处理',
  RESOLVED: '已处理',
  REJECTED: '已驳回',
}

export const userStatusLabelMap = {
  normal: '正常',
  muted: '禁言',
  upload_limited: '限制上传',
  temporary_locked: '临时锁定',
  banned: '封禁',
}

export function parsePostTags(post) {
  if (Array.isArray(post?.tags)) return post.tags
  if (typeof post?.tags === 'string') {
    return post.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (Array.isArray(post?.tagList)) return post.tagList
  return []
}

export function createPlainPreview(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formatTimeLabel(value) {
  if (!value) return '刚刚更新'
  const normalized = String(value).replace('T', ' ')
  return normalized.slice(5, 16)
}

export function formatDateTime(value) {
  if (!value) return '暂无时间'
  return String(value).replace('T', ' ').slice(0, 16)
}

export function countComments(items = []) {
  return items.reduce((total, item) => total + 1 + countComments(item.replies || []), 0)
}

export function extractPagePayload(payload) {
  if (Array.isArray(payload)) {
    return {
      content: payload,
      page: 0,
      size: payload.length,
      totalPages: 1,
      totalElements: payload.length,
    }
  }

  const content = Array.isArray(payload?.content) ? payload.content : []
  return {
    content,
    page: Number(payload?.number ?? payload?.page ?? 0),
    size: Number(payload?.size ?? content.length ?? 0),
    totalPages: Number(payload?.totalPages ?? (content.length ? 1 : 0)),
    totalElements: Number(payload?.totalElements ?? content.length ?? 0),
  }
}

export function normalizeCommunityCategory(item) {
  return {
    id: item?.id ?? item?.code,
    code: item?.code || '',
    name: item?.name || item?.code || '未命名分类',
    description: item?.description || '',
    sortOrder: Number(item?.sortOrder ?? 0),
    active: item?.active !== false,
  }
}

export function normalizeAttachment(item) {
  return {
    id: item?.id,
    originalName: item?.originalName || `附件-${item?.id ?? 'unknown'}`,
    fileSize: Number(item?.fileSize ?? 0),
    fileType: item?.fileType || 'application/octet-stream',
    downloadCount: Number(item?.downloadCount ?? 0),
    createdAt: item?.createdAt || null,
  }
}

export function normalizeCommunityPost(post, commentItems = null) {
  const attachments = Array.isArray(post?.attachments) ? post.attachments.map(normalizeAttachment) : []

  return {
    ...post,
    tags: parsePostTags(post),
    category: post?.category ? normalizeCommunityCategory(post.category) : null,
    attachments,
    attachmentCount: Number(post?.attachmentCount ?? post?.fileCount ?? attachments.length ?? 0),
    hasAttachment: Boolean(post?.hasAttachment) || attachments.length > 0,
    viewCount: Number(post?.viewCount ?? post?.views ?? 0),
    commentCount: Number(post?.commentCount ?? countComments(commentItems || [])),
    likeCount: Number(post?.likeCount ?? 0),
    favoriteCount: Number(post?.favoriteCount ?? post?.collectCount ?? 0),
    reportCount: Number(post?.reportCount ?? 0),
    liked: Boolean(post?.liked),
    favorited: Boolean(post?.favorited),
    anonymous: Boolean(post?.anonymous),
    contentFormat: post?.contentFormat || 'plain',
    sourceFileName: post?.sourceFileName || '',
    visibility: post?.visibility || 'public',
    status: String(post?.auditStatus || post?.status || 'PUBLISHED').toUpperCase(),
  }
}

export function normalizeCommunityComment(comment) {
  const replies = Array.isArray(comment?.replies) ? comment.replies.map(normalizeCommunityComment) : []

  return {
    ...comment,
    id: comment?.id,
    authorId: comment?.authorId ?? null,
    authorName: comment?.authorName || '',
    content: comment?.content || '',
    parentId: comment?.parentId ?? null,
    status: comment?.status || 'PUBLISHED',
    editable: comment?.editable !== false,
    deleted: Boolean(comment?.deleted),
    hidden: Boolean(comment?.hidden),
    reportCount: Number(comment?.reportCount ?? 0),
    replyCount: Number(comment?.replyCount ?? replies.length),
    replies,
  }
}

export function normalizeCommunityNotification(item) {
  return {
    ...item,
    id: item?.id,
    title: item?.title || item?.subject || '社区通知',
    content: item?.content || item?.message || '',
    read: Boolean(item?.read ?? item?.isRead),
    createdAt: item?.createdAt || item?.time || null,
    link: item?.link || item?.url || '',
    type: item?.type || 'community',
  }
}

export function normalizeAdminReviewPost(item) {
  return {
    ...normalizeCommunityPost(item),
    reviewReason: item?.reviewReason || '',
    reviewedById: item?.reviewedById ?? null,
    reviewedAt: item?.reviewedAt || null,
    authorName: item?.authorName || '',
  }
}

export function normalizeAdminPostReport(item) {
  return {
    ...item,
    id: item?.id,
    reason: item?.reason || '',
    status: item?.status || 'PENDING',
    reviewNote: item?.reviewNote || '',
    createdAt: item?.createdAt || null,
    reviewedAt: item?.reviewedAt || null,
    reviewer: item?.reviewer || null,
    reporter: item?.reporter || { id: null, name: '匿名用户' },
    post: item?.post
      ? {
          ...item.post,
          id: item.post.id,
          title: item.post.title || '未命名帖子',
          status: item.post.status || 'PUBLISHED',
        }
      : null,
  }
}

export function normalizeAdminCommentReport(item) {
  return {
    ...item,
    id: item?.id,
    reason: item?.reason || '',
    status: item?.status || 'PENDING',
    reviewNote: item?.reviewNote || '',
    createdAt: item?.createdAt || null,
    reviewedAt: item?.reviewedAt || null,
    reporter: item?.reporter || { id: null, name: '匿名用户' },
    comment: item?.comment
      ? {
          ...item.comment,
          id: item.comment.id,
          content: item.comment.content || '',
          postTitle: item.comment.postTitle || '',
          postId: item.comment.postId ?? null,
          status: item.comment.status || 'PUBLISHED',
        }
      : null,
  }
}

export function normalizeManagedUser(item) {
  return {
    ...item,
    id: item?.id,
    name: item?.name || '未命名用户',
    email: item?.email || '',
    phone: item?.phone || '',
    target: item?.target || '',
    school: item?.school || '',
    role: item?.role || 'user',
    status: item?.status || 'normal',
    createdAt: item?.createdAt || null,
  }
}

export function buildSearchParams(currentParams, patch) {
  const next = new URLSearchParams(currentParams)

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      next.delete(key)
      return
    }
    next.set(key, String(value))
  })

  return next
}

export function createPreviewNotificationItems(posts = []) {
  return posts.slice(0, 6).map((post, index) => ({
    id: `preview-${post.id}-${index}`,
    title: `你的社区动态：${post.title}`,
    content: `${post.category?.name || '社区'}有新的互动，可继续查看评论和附件反馈。`,
    read: index > 1,
    createdAt: post.updatedAt || post.createdAt,
    link: `/community/${post.id}`,
    type: 'comment',
  }))
}

export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '未知大小'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export function cloneCommentTree(items = []) {
  return items.map((item) => ({
    ...item,
    replies: cloneCommentTree(item.replies || []),
  }))
}

export function insertCommentIntoTree(items, draftComment, parentId = null) {
  if (!parentId) {
    return [draftComment, ...items]
  }

  return items.map((item) => {
    if (String(item.id) === String(parentId)) {
      const nextReplies = [...(item.replies || []), draftComment]
      return {
        ...item,
        replyCount: nextReplies.length,
        replies: nextReplies,
      }
    }

    if (!item.replies?.length) return item

    const nextReplies = insertCommentIntoTree(item.replies, draftComment, parentId)
    if (nextReplies === item.replies) return item
    return {
      ...item,
      replyCount: nextReplies.length,
      replies: nextReplies,
    }
  })
}

export function updateCommentInTree(items, commentId, updater) {
  return items.map((item) => {
    if (String(item.id) === String(commentId)) {
      return updater(item)
    }
    if (!item.replies?.length) return item
    return {
      ...item,
      replies: updateCommentInTree(item.replies, commentId, updater),
    }
  })
}

export function removeCommentFromTree(items, commentId) {
  return items
    .filter((item) => String(item.id) !== String(commentId))
    .map((item) => ({
      ...item,
      replies: item.replies?.length ? removeCommentFromTree(item.replies, commentId) : [],
    }))
}

export function findCommentInTree(items, commentId) {
  for (const item of items) {
    if (String(item.id) === String(commentId)) return item
    if (item.replies?.length) {
      const nested = findCommentInTree(item.replies, commentId)
      if (nested) return nested
    }
  }
  return null
}
