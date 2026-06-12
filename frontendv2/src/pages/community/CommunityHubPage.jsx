import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseCommunityPreview,
  createCommunityPreviewCategories,
  createCommunityPreviewComments,
  createCommunityPreviewPosts,
  findCommunityPreviewPostById,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const fallbackCategories = [
  { id: 'kaoyan', code: 'kaoyan', name: '考研' },
  { id: 'kaogong', code: 'kaogong', name: '考公考编' },
  { id: 'job', code: 'job', name: '就业' },
  { id: 'liuxue', code: 'liuxue', name: '留学' },
  { id: 'experience', code: 'experience', name: '经验复盘' },
  { id: 'resource', code: 'resource', name: '资料互助' },
]

const sortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热度优先' },
]

function parseTags(post) {
  if (Array.isArray(post?.tags)) return post.tags
  if (typeof post?.tags === 'string') {
    return post.tags.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function normalizePost(post) {
  return {
    ...post,
    tags: parseTags(post),
    attachmentCount: Number(post.attachmentCount ?? 0),
    viewCount: Number(post.viewCount ?? post.views ?? 0),
    commentCount: Number(post.commentCount ?? 0),
    likeCount: Number(post.likeCount ?? 0),
    favoriteCount: Number(post.favoriteCount ?? post.collectCount ?? 0),
  }
}

function createPlainPreview(content) {
  return String(content || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatTimeLabel(value) {
  if (!value) return '刚刚更新'
  const normalized = String(value).replace('T', ' ')
  return normalized.slice(5, 16)
}

function buildParams(currentParams, patch) {
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

export default function CommunityHubPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState(fallbackCategories)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '')

  const activeCategory = searchParams.get('category') || ''
  const activeSort = searchParams.get('sort') || 'latest'
  const activeKeyword = searchParams.get('keyword') || ''
  const isForcedPreview = shouldForceCommunityPreview(token)

  useEffect(() => {
    setKeywordInput(activeKeyword)
  }, [activeKeyword])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setNotice('')

      function applyPreview() {
        setCategories(createCommunityPreviewCategories())
        setPosts(createCommunityPreviewPosts({
          category: activeCategory || undefined,
          keyword: activeKeyword || undefined,
          sort: activeSort,
        }).map(normalizePost))
        setNotice('社区：预览目录')
      }

      if (isForcedPreview) {
        applyPreview()
        setLoading(false)
        return
      }

      try {
        const [categoryData, postData] = await withRequestTimeout(
          Promise.all([
            communityApi.categories(),
            communityApi.posts({
              category: activeCategory || undefined,
              keyword: activeKeyword || undefined,
              sort: activeSort,
            }, token),
          ]),
          8000,
          '社区请求超时，请检查后端服务是否可用。',
        )

        if (!active) return
        setCategories(categoryData?.length ? categoryData : fallbackCategories)
        setPosts((postData?.content || postData || []).map(normalizePost))
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview()) {
          applyPreview()
        } else {
          setCategories(fallbackCategories)
          setError(requestError.message || '社区内容加载失败，请稍后再试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [activeCategory, activeKeyword, activeSort, isForcedPreview, token])

  const hotTags = useMemo(() => {
    const tagSet = new Set()
    posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)))
    return Array.from(tagSet).slice(0, 8)
  }, [posts])

  const summaryCards = useMemo(() => {
    const attachmentCount = posts.reduce((sum, post) => sum + post.attachmentCount, 0)
    const publicCount = posts.filter((post) => post.visibility !== 'members').length
    const heat = posts.reduce((sum, post) => sum + post.commentCount + post.likeCount, 0)

    return [
      {
        label: '当前帖子',
        value: String(posts.length).padStart(2, '0'),
        note: activeCategory ? '已按分类缩小范围' : '保持公共目录视角',
      },
      {
        label: '可预览附件',
        value: String(attachmentCount).padStart(2, '0'),
        note: '进入帖子前先看到资料状态',
      },
      {
        label: '公开讨论量',
        value: `${publicCount}/${posts.length || 0}`,
        note: `互动热度 ${heat}`,
      },
    ]
  }, [activeCategory, posts])

  const discussionHighlights = useMemo(() => (
    posts.slice(0, 3).map((post) => ({
      id: post.id,
      title: post.title,
      note: `${post.category?.name || '社区'} / 评论 ${post.commentCount} / 点赞 ${post.likeCount}`,
    }))
  ), [posts])

  function updateQuery(patch) {
    setSearchParams(buildParams(searchParams, patch))
  }

  function handleSearch(event) {
    event.preventDefault()
    updateQuery({ keyword: keywordInput.trim() })
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="社区首页"
          title="先看讨论目录，再决定要不要深入参与。"
          lead="先筛目录，再进正文。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        <section className="v2-summary-strip" aria-label="社区摘要">
          {summaryCards.map((item) => (
            <article className="v2-summary-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </section>

        <section className="v2-toolbar-card" aria-label="社区目录控制">
          <div className="v2-toolbar-row">
            <div className="v2-toolbar-copy">
              <strong>分类入口</strong>
              <p>先缩小范围，再进帖子。</p>
            </div>
            <div className="v2-chip-group">
              <button
                className={`v2-filter-chip ${activeCategory === '' ? 'is-active' : ''}`}
                type="button"
                onClick={() => updateQuery({ category: '' })}
              >
                全部
              </button>
              {categories.map((item) => (
                <button
                  key={item.id || item.code}
                  className={`v2-filter-chip ${activeCategory === item.code ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => updateQuery({ category: item.code })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="v2-toolbar-row">
            <div className="v2-toolbar-copy">
              <strong>排序方式</strong>
              <p>最新和热帖分开看。</p>
            </div>
            <div className="v2-segment-group">
              {sortOptions.map((item) => (
                <button
                  key={item.value}
                  className={`v2-segment-button ${activeSort === item.value ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => updateQuery({ sort: item.value })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="v2-article-card">正在整理社区目录...</div>
        ) : posts.length ? (
          <section className="v2-feed-list" aria-label="社区帖子列表">
            {posts.map((post) => (
              <Link className="v2-feed-item v2-feed-item--article" key={post.id} to={`/community/${post.id}`}>
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
                      {post.attachmentCount ? <span>附件 {post.attachmentCount}</span> : null}
                    </div>
                    <span className="v2-inline-link">查看正文</span>
                  </div>
                </div>
                <div className="v2-feed-side">
                  <span>浏览 {post.viewCount}</span>
                  <span>评论 {post.commentCount}</span>
                  <span>点赞 {post.likeCount}</span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="v2-article-card">当前筛选条件下还没有帖子，可以换个分类或关键词试试。</div>
        )}

      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">检索帖子</p>
          <form className="v2-filter-form" onSubmit={handleSearch}>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={keywordInput}
                placeholder="搜标题、正文或标签"
                onChange={(event) => setKeywordInput(event.target.value)}
              />
            </label>

            <button className="v2-sidebar-button" type="submit">更新目录</button>
          </form>
        </section>

        {!loading && posts.length ? (
          <section className="v2-side-card">
            <p className="v2-kicker">最近讨论重点</p>
            <div className="v2-check-list">
              {discussionHighlights.map((item) => (
                <Link className="v2-check-row" key={item.id} to={`/community/${item.id}`}>
                  <strong>{item.title}</strong>
                  <span>{item.note}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {hotTags.length ? (
          <section className="v2-side-card">
            <p className="v2-kicker">热词</p>
            <div className="v2-tag-row">
              {hotTags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </>
  )
}

function renderContentSections(content) {
  return String(content || '')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => (
      <p className="v2-content-block" key={`${index}-${item.slice(0, 12)}`}>
        {item.replace(/^#+\s*/, '')}
      </p>
    ))
}

function renderCommentRows(comments = []) {
  return comments.map((comment) => (
    <div className="v2-comment-block" key={comment.id}>
      <div className="v2-comment-head">
        <strong>{comment.authorName || '匿名用户'}</strong>
        <span>{formatTimeLabel(comment.createdAt)}</span>
      </div>
      <p>{comment.content}</p>
      {comment.replies?.length ? (
        <div className="v2-comment-replies">
          {comment.replies.map((reply) => (
            <div className="v2-comment-reply" key={reply.id}>
              <strong>{reply.authorName || '匿名用户'}</strong>
              <p>{reply.content}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  ))
}

export function CommunityPostPage() {
  const { postId } = useParams()
  const { token } = useAuth()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const isForcedPreview = shouldForceCommunityPreview(token)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setNotice('')

      function applyPreview() {
        const previewPost = findCommunityPreviewPostById(postId)
        if (!previewPost) {
          setError('没有找到这篇预览帖子。')
          setLoading(false)
          return
        }
        setPost(normalizePost(previewPost))
        setComments(createCommunityPreviewComments(postId))
        setNotice('当前详情页使用模拟帖子数据，方便观察正文、附件与评论区的真实展示状态。')
        setLoading(false)
      }

      if (isForcedPreview) {
        applyPreview()
        return
      }

      try {
        const [postData, commentData] = await withRequestTimeout(
          Promise.all([
            communityApi.postDetail(postId, token),
            communityApi.comments(postId, token),
          ]),
          8000,
          '帖子详情请求超时，请检查后端服务是否可用。',
        )

        if (!active) return
        setPost(normalizePost(postData))
        setComments(commentData || [])
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview()) {
          applyPreview()
          return
        }
        setError(requestError.message || '帖子详情加载失败。')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [isForcedPreview, postId, token])

  return (
    <div className="v2-main-column">
      {loading ? <div className="v2-article-card">正在读取帖子详情...</div> : null}
      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {error ? <div className="v2-status-error">{error}</div> : null}

      {post ? (
        <>
          <section className="v2-article-card">
            <div className="v2-article-meta">
              <Link className="v2-inline-link" to="/community">返回社区目录</Link>
              <span>{post.category?.name || '社区'}</span>
              <span>{post.visibility === 'members' ? '成员可见' : '公开可见'}</span>
            </div>
            <h1 className="v2-article-title">{post.title}</h1>
            <div className="v2-article-meta">
              <span>浏览 {post.viewCount}</span>
              <span>评论 {post.commentCount}</span>
              <span>点赞 {post.likeCount}</span>
              <span>收藏 {post.favoriteCount}</span>
            </div>
            <div className="v2-content-stack">
              {renderContentSections(post.content)}
            </div>
          </section>

          {post.attachments?.length ? (
            <section className="v2-feed-list" aria-label="帖子附件">
              {post.attachments.map((item) => (
                <div className="v2-feed-item" key={item.id}>
                  <div className="v2-feed-index">AT</div>
                  <div className="v2-feed-body">
                    <strong>{item.originalName}</strong>
                    <p>{item.fileType} / 下载 {item.downloadCount} / {Math.round(item.fileSize / 1024)} KB</p>
                  </div>
                  <span className="v2-feed-action">附件</span>
                </div>
              ))}
            </section>
          ) : null}

          <section className="v2-article-card">
            <p className="v2-kicker">评论区</p>
            <h3>讨论回复</h3>
            <div className="v2-comment-list">
              {comments.length ? renderCommentRows(comments) : <p>当前还没有评论。</p>}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
