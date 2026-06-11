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
        setNotice('当前展示的是模拟数据，用来观察帖子列表、附件状态和筛选控件的真实版式。')
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
          title="先读公开讨论，再决定是否深入参与。"
          lead="帖子目录、附件状态、互动数据和正文预览都直接进列表，把筛选器留给右侧，不再把所有功能摊开。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {error ? <div className="v2-status-error">{error}</div> : null}

        {loading ? (
          <div className="v2-article-card">正在整理社区内容…</div>
        ) : (
          <section className="v2-feed-list" aria-label="社区帖子列表">
            {posts.map((post) => (
              <Link className="v2-feed-item v2-feed-item--article" key={post.id} to={`/community/${post.id}`}>
                <div className="v2-feed-body">
                  <div className="v2-article-meta">
                    <span>{post.category?.name || '社区'}</span>
                    <span>{post.visibility === 'members' ? '成员可见' : '公开可见'}</span>
                  </div>
                  <strong>{post.title}</strong>
                  <p>{createPlainPreview(post.content).slice(0, 126) || '暂无摘要内容。'}</p>
                  <div className="v2-tag-row">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span key={`${post.id}-${tag}`}>#{tag}</span>
                    ))}
                    {post.attachmentCount ? <span>附件 {post.attachmentCount}</span> : null}
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
        )}
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
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

            <label className="v2-field">
              <span>排序</span>
              <select value={activeSort} onChange={(event) => updateQuery({ sort: event.target.value })}>
                {sortOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <button className="v2-sidebar-button" type="submit">开始筛选</button>
          </form>

          <div className="v2-side-section">
            <strong>分类</strong>
            <div className="v2-tag-row">
              <button className={`v2-filter-chip ${activeCategory === '' ? 'is-active' : ''}`} type="button" onClick={() => updateQuery({ category: '' })}>
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

          {hotTags.length ? (
            <div className="v2-side-section">
              <strong>热词</strong>
              <div className="v2-tag-row">
                {hotTags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
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
        <span>{comment.createdAt?.slice(5, 16)?.replace('T', ' ') || '刚刚'}</span>
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
        setNotice('当前详情页使用模拟帖子数据，方便观察正文、附件与评论区布局。')
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
      {loading ? <div className="v2-article-card">正在读取帖子详情…</div> : null}
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
