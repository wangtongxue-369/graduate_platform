import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsComments } from '@/lib/settingsPreview.js'

const commentsPerPage = 4

function normalizeFilterText(value) {
  return String(value || '').trim().toLowerCase()
}

export default function SettingsCommentsPage() {
  const { token } = useAuth()
  const [comments, setComments] = useState(createSettingsComments())
  const [notice, setNotice] = useState('评论：预览数据')
  const [draftPostTitleFilter, setDraftPostTitleFilter] = useState('')
  const [draftContentFilter, setDraftContentFilter] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ postTitle: '', content: '' })
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') return

      try {
        const data = await userApi.myComments(0, 8, token)
        if (!active) return
        setComments(data?.content?.length ? data.content : [])
        setNotice('')
      } catch (error) {
        if (!active) return
        setNotice(error.message || '评论记录暂时不可用，已切换到预览数据。')
      }
    }

    load()

    return () => {
      active = false
    }
  }, [token])

  const filteredComments = useMemo(() => (
    comments.filter((comment) => {
      const matchesPostTitle = !appliedFilters.postTitle
        || normalizeFilterText(comment.postTitle).includes(normalizeFilterText(appliedFilters.postTitle))
      const matchesContent = !appliedFilters.content
        || normalizeFilterText(comment.content).includes(normalizeFilterText(appliedFilters.content))

      return matchesPostTitle && matchesContent
    })
  ), [appliedFilters.content, appliedFilters.postTitle, comments])

  const totalPages = Math.max(1, Math.ceil(filteredComments.length / commentsPerPage))
  const safePage = Math.min(currentPage, totalPages - 1)
  const pageStart = safePage * commentsPerPage
  const paginatedComments = filteredComments.slice(pageStart, pageStart + commentsPerPage)
  const hasActiveFilters = Boolean(appliedFilters.postTitle.trim() || appliedFilters.content.trim())

  useEffect(() => {
    if (currentPage > totalPages - 1) {
      setCurrentPage(Math.max(totalPages - 1, 0))
    }
  }, [currentPage, totalPages])

  function applyFilters() {
    setAppliedFilters({
      postTitle: draftPostTitleFilter,
      content: draftContentFilter,
    })
    setCurrentPage(0)
  }

  function resetFilters() {
    setDraftPostTitleFilter('')
    setDraftContentFilter('')
    setAppliedFilters({ postTitle: '', content: '' })
    setCurrentPage(0)
  }

  function changePage(nextPage) {
    if (nextPage < 0 || nextPage >= totalPages) return
    setCurrentPage(nextPage)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="my comments"
          pathItems={[
            { label: '个人设置', to: '/settings/profile' },
            { label: '我的评论' },
          ]}
          title="我的评论"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        {filteredComments.length ? (
          <>
            <section className="v2-check-card">
              <div className="v2-check-list">
                {paginatedComments.map((comment) => (
                  <div className="v2-check-row" key={comment.id}>
                    <strong>{comment.postTitle || '原帖已移除'}</strong>
                    <span>{comment.content}</span>
                    <Link className="v2-inline-link" to={`/community/${comment.postId || ''}`}>回到原帖</Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="v2-pagination-row" aria-label="我的评论分页">
              <button
                className="v2-secondary-link"
                disabled={safePage <= 0}
                onClick={() => changePage(safePage - 1)}
                type="button"
              >
                上一页
              </button>
              <span className="v2-pagination-note">第 {safePage + 1} / {totalPages} 页</span>
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
          <section className="v2-article-card" aria-label="我的评论空状态">
            <h3>没找到匹配的评论</h3>
            <p>{hasActiveFilters ? '可以清空筛选条件，或换一个贴名和评论内容再试。' : '当前还没有可回看的评论记录。'}</p>
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

      <aside className="v2-side-column" aria-label="我的评论筛选器">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选器</p>
          <h3>先缩小范围再回看</h3>

          <div className="v2-filter-form">
            <label className="v2-field">
              <span>所在贴名字</span>
              <input
                type="text"
                value={draftPostTitleFilter}
                onChange={(event) => setDraftPostTitleFilter(event.target.value)}
                placeholder="按贴名筛选"
              />
            </label>

            <label className="v2-field">
              <span>评论内容</span>
              <input
                type="text"
                value={draftContentFilter}
                onChange={(event) => setDraftContentFilter(event.target.value)}
                placeholder="模糊匹配评论内容"
              />
            </label>

            <div className="v2-inline-actions">
              <button className="v2-primary-link" onClick={applyFilters} type="button">
                手动筛选
              </button>
              <button className="v2-secondary-link" onClick={resetFilters} type="button">
                重置筛选
              </button>
            </div>
          </div>

          <p className="v2-note-text">
            当前页显示 {paginatedComments.length} / {filteredComments.length} 条评论，共 {comments.length} 条评论。
          </p>
        </section>
      </aside>
    </>
  )
}
