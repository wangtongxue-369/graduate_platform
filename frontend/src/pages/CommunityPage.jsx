import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PostComposerModal from '../components/PostComposerModal.jsx'
import { communityApi } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const defaultCategories = [
  { id: 'kaoyan', code: 'kaoyan', name: '考研' },
  { id: 'kaogong', code: 'kaogong', name: '考公考编' },
  { id: 'job', code: 'job', name: '就业' },
  { id: 'liuxue', code: 'liuxue', name: '留学' },
  { id: 'experience', code: 'experience', name: '经验分享' },
  { id: 'resource', code: 'resource', name: '资料互助' },
]

const sortOptions = [
  { value: 'latest', label: '按最新发布' },
  { value: 'hot', label: '按热度排序' },
]

const attachmentOptions = [
  { value: 'all', label: '附件：全部' },
  { value: 'yes', label: '仅看有附件' },
  { value: 'no', label: '仅看无附件' },
]

const statusLabelMap = {
  DRAFT: '草稿',
  PENDING: '待审核',
  PUBLISHED: '已发布',
  REJECTED: '已驳回',
  OFFLINE: '已下线',
}

function parseTags(post) {
  if (Array.isArray(post.tags)) return post.tags
  if (typeof post.tags === 'string') {
    return post.tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (Array.isArray(post.tagList)) return post.tagList
  return []
}

function normalizePost(post) {
  const attachments = Array.isArray(post.attachments) ? post.attachments : []
  return {
    ...post,
    tags: parseTags(post),
    status: (post.auditStatus || post.status || 'PUBLISHED').toUpperCase(),
    contentFormat: post.contentFormat || 'plain',
    sourceFileName: post.sourceFileName || '',
    hasAttachment:
      Boolean(post.hasAttachment) ||
      Boolean(post.attachmentUrl) ||
      Boolean(post.attachmentNote) ||
      Boolean(post.fileCount) ||
      attachments.length > 0,
    attachmentCount: Number(post.attachmentCount ?? post.fileCount ?? attachments.length ?? 0),
    viewCount: post.viewCount ?? post.views ?? 0,
    commentCount: post.commentCount ?? 0,
    likeCount: post.likeCount ?? 0,
    favoriteCount: post.favoriteCount ?? post.collectCount ?? 0,
    reportCount: post.reportCount ?? 0,
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

function normalizeLiuxueMeta(meta = {}) {
  return {
    country: String(meta.country || '').trim(),
    topic: String(meta.topic || '').trim(),
    phase: String(meta.phase || '').trim(),
    targetSchool: String(meta.targetSchool || '').trim(),
    targetMajor: String(meta.targetMajor || '').trim(),
    intakeTerm: String(meta.intakeTerm || '').trim(),
    summary: String(meta.summary || '').trim(),
  }
}

function buildLiuxueMarkdownPrefix(meta) {
  const lines = [
    '## 留学信息卡',
    `- 申请国家/地区：${meta.country || '未填写'}`,
    `- 主题方向：${meta.topic || '未填写'}`,
    `- 申请阶段：${meta.phase || '未填写'}`,
  ]
  if (meta.targetSchool) lines.push(`- 目标院校：${meta.targetSchool}`)
  if (meta.targetMajor) lines.push(`- 专业方向：${meta.targetMajor}`)
  if (meta.intakeTerm) lines.push(`- 入学季：${meta.intakeTerm}`)
  if (meta.summary) lines.push(`- 经验摘要：${meta.summary}`)
  return `${lines.join('\n')}\n\n---\n\n`
}

export default function CommunityPage() {
  const { isAuthed, user, token } = useAuth()
  const [categories, setCategories] = useState(defaultCategories)
  const [posts, setPosts] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [filters, setFilters] = useState({
    keyword: '',
    sort: 'latest',
    hasAttachment: 'all',
    tag: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState('')

  async function loadPosts(nextCategory = activeCategory, nextFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const [categoryData, postData] = await Promise.all([
        communityApi.categories(),
        communityApi.posts({
          category: nextCategory || undefined,
          keyword: nextFilters.keyword || undefined,
          sort: nextFilters.sort,
          tag: nextFilters.tag || undefined,
          hasAttachment:
            nextFilters.hasAttachment === 'all'
              ? undefined
              : nextFilters.hasAttachment === 'yes',
        }, token),
      ])

      setCategories(categoryData?.length ? categoryData : defaultCategories)
      setPosts((postData.content || postData || []).map(normalizePost))
    } catch (requestError) {
      setError(requestError.message || '加载社区失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const availableTags = useMemo(() => {
    const tagSet = new Set(['复试节奏', '资料分享', '岗位信息', '报名笔记', '模拟面试'])
    posts.forEach((postItem) => {
      postItem.tags.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).slice(0, 12)
  }, [posts])

  const communityMetrics = useMemo(() => ({
    postCount: posts.length,
    attachmentCount: posts.filter((postItem) => postItem.hasAttachment).length,
    pendingCount: posts.filter((postItem) => postItem.status === 'PENDING').length,
    reportCount: posts.reduce((sum, postItem) => sum + postItem.reportCount, 0),
  }), [posts])

  async function handleCreatePost(form) {
    if (!isAuthed || !user) {
      setPostError('请先登录后发布')
      return
    }

    setPostError('')
    setPosting(true)
    try {
      const isLiuxue = String(form.categoryCode || '').toLowerCase() === 'liuxue'
      const liuxueMeta = normalizeLiuxueMeta(form.studyAbroadMeta || {})

      const payload = new FormData()
      payload.append('title', form.title.trim())
      payload.append('categoryCode', form.categoryCode)
      payload.append('visibility', form.visibility)
      payload.append('anonymous', String(Boolean(form.anonymous)))
      payload.append('hasAttachment', String(Boolean(form.hasAttachment)))
      payload.append('attachmentNote', form.attachmentNote?.trim() || '')
      payload.append('status', form.submitAction === 'draft' ? 'DRAFT' : 'PENDING')

      let markdownContent = form.markdownContent || ''
      if (isLiuxue) {
        markdownContent = `${buildLiuxueMarkdownPrefix(liuxueMeta)}${markdownContent}`.trim()
      }
      payload.append('content', markdownContent)
      if (form.markdownFile) {
        payload.append('markdownFile', form.markdownFile)
      }

      const derivedLiuxueTags = isLiuxue
        ? [liuxueMeta.country, liuxueMeta.topic, liuxueMeta.phase].filter(Boolean)
        : []

      const mergedTags = [...form.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean), ...derivedLiuxueTags]
      mergedTags.forEach((tag) => payload.append('tags', tag))

      if (Array.isArray(form.attachments) && form.attachments.length) {
        form.attachments.forEach((file) => {
          payload.append('attachments', file)
        })
      }

      await communityApi.createPost(payload, token)
      await loadPosts()
      setIsComposerOpen(false)
    } catch (requestError) {
      setPostError(requestError.message || '发帖失败')
    } finally {
      setPosting(false)
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    const nextFilters = { ...filters, keyword: keywordInput.trim() }
    setFilters(nextFilters)
    await loadPosts(activeCategory, nextFilters)
  }

  async function handleCategoryChange(code) {
    setActiveCategory(code)
    await loadPosts(code, filters)
  }

  async function handleFilterChange(name, value) {
    const nextFilters = { ...filters, [name]: value }
    setFilters(nextFilters)
    await loadPosts(activeCategory, nextFilters)
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">社区</p>
            <h2>公开浏览 + 登录互动 + 审核发布</h2>
            <p className="muted">支持上传 Markdown 正文并附带学习资料附件，系统会自动进入审核流。</p>
          </div>

          <div className="grid-two">
            <div className="feature-card">
              <div className="card-title">搜索与筛选</div>
              <form className="search-row" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="搜索帖子标题或正文关键词"
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                />
                <button className="btn primary small" type="submit">搜索</button>
              </form>

              <div className="tag-row">
                <button
                  className={`tag tag-btn ${activeCategory === '' ? 'selected' : ''}`}
                  onClick={() => handleCategoryChange('')}
                  type="button"
                >
                  全部分类
                </button>
                {categories.map((item) => (
                  <button
                    className={`tag tag-btn ${activeCategory === item.code ? 'selected' : ''}`}
                    key={item.id || item.code}
                    onClick={() => handleCategoryChange(item.code)}
                    type="button"
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="filter-grid">
                <label className="field">
                  <span>排序方式</span>
                  <select
                    value={filters.sort}
                    onChange={(event) => handleFilterChange('sort', event.target.value)}
                  >
                    {sortOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>附件筛选</span>
                  <select
                    value={filters.hasAttachment}
                    onChange={(event) => handleFilterChange('hasAttachment', event.target.value)}
                  >
                    {attachmentOptions.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="tag-row">
                <span className="muted">热门标签：</span>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag tag-btn ${filters.tag === tag ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('tag', filters.tag === tag ? '' : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="feature-card highlight">
              <div className="card-title">社区态势</div>
              <div className="mini-grid">
                <div className="mini-card">
                  <div className="mini-value">{communityMetrics.postCount}</div>
                  <div className="mini-label">当前帖子</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{communityMetrics.attachmentCount}</div>
                  <div className="mini-label">附件帖子</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{communityMetrics.pendingCount}</div>
                  <div className="mini-label">待审核</div>
                </div>
                <div className="mini-card">
                  <div className="mini-value">{communityMetrics.reportCount}</div>
                  <div className="mini-label">举报总数</div>
                </div>
              </div>
              <p className="muted">
                {isAuthed
                  ? '你可以上传 Markdown 发帖、评论、点赞、收藏和举报。'
                  : '当前为游客模式：仅可浏览公开内容，登录后可参与互动。'}
              </p>
              <button className="btn primary" type="button" onClick={() => setIsComposerOpen(true)}>
                发布帖子
              </button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <p className="eyebrow">帖子列表</p>
            <h2>社区内容</h2>
            {error ? <div className="error-text">{error}</div> : null}
          </div>

          {loading ? (
            <div className="feature-card">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="feature-card">
              <div className="card-title">暂无匹配内容</div>
              <p className="muted">你可以调整筛选条件，或者发布第一篇相关帖子。</p>
            </div>
          ) : (
            <div className="track-grid">
              {posts.map((post) => (
                <article className="track-card" key={post.id}>
                  <div className="track-head">
                    <h3>{post.title}</h3>
                    <span className="tag subtle">{post.category?.name || post.category?.code || '社区'}</span>
                  </div>

                  <div className="tag-row">
                    <span className="tag subtle">{statusLabelMap[post.status] || '已发布'}</span>
                    <span className="tag subtle">
                      {post.visibility === 'members' ? '仅注册用户可见' : '公开可见'}
                    </span>
                    {post.contentFormat === 'markdown' ? <span className="tag subtle">Markdown</span> : null}
                    {post.anonymous ? <span className="tag subtle">匿名发布</span> : null}
                    {post.hasAttachment ? <span className="tag subtle">含附件（{post.attachmentCount}）</span> : null}
                  </div>

                  {post.tags.length ? (
                    <div className="tag-row">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span className="tag subtle" key={`${post.id}-${tag}`}>#{tag}</span>
                      ))}
                    </div>
                  ) : null}

                  <p className="muted">{createPlainPreview(post.content).slice(0, 110)}...</p>

                  <div className="metric-row">
                    <span>浏览 {post.viewCount}</span>
                    <span>评论 {post.commentCount}</span>
                    <span>点赞 {post.likeCount}</span>
                    <span>收藏 {post.favoriteCount}</span>
                    <span>举报 {post.reportCount}</span>
                  </div>

                  <div className="panel-footer">
                    <span>{post.sourceFileName || (post.anonymous ? '匿名用户' : `作者 ID: ${post.authorId}`)}</span>
                    <span>{post.createdAt?.replace('T', ' ').slice(0, 16)}</span>
                  </div>

                  <Link className="btn outline small" to={`/community/${post.id}`}>进入详情</Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <PostComposerModal
        key={`${isComposerOpen ? 'open' : 'closed'}-${categories.map((item) => item.code).join('-')}`}
        open={isComposerOpen}
        onClose={() => {
          setPostError('')
          setIsComposerOpen(false)
        }}
        categories={categories}
        onSubmit={handleCreatePost}
        submitting={posting}
        error={postError}
      />
      <Footer />
    </div>
  )
}
