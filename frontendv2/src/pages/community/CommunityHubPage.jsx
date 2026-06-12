import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { communityApi } from '@legacy/lib/api.js'
import CommunityFilterPanel from '@/components/community/CommunityFilterPanel.jsx'
import CommunityPostCard from '@/components/community/CommunityPostCard.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import SubnavTabs from '@/components/SubnavTabs.jsx'
import {
  canUseCommunityPreview,
  createCommunityPreviewCategories,
  createCommunityPreviewPosts,
  shouldForceCommunityPreview,
} from '@/lib/communityPreview.js'
import {
  buildCommunityReturnTo,
  buildSearchParams,
  communitySortOptions,
  extractPagePayload,
  fallbackCommunityCategories,
  normalizeCommunityCategory,
  normalizeCommunityPost,
} from '@/lib/communityUi.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const communityTabs = [
  { label: '社区目录', to: '/community', end: true, note: '浏览与筛选' },
  { label: '发布帖子', to: '/community/new', note: '提交正文与附件' },
  { label: '消息通知', to: '/community/notifications', note: '查看互动提醒' },
]

const pageSize = 8

function toAttachmentFilterValue(value) {
  if (value === 'yes') return true
  if (value === 'no') return false
  return undefined
}

function buildPreviewPage(items, page) {
  const safePage = Number(page || 0)
  const start = safePage * pageSize
  const end = start + pageSize
  const content = items.slice(start, end)

  return {
    content,
    page: safePage,
    size: pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    totalElements: items.length,
  }
}

export default function CommunityHubPage() {
  const { isAuthed, token } = useAuth()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState(fallbackCommunityCategories)
  const [pageState, setPageState] = useState(() => extractPagePayload([]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '')

  const activeCategory = searchParams.get('category') || ''
  const activeSort = searchParams.get('sort') || 'latest'
  const activeKeyword = searchParams.get('keyword') || ''
  const activeTag = searchParams.get('tag') || ''
  const activeAttachment = searchParams.get('hasAttachment') || 'all'
  const activePage = Number(searchParams.get('page') || 0)
  const isForcedPreview = shouldForceCommunityPreview(token)
  const returnTo = buildCommunityReturnTo(location.pathname, location.search)

  useEffect(() => {
    setKeywordInput(activeKeyword)
  }, [activeKeyword])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setNotice('')

      function applyPreview(previewMessage) {
        const previewCategories = createCommunityPreviewCategories().map(normalizeCommunityCategory)
        const previewItems = createCommunityPreviewPosts({
          category: activeCategory || undefined,
          keyword: activeKeyword || undefined,
          sort: activeSort,
          tag: activeTag || undefined,
          hasAttachment: toAttachmentFilterValue(activeAttachment),
        }).map((item) => normalizeCommunityPost(item))

        if (!active) return
        setCategories(previewCategories.length ? previewCategories : fallbackCommunityCategories)
        setPageState(buildPreviewPage(previewItems, activePage))
        setNotice(previewMessage)
      }

      if (isForcedPreview) {
        applyPreview('当前使用演示社区数据，适合观察布局与交互层次。')
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
              tag: activeTag || undefined,
              hasAttachment: toAttachmentFilterValue(activeAttachment),
              page: activePage,
              size: pageSize,
            }, token),
          ]),
          8000,
          '社区目录请求超时，请检查后端服务是否正常启动。',
        )

        if (!active) return
        setCategories((categoryData || []).map(normalizeCommunityCategory))
        setPageState({
          ...extractPagePayload(postData),
          content: extractPagePayload(postData).content.map((item) => normalizeCommunityPost(item)),
        })
      } catch (requestError) {
        if (!active) return
        if (canUseCommunityPreview()) {
          applyPreview('后端未返回社区目录，已自动切换到演示数据。')
        } else {
          setCategories(fallbackCommunityCategories)
          setError(requestError.message || '社区目录加载失败，请稍后再试。')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [
    activeAttachment,
    activeCategory,
    activeKeyword,
    activePage,
    activeSort,
    activeTag,
    isForcedPreview,
    token,
  ])

  const posts = pageState.content

  const summaryCards = useMemo(() => {
    const attachmentCount = posts.filter((post) => post.hasAttachment).length
    const discussionHeat = posts.reduce((sum, post) => sum + post.commentCount + post.likeCount, 0)

    return [
      {
        label: '当前结果',
        value: String(pageState.totalElements).padStart(2, '0'),
        note: activeCategory ? '已缩小到单个分类' : '正在浏览全站社区目录',
      },
      {
        label: '附件帖子',
        value: String(attachmentCount).padStart(2, '0'),
        note: '适合资料互助与经验沉淀',
      },
      {
        label: '互动热度',
        value: String(discussionHeat).padStart(2, '0'),
        note: '按评论与点赞综合估算',
      },
    ]
  }, [activeCategory, pageState.totalElements, posts])

  const hotTags = useMemo(() => {
    const tagMap = new Map()
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1)
      })
    })
    return Array.from(tagMap.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([tag]) => tag)
  }, [posts])

  const highlights = useMemo(() => (
    posts.slice(0, 4).map((post) => ({
      id: post.id,
      title: post.title,
      note: `${post.category?.name || '社区'} · 评论 ${post.commentCount} · 点赞 ${post.likeCount}`,
    }))
  ), [posts])

  function updateQuery(patch) {
    const nextParams = buildSearchParams(searchParams, patch)
    if (!Object.prototype.hasOwnProperty.call(patch, 'page')) {
      nextParams.set('page', '0')
    }
    setSearchParams(nextParams)
  }

  function handleSearch(event) {
    event.preventDefault()
    updateQuery({ keyword: keywordInput.trim(), page: 0 })
  }

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= pageState.totalPages) return
    updateQuery({ page: nextPage })
  }

  function resetFilters() {
    setKeywordInput('')
    setSearchParams(buildSearchParams(searchParams, {
      category: '',
      keyword: '',
      tag: '',
      hasAttachment: '',
      sort: 'latest',
      page: 0,
    }))
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="社区"
          title="先筛目录，再进入单篇帖子处理内容。"
          lead={isAuthed
            ? '登录后可直接从目录进入发帖、通知与评论互动。'
            : '游客只浏览公开社区内容，登录后再进入发帖与互动流程。'}
          actions={(
            <>
              <Link className="v2-primary-link" to="/community/new">发布帖子</Link>
              <Link className="v2-secondary-link" to="/community/notifications">消息通知</Link>
            </>
          )}
        />

        <SubnavTabs items={communityTabs} />

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
              <p>先缩小范围，再进入具体帖子。</p>
            </div>
            <div className="v2-chip-group">
              <button
                className={`v2-filter-chip ${activeCategory === '' ? 'is-active' : ''}`}
                type="button"
                onClick={() => updateQuery({ category: '', page: 0 })}
              >
                全部
              </button>
              {categories.map((item) => (
                <button
                  key={item.id || item.code}
                  className={`v2-filter-chip ${activeCategory === item.code ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => updateQuery({ category: item.code, page: 0 })}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="v2-toolbar-row">
            <div className="v2-toolbar-copy">
              <strong>排序方式</strong>
              <p>最新和热度分开看，避免把结果堆成一团。</p>
            </div>
            <div className="v2-segment-group">
              {communitySortOptions.map((item) => (
                <button
                  key={item.value}
                  className={`v2-segment-button ${activeSort === item.value ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => updateQuery({ sort: item.value, page: 0 })}
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
              <CommunityPostCard key={post.id} post={post} returnTo={returnTo} />
            ))}
          </section>
        ) : (
          <div className="v2-article-card">
            <p>当前筛选条件下还没有帖子，可以换个分类或关键词再试。</p>
            <button
              className="v2-secondary-link"
              type="button"
              aria-label="reset-filters"
              onClick={resetFilters}
            >
              重置筛选
            </button>
          </div>
        )}

        <section className="v2-pagination-row" aria-label="社区列表分页">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || activePage <= 0}
            onClick={() => changePage(activePage - 1)}
          >
            上一页
          </button>
          <span className="v2-pagination-note">
            第 {Math.min(activePage + 1, Math.max(pageState.totalPages, 1))} / {Math.max(pageState.totalPages, 1)} 页
          </span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || activePage >= pageState.totalPages - 1}
            onClick={() => changePage(activePage + 1)}
          >
            下一页
          </button>
        </section>
      </div>

      <aside className="v2-side-column">
        <CommunityFilterPanel
          keywordInput={keywordInput}
          activeAttachment={activeAttachment}
          onKeywordChange={setKeywordInput}
          onSubmit={handleSearch}
          onAttachmentChange={(value) => updateQuery({ hasAttachment: value, page: 0 })}
        />

        {highlights.length ? (
          <section className="v2-side-card">
            <p className="v2-kicker">最近讨论重点</p>
            <div className="v2-check-list">
              {highlights.map((item) => (
                <Link className="v2-check-row" key={item.id} to={`/community/${item.id}`} state={{ returnTo }}>
                  <strong>{item.title}</strong>
                  <span>{item.note}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {hotTags.length ? (
          <section className="v2-side-card">
            <p className="v2-kicker">常见标签</p>
            <div className="v2-tag-row">
              {hotTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`v2-filter-chip ${activeTag === tag ? 'is-active' : ''}`}
                  onClick={() => updateQuery({ tag: activeTag === tag ? '' : tag, page: 0 })}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="v2-side-card">
          <p className="v2-kicker">进入方式</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>先看目录</strong>
              <span>缩小分类和关键词范围，再进入单帖。</span>
            </div>
            <div className="v2-check-row">
              <strong>再看详情</strong>
              <span>评论、附件、举报都在帖子详情页完成。</span>
            </div>
            <div className="v2-check-row">
              <strong>最后处理互动</strong>
              <span>通知页只保留消息处理，不和目录混放。</span>
            </div>
          </div>
        </section>
      </aside>
    </>
  )
}
