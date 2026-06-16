import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { materialApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createKaoyanMaterialPreviewRows,
  filterMaterialRows,
  materialTypeOptions,
  materialYearOptions,
  normalizeMaterialRows,
  paginateRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const previewMaterialRows = createKaoyanMaterialPreviewRows()

function createMaterialFilters() {
  return {
    keyword: '',
    school: '',
    major: '',
    subject: '',
    year: '',
    materialType: '',
  }
}

function statusLabel(status) {
  return {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }[status] || status || '未知状态'
}

function truncateText(value, maxLength = 84) {
  const text = String(value || '').trim()
  if (!text) return '暂无资料说明。'
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export default function KaoyanMaterialsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [draftFilters, setDraftFilters] = useState(createMaterialFilters())
  const [appliedFilters, setAppliedFilters] = useState(createMaterialFilters())
  const [rows, setRows] = useState(previewMaterialRows.slice(0, 10))
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalElements, setTotalElements] = useState(previewMaterialRows.length)
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(previewMaterialRows.length / 10)))
  const [notice, setNotice] = useState(previewDataNotice('资料中枢'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRows() {
      if (!canUseRemote) {
        const filtered = filterMaterialRows(previewMaterialRows, appliedFilters)
        const paged = paginateRows(filtered, { page, size: pageSize })
        if (!active) return
        setRows(paged.pageRows)
        setTotalElements(paged.totalElements)
        setTotalPages(paged.totalPages)
        setNotice(previewDataNotice('资料中枢'))
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          materialApi.listPage({
            keyword: appliedFilters.keyword.trim(),
            school: appliedFilters.school.trim(),
            major: appliedFilters.major.trim(),
            subject: appliedFilters.subject.trim(),
            year: appliedFilters.year,
            materialType: appliedFilters.materialType,
            page,
            size: pageSize,
          }),
          8000,
          '资料中枢读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeMaterialRows(data))
        setTotalElements(Number(data?.totalElements || 0))
        setTotalPages(Math.max(1, Number(data?.totalPages || 1)))
        setNotice(remoteDataNotice('资料中枢'))
      } catch (error) {
        if (!active) return
        const filtered = filterMaterialRows(previewMaterialRows, appliedFilters)
        const paged = paginateRows(filtered, { page, size: pageSize })
        setRows(paged.pageRows)
        setTotalElements(paged.totalElements)
        setTotalPages(paged.totalPages)
        setNotice(fallbackDataNotice('资料中枢', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRows()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, page, pageSize])

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(0)
    setAppliedFilters({
      ...draftFilters,
    })
  }

  function resetFilters() {
    const nextFilters = createMaterialFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  function changePage(nextPage) {
    setPage(nextPage)
  }

  const hasActiveFilters = Object.values(appliedFilters).some((value) => String(value || '').trim() !== '')

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="资料中枢"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '资料中枢' },
          ]}
          title="资料中枢"
          lead="前人栽树，后人乘凉。"
          actions={(
            <>
              <Link className="v2-secondary-link" to="/station/kaoyan/materials/upload">上传资料</Link>
              <Link className="v2-secondary-link" to="/station/kaoyan/materials/mine">我的资料</Link>
            </>
          )}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新资料列表…</div> : null}

        <section className="v2-side-card" aria-label="资料查询结果">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">查询结果</p>
              <h3>公开资料列表</h3>
            </div>
            <span className="v2-plan-status-pill">{`共 ${totalElements} 条`}</span>
          </div>

          {hasActiveFilters ? (
            <div className="v2-tag-row">
              {appliedFilters.keyword ? <span>关键词 {appliedFilters.keyword}</span> : null}
              {appliedFilters.school ? <span>院校 {appliedFilters.school}</span> : null}
              {appliedFilters.major ? <span>专业 {appliedFilters.major}</span> : null}
              {appliedFilters.subject ? <span>科目 {appliedFilters.subject}</span> : null}
              {appliedFilters.year ? <span>年份 {appliedFilters.year}</span> : null}
              {appliedFilters.materialType ? <span>类型 {appliedFilters.materialType}</span> : null}
            </div>
          ) : null}

          <div className="v2-ledger-card">
            {rows.map((item) => (
              <article className="v2-ledger-row v2-ledger-row--material" key={item.id}>
                <div className="v2-ledger-row__main">
                  <strong>{item.title}</strong>
                  <p>{truncateText(item.description)}</p>
                  <div className="v2-tag-row">
                    <span>{statusLabel(item.status)}</span>
                    <span>{item.school}</span>
                    <span>{item.major}</span>
                    <span>{item.subject}</span>
                    <span>{item.year}</span>
                    <span>{item.materialType}</span>
                  </div>
                </div>
                <div className="v2-ledger-row__meta">
                  <span>{`附件 ${item.attachments?.length || 0}`}</span>
                  <span>{`浏览 ${item.viewCount || 0}`}</span>
                  <span>{`下载 ${item.downloadCount || 0}`}</span>
                </div>
                <div className="v2-ledger-row__actions">
                  <Link className="v2-secondary-link" to={`/station/kaoyan/materials/${item.id}`}>
                    查看详情
                  </Link>
                </div>
              </article>
            ))}
            {!rows.length ? (
              <article className="v2-empty-card">
                <p>当前筛选条件下暂无相关资料，可以调整右侧筛选项后再试。</p>
              </article>
            ) : null}
          </div>
        </section>

        <section className="v2-pagination-row" aria-label="资料列表分页">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || page <= 0}
            onClick={() => changePage(page - 1)}
          >
            上一页
          </button>
          <span className="v2-pagination-note">{`第 ${Math.min(page + 1, totalPages)} / ${totalPages} 页`}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={loading || page >= totalPages - 1}
            onClick={() => changePage(page + 1)}
          >
            下一页
          </button>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选器</p>
          <form className="v2-filter-form" onSubmit={handleSearch}>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={draftFilters.keyword}
                onChange={(event) => updateDraftFilter('keyword', event.target.value)}
              />
            </label>
            <label className="v2-field">
              <span>院校</span>
              <input
                type="text"
                value={draftFilters.school}
                onChange={(event) => updateDraftFilter('school', event.target.value)}
              />
            </label>
            <label className="v2-field">
              <span>专业</span>
              <input
                type="text"
                value={draftFilters.major}
                onChange={(event) => updateDraftFilter('major', event.target.value)}
              />
            </label>
            <label className="v2-field">
              <span>科目</span>
              <input
                type="text"
                value={draftFilters.subject}
                onChange={(event) => updateDraftFilter('subject', event.target.value)}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <select
                value={draftFilters.year}
                onChange={(event) => updateDraftFilter('year', event.target.value)}
              >
                <option value="">全部</option>
                {materialYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>资料类型</span>
              <select
                value={draftFilters.materialType}
                onChange={(event) => updateDraftFilter('materialType', event.target.value)}
              >
                <option value="">全部</option>
                {materialTypeOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">查询</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>清空</button>
            </div>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">快捷入口</p>
          <div className="v2-side-action-stack">
            <Link className="v2-secondary-link" to="/station/kaoyan/materials/upload">上传新资料</Link>
            <Link className="v2-secondary-link" to="/station/kaoyan/materials/mine">查看我的资料</Link>
          </div>
        </section>
      </aside>
    </>
  )
}
