import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsPosts } from '@/lib/settingsPreview.js'

const postsPerPage = 4

function normalizeFilterText(value) {
  return String(value || '').trim().toLowerCase()
}

export default function SettingsPostsPage() {
  const { token } = useAuth()
  const [posts, setPosts] = useState(createSettingsPosts())
  const [notice, setNotice] = useState('发帖：预览数据')
  const [nameFilter, setNameFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') return

      try {
        const data = await userApi.myPosts(0, 8, token)
        if (!active) return
        setPosts(data?.content?.length ? data.content : [])
        setNotice('')
      } catch (error) {
        if (!active) return
        setNotice(error.message || '发帖记录暂时不可用，已切换到预览数据。')
      }
    }

    load()

    return () => {
      active = false
    }
  }, [token])

  const directionOptions = useMemo(() => (
    Array.from(new Set(posts.map((post) => String(post.category || '').trim()).filter(Boolean)))
  ), [posts])

  const filteredPosts = useMemo(() => (
    posts.filter((post) => {
      const matchesName = !nameFilter
        || normalizeFilterText(post.title).includes(normalizeFilterText(nameFilter))
      const matchesDirection = !directionFilter || String(post.category || '') === directionFilter

      return matchesName && matchesDirection
    })
  ), [directionFilter, nameFilter, posts])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage))
  const safePage = Math.min(currentPage, totalPages - 1)
  const pageStart = safePage * postsPerPage
  const paginatedPosts = filteredPosts.slice(pageStart, pageStart + postsPerPage)
  const hasActiveFilters = Boolean(nameFilter.trim() || directionFilter)

  useEffect(() => {
    setCurrentPage(0)
  }, [directionFilter, nameFilter])

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0))
    }
  }, [currentPage, totalPages])

  function resetFilters() {
    setNameFilter('')
    setDirectionFilter('')
  }

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages) return
    setCurrentPage(nextPage)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="my posts"
          pathItems={[
            { label: '个人设置', to: '/settings/profile' },
            { label: '我的发帖' },
          ]}
          title="我的发帖"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        {filteredPosts.length ? (
          <>
            <section className="v2-feed-list" aria-label="我的发帖列表">
              {paginatedPosts.map((post) => (
                <Link className="v2-feed-item" key={post.id} to={`/settings/posts/${post.id}/edit`}>
                  <div className="v2-feed-index">P</div>
                  <div className="v2-feed-body">
                    <strong>{post.title}</strong>
                    <p>{post.category || '未分类'} / {post.status || 'draft'}</p>
                  </div>
                  <span className="v2-feed-action">
                    {String(post.createdAt || '').slice(5, 10) || '查看'}
                  </span>
                </Link>
              ))}
            </section>

            <section className="v2-pagination-row" aria-label="我的发帖分页">
              <button
                className="v2-secondary-link"
                disabled={safePage <= 0}
                onClick={() => changePage(safePage - 1)}
                type="button"
              >
                上一页
              </button>
              <span className="v2-pagination-note">
                第 {safePage + 1} / {totalPages} 页
              </span>
              <button
                className="v2-secondary-link"
                disabled={safePage >= totalPages - 1}
                onClick={() => changePage(safePage + 1)}
                type="button"
              >
                下一页
              </button>
            </section>
          </>
        ) : (
          <section className="v2-article-card" aria-label="我的发帖空状态">
            <h3>没找到匹配的帖子</h3>
            <p>
              {hasActiveFilters
                ? '可以清空筛选条件，或换一个名称与方向再试。'
                : '当前还没有可管理的帖子记录。'}
            </p>
            {hasActiveFilters ? (
              <div className="v2-inline-actions">
                <button className="v2-secondary-link" onClick={resetFilters} type="button">
                  清空筛选
                </button>
              </div>
            ) : null}
          </section>
        )}
      </div>

      <aside className="v2-side-column" aria-label="我的发帖筛选器">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选器</p>
          <h3>先缩小范围再编辑</h3>

          <div className="v2-filter-form">
            <label className="v2-field">
              <span>名称</span>
              <input
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="按帖子名称筛选"
                type="text"
                value={nameFilter}
              />
            </label>

            <label className="v2-field">
              <span>方向</span>
              <select
                onChange={(event) => setDirectionFilter(event.target.value)}
                value={directionFilter}
              >
                <option value="">全部方向</option>
                {directionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="v2-inline-actions">
              <button className="v2-secondary-link" onClick={resetFilters} type="button">
                重置筛选
              </button>
            </div>
          </div>

          <p className="v2-note-text">
            当前页显示 {paginatedPosts.length} / {filteredPosts.length} 篇结果，共 {posts.length} 篇帖子。
          </p>
        </section>
      </aside>
    </>
  )
}
