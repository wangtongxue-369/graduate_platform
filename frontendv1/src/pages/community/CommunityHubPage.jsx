import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import {
  canUseCommunityPreview,
  createCommunityPreviewCategories,
  createCommunityPreviewPosts,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const fallbackCategories = [
  { id: 'kaoyan', code: 'kaoyan', name: '考研' },
  { id: 'kaogong', code: 'kaogong', name: '考公考编' },
  { id: 'job', code: 'job', name: '就业' },
  { id: 'liuxue', code: 'liuxue', name: '留学' },
  { id: 'experience', code: 'experience', name: '经验分享' },
  { id: 'resource', code: 'resource', name: '资料互助' },
]

const sortOptions = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热度优先' },
]

const attachmentOptions = [
  { value: 'all', label: '全部帖子' },
  { value: 'yes', label: '仅看带附件' },
  { value: 'no', label: '仅看纯讨论' },
]

function parseTags(post) {
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

function normalizePost(post) {
  const attachments = Array.isArray(post?.attachments) ? post.attachments : []

  return {
    ...post,
    tags: parseTags(post),
    status: (post.auditStatus || post.status || 'PUBLISHED').toUpperCase(),
    hasAttachment:
      Boolean(post.hasAttachment) ||
      Boolean(post.attachmentUrl) ||
      Boolean(post.attachmentNote) ||
      attachments.length > 0,
    attachmentCount: Number(post.attachmentCount ?? post.fileCount ?? attachments.length ?? 0),
    viewCount: Number(post.viewCount ?? post.views ?? 0),
    commentCount: Number(post.commentCount ?? 0),
    likeCount: Number(post.likeCount ?? 0),
    favoriteCount: Number(post.favoriteCount ?? post.collectCount ?? 0),
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

function formatTimeLabel(value) {
  if (!value) return '刚刚更新'
  return value.replace('T', ' ').slice(0, 16)
}

function buildParams(currentParams, patch) {
  const next = new URLSearchParams(currentParams)

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') {
      next.delete(key)
      return
    }

    next.set(key, String(value))
  })

  return next
}

const COMMUNITY_TIMEOUT_MESSAGE = '社区请求超时，请检查后端服务是否可用。'
const COMMUNITY_PREVIEW_NOTICE = '当前展示为演示数据，正式内容与排序以上线后端结果为准。'

export default function CommunityHubPage() {
  const { user, token, isAuthed } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState(fallbackCategories)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewNotice, setPreviewNotice] = useState('')
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '')

  const activeCategory = searchParams.get('category') || ''
  const activeSort = searchParams.get('sort') || 'latest'
  const activeTag = searchParams.get('tag') || ''
  const activeAttachment = searchParams.get('hasAttachment') || 'all'
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
      setPreviewNotice('')

      function applyPreviewFeed() {
        setCategories(createCommunityPreviewCategories())
        setPosts(createCommunityPreviewPosts({
          category: activeCategory || undefined,
          keyword: activeKeyword || undefined,
          sort: activeSort,
          tag: activeTag || undefined,
          hasAttachment:
            activeAttachment === 'all'
              ? undefined
              : activeAttachment === 'yes',
        }).map(normalizePost))
        setPreviewNotice(COMMUNITY_PREVIEW_NOTICE)
      }

      if (isForcedPreview) {
        if (!active) return
        applyPreviewFeed()
        setLoading(false)
        return
      }

      try {
        const [categoryData, postData] = await withRequestTimeout(
          Promise.all([
            communityApi.categories(),
            communityApi.posts(
              {
                category: activeCategory || undefined,
                keyword: activeKeyword || undefined,
                sort: activeSort,
                tag: activeTag || undefined,
                hasAttachment:
                  activeAttachment === 'all'
                    ? undefined
                    : activeAttachment === 'yes',
              },
              token,
            ),
          ]),
          8000,
          COMMUNITY_TIMEOUT_MESSAGE,
        )

        if (!active) return

        setCategories(categoryData?.length ? categoryData : fallbackCategories)
        setPosts((postData?.content || postData || []).map(normalizePost))
        setPreviewNotice('')
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview()) {
          applyPreviewFeed()
          setError('')
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
  }, [activeAttachment, activeCategory, activeKeyword, activeSort, activeTag, isForcedPreview, token])

  const hotTags = useMemo(() => {
    const tagSet = new Set()

    posts.forEach((post) => {
      post.tags.forEach((tag) => tagSet.add(tag))
    })

    return Array.from(tagSet).slice(0, 10)
  }, [posts])

  const metrics = useMemo(() => {
    return {
      publicCount: posts.length,
      attachmentCount: posts.filter((post) => post.hasAttachment).length,
      discussionCount: posts.reduce((sum, post) => sum + post.commentCount, 0),
    }
  }, [posts])

  function updateQuery(patch) {
    setSearchParams(buildParams(searchParams, patch))
  }

  function handleSearch(event) {
    event.preventDefault()
    updateQuery({ keyword: keywordInput.trim() })
  }

  return (
    <section className="v1-community-hub">
      <div className="v1-community-layout">
        <aside className="v1-stack-sidebar">
          <section className="v1-stack-profile">
            <span className="v1-stack-avatar" aria-hidden="true">{isAuthed ? (user?.name || '用').slice(0, 1) : 'CM'}</span>
            <p className="v1-kicker">community</p>
            <h2>{isAuthed ? user?.name || '社区成员' : '公开社区'}</h2>
            <p>先看内容，再决定是否互动。发帖、评论和收藏只在真正需要时提示登录。</p>
            <div className="v1-stack-meta-row">
              <span>{metrics.publicCount} 篇公开帖子</span>
              <span>{metrics.attachmentCount} 篇带附件</span>
              <span>{metrics.discussionCount} 条讨论</span>
            </div>
            <div className="v1-action-column">
              {isAuthed ? (
                <Link className="v1-btn v1-btn--primary" to="/community/new">
                  进入发帖页
                </Link>
              ) : (
                <RoleAuthLink className="v1-btn v1-btn--primary">
                  登录后发帖
                </RoleAuthLink>
              )}
              <Link className="v1-btn" to="/practice">
                去题库
              </Link>
            </div>
          </section>

          <nav className="v1-stack-nav" aria-label="社区使用路径">
            <div className="v1-stack-nav-link is-current">
              <strong>公开阅读</strong>
              <span>先读帖，再决定是否需要身份动作</span>
            </div>
            <div className="v1-stack-nav-link">
              <strong>详情回列表</strong>
              <span>阅读完成后回到当前列表，而不是跳回首页</span>
            </div>
            <div className="v1-stack-nav-link">
              <strong>{isAuthed ? '进入发帖页' : '登录后发帖'}</strong>
              <span>发帖、评论、收藏和举报都在需要时再触发身份选择</span>
            </div>
          </nav>
        </aside>

        <div className="v1-community-main">
          <section className="v1-community-hero v1-community-hero--single">
            <div className="v1-community-hero-copy">
              <p className="v1-eyebrow">公开浏览区</p>
              <h1>先看公开讨论，再决定是否参与发言。</h1>
              <p className="v1-lead">
                这里负责公开浏览和阅读入口。筛选器单独放在右侧，内容流尽量吃满中间区域，不把说明文案挤进主视野。
              </p>
              <div className="v1-community-route-strip" aria-label="社区路径提示">
                <span>公开阅读</span>
                <span>按条件筛选</span>
                <span>{isAuthed ? '进入发帖页' : '登录后发帖'}</span>
              </div>
            </div>
          </section>

          <section className="v1-community-feed-head">
            <div>
              <p className="v1-eyebrow">公开讨论流</p>
              <h2>先进入阅读页，再决定要不要互动。</h2>
            </div>
          </section>

          {previewNotice ? (
            <div className="v1-message v1-community-preview-note">{previewNotice}</div>
          ) : null}

          {loading ? (
            <div className="v1-panel v1-community-state">正在整理社区内容…</div>
          ) : error ? (
            <div className="v1-panel v1-community-state">
              <div className="v1-error">{error}</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="v1-panel v1-community-state">
              当前筛选下还没有帖子。你可以先切换分类，或者稍后再回来看看。
            </div>
          ) : (
            <div className="v1-community-feed">
              {posts.map((post) => (
                <article className="v1-community-card" key={post.id}>
                  <div className="v1-community-card-head">
                    <span className="v1-community-card-mark">
                      {post.category?.name || post.category?.code || '社区'}
                    </span>
                    <span className="v1-community-card-time">{formatTimeLabel(post.createdAt)}</span>
                  </div>

                  <Link className="v1-community-card-title" to={`/community/${post.id}`}>
                    {post.title}
                  </Link>

                  <p className="v1-community-card-preview">
                    {createPlainPreview(post.content).slice(0, 110) || '这篇帖子暂时没有可展示的摘要内容。'}
                  </p>

                  <div className="v1-community-chip-row v1-community-chip-row--dense">
                    {post.tags.slice(0, 4).map((tag) => (
                      <span className="v1-community-chip v1-community-chip--static" key={`${post.id}-${tag}`}>
                        #{tag}
                      </span>
                    ))}
                    {post.hasAttachment ? (
                      <span className="v1-community-chip v1-community-chip--static">
                        附件 {post.attachmentCount}
                      </span>
                    ) : null}
                    <span className="v1-community-chip v1-community-chip--static">
                      {post.visibility === 'members' ? '成员可见' : '公开可见'}
                    </span>
                  </div>

                  <div className="v1-community-card-foot">
                    <div className="v1-community-card-metrics">
                      <span>浏览 {post.viewCount}</span>
                      <span>评论 {post.commentCount}</span>
                      <span>点赞 {post.likeCount}</span>
                      <span>收藏 {post.favoriteCount}</span>
                    </div>
                    <Link className="v1-btn" to={`/community/${post.id}`}>
                      进入阅读页
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="v1-community-filter-rail">
          <section className="v1-panel v1-community-panel">
            <div className="v1-panel-head">
              <p className="v1-eyebrow">筛选控制器</p>
              <h2>右侧只放筛选，不放无用说明。</h2>
            </div>

            <form className="v1-community-search" onSubmit={handleSearch}>
              <label className="v1-field">
                <span>关键词</span>
                <input
                  type="text"
                  value={keywordInput}
                  placeholder="搜标题、正文关键词或主题词"
                  onChange={(event) => setKeywordInput(event.target.value)}
                />
              </label>
              <button className="v1-btn v1-btn--primary" type="submit">
                开始筛选
              </button>
            </form>

            <div className="v1-community-filter-block">
              <span className="v1-community-filter-label">分类</span>
              <div className="v1-community-chip-row">
                <button
                  className={`v1-community-chip ${activeCategory === '' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => updateQuery({ category: '' })}
                >
                  全部
                </button>
                {categories.map((item) => (
                  <button
                    className={`v1-community-chip ${activeCategory === item.code ? 'is-active' : ''}`}
                    key={item.id || item.code}
                    type="button"
                    onClick={() => updateQuery({ category: item.code })}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="v1-form-stack">
              <label className="v1-field">
                <span>排序</span>
                <select value={activeSort} onChange={(event) => updateQuery({ sort: event.target.value })}>
                  {sortOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="v1-field">
                <span>帖子类型</span>
                <select
                  value={activeAttachment}
                  onChange={(event) => updateQuery({ hasAttachment: event.target.value })}
                >
                  {attachmentOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {hotTags.length ? (
              <div className="v1-community-filter-block">
                <span className="v1-community-filter-label">热词</span>
                <div className="v1-community-chip-row">
                  {hotTags.map((tag) => (
                    <button
                      className={`v1-community-chip ${activeTag === tag ? 'is-active' : ''}`}
                      key={tag}
                      type="button"
                      onClick={() => updateQuery({ tag: activeTag === tag ? '' : tag })}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </section>
  )
}
