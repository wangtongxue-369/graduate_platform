import { Link } from 'react-router-dom'
import { createPlainPreview, formatTimeLabel } from '@/lib/communityUi.js'

export default function CommunityPostCard({ post, returnTo }) {
  return (
    <Link
      className="v2-feed-item v2-feed-item--article"
      to={`/community/${post.id}`}
      state={{ returnTo }}
    >
      <div className="v2-feed-body">
        <div className="v2-article-meta">
          <span>{post.category?.name || '社区'}</span>
          <span>{post.visibility === 'members' ? '成员可见' : '公开可见'}</span>
          <span>{formatTimeLabel(post.updatedAt || post.createdAt)}</span>
        </div>
        <strong>{post.title}</strong>
        <p>{createPlainPreview(post.content).slice(0, 140) || '暂无摘要内容。'}</p>
        <div className="v2-feed-foot">
          <div className="v2-tag-row">
            {post.tags.slice(0, 4).map((tag) => (
              <span key={`${post.id}-${tag}`}>#{tag}</span>
            ))}
            {post.hasAttachment ? <span>附件 {post.attachmentCount}</span> : null}
          </div>
          <span className="v2-inline-link">进入帖子</span>
        </div>
      </div>
      <div className="v2-feed-side">
        <span>浏览 {post.viewCount}</span>
        <span>评论 {post.commentCount}</span>
        <span>点赞 {post.likeCount}</span>
      </div>
    </Link>
  )
}
