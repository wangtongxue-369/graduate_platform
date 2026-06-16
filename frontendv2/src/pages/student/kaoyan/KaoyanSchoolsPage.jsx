import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaoyanApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import KaoyanSchoolCompareModal from '@/components/kaoyan/KaoyanSchoolCompareModal.jsx'
import KaoyanSchoolFilterSidebar from '@/components/kaoyan/KaoyanSchoolFilterSidebar.jsx'
import KaoyanSchoolLedgerTable from '@/components/kaoyan/KaoyanSchoolLedgerTable.jsx'
import {
  buildSchoolLedgerRows,
  createKaoyanSchoolLedgerFilters,
  createKaoyanSchoolPreviewRows,
  paginateSchoolLedgerRows,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const majorCategoryFallbackOptions = [
  '哲学', '经济学', '法学', '教育学', '文学', '历史学',
  '理学', '工学', '农学', '医学', '军事学', '管理学', '艺术学',
]

const yearFallbackOptions = ['2026', '2025', '2024', '2023', '2022', '2021', '2020']

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))]
}

function buildFilterOptions(rows, schools = []) {
  return {
    regionOptions: uniqueValues([
      ...rows.flatMap((item) => [item.region, item.province]),
      ...schools.flatMap((item) => [item.region, item.province]),
    ]),
    majorCategoryOptions: uniqueValues([
      ...majorCategoryFallbackOptions,
      ...rows.map((item) => item.majorCategory),
    ]),
    yearOptions: uniqueValues([
      ...yearFallbackOptions,
      ...rows.map((item) => item.year),
    ]),
  }
}

export default function KaoyanSchoolsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const previewRows = createKaoyanSchoolPreviewRows()
  const previewPage = paginateSchoolLedgerRows(previewRows, { page: 0, pageSize: 10 })
  const [draftFilters, setDraftFilters] = useState(createKaoyanSchoolLedgerFilters())
  const [appliedFilters, setAppliedFilters] = useState(createKaoyanSchoolLedgerFilters())
  const [allRows, setAllRows] = useState(previewRows)
  const [rows, setRows] = useState(previewPage.pageRows)
  const [meta, setMeta] = useState({
    schoolCount: previewRows.length,
    scoreCount: previewRows.length,
    totalElements: previewPage.totalElements,
    totalPages: previewPage.totalPages,
  })
  const [filterOptions, setFilterOptions] = useState(buildFilterOptions(previewRows))
  const [notice, setNotice] = useState(previewDataNotice('择校账本'))
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [favoriteIds, setFavoriteIds] = useState(
    new Set(previewRows.filter((item) => item.favorite).map((item) => item.id)),
  )
  const [compareIds, setCompareIds] = useState([])
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [expandedRowIds, setExpandedRowIds] = useState(new Set())

  useEffect(() => {
    let active = true

    async function syncRows() {
      if (!canUseRemote) {
        const nextPreviewRows = createKaoyanSchoolPreviewRows()
        const nextPage = paginateSchoolLedgerRows(nextPreviewRows, { page, pageSize: 10 })
        if (!active) return
        if (nextPage.page !== page) {
          setPage(nextPage.page)
        }
        setAllRows(nextPreviewRows)
        setRows(nextPage.pageRows)
        setMeta({
          schoolCount: nextPreviewRows.length,
          scoreCount: nextPreviewRows.length,
          totalElements: nextPage.totalElements,
          totalPages: nextPage.totalPages,
        })
        setFilterOptions(buildFilterOptions(nextPreviewRows))
        setFavoriteIds(new Set(nextPreviewRows.filter((item) => item.favorite).map((item) => item.id)))
        setNotice(previewDataNotice('择校账本'))
        return
      }

      setLoading(true)
      try {
        const [schoolsData, scoreLinesData] = await withRequestTimeout(
          Promise.all([
            kaoyanApi.schoolsPage({
              name: appliedFilters.schoolName.trim(),
              region: appliedFilters.region.trim(),
              is985: appliedFilters.is985,
              is211: appliedFilters.is211,
              isDoubleFirstClass: appliedFilters.isDoubleFirstClass,
              size: 100,
            }),
            kaoyanApi.scoreLinesPage({
              schoolName: appliedFilters.schoolName.trim(),
              majorCategory: appliedFilters.majorCategory.trim(),
              majorName: appliedFilters.majorName.trim(),
              year: appliedFilters.year.trim(),
              size: 100,
            }),
          ]),
          8000,
          '择校账本数据读取超时，请检查后端服务。',
        )

        const merged = buildSchoolLedgerRows(schoolsData, scoreLinesData, appliedFilters)
        const nextPage = paginateSchoolLedgerRows(merged.rows, { page, pageSize: 10 })
        if (!active) return
        if (nextPage.page !== page) {
          setPage(nextPage.page)
        }

        setAllRows(merged.rows)
        setRows(nextPage.pageRows)
        setMeta({
          schoolCount: merged.schoolCount,
          scoreCount: merged.rows.length,
          totalElements: nextPage.totalElements,
          totalPages: nextPage.totalPages,
        })
        setFilterOptions(buildFilterOptions(merged.rows, schoolsData?.content || []))
        setNotice(remoteDataNotice('择校账本'))
      } catch (error) {
        const nextPreviewRows = createKaoyanSchoolPreviewRows()
        const nextPage = paginateSchoolLedgerRows(nextPreviewRows, { page: 0, pageSize: 10 })
        if (!active) return
        if (page !== nextPage.page) {
          setPage(nextPage.page)
        }
        setAllRows(nextPreviewRows)
        setRows(nextPage.pageRows)
        setMeta({
          schoolCount: nextPreviewRows.length,
          scoreCount: nextPreviewRows.length,
          totalElements: nextPage.totalElements,
          totalPages: nextPage.totalPages,
        })
        setFilterOptions(buildFilterOptions(nextPreviewRows))
        setFavoriteIds(new Set(nextPreviewRows.filter((item) => item.favorite).map((item) => item.id)))
        setNotice(fallbackDataNotice('择校账本', error))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    syncRows()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, page])

  useEffect(() => {
    let active = true

    async function syncFavorites() {
      if (!canUseRemote || !token) {
        return
      }

      try {
        const data = await kaoyanApi.favoriteScoreLines(token)
        if (!active) return
        setFavoriteIds(new Set((data || []).map((item) => item.id)))
      } catch {
        if (!active) return
        setFavoriteIds(new Set())
      }
    }

    syncFavorites()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  function handleDraftFilterChange(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  function handleApplyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
    setPage(0)
    setCompareIds([])
    setCompareModalOpen(false)
    setExpandedRowIds(new Set())
  }

  function handleClearFilters() {
    const empty = createKaoyanSchoolLedgerFilters()
    setDraftFilters(empty)
    setAppliedFilters(empty)
    setPage(0)
    setCompareIds([])
    setCompareModalOpen(false)
    setExpandedRowIds(new Set())
  }

  function handleToggleCompare(rowId) {
    setCompareIds((current) => {
      if (current.includes(rowId)) {
        return current.filter((item) => item !== rowId)
      }
      if (current.length >= 5) {
        setNotice('最多同时对比 5 条分数线记录。')
        return current
      }
      return [...current, rowId]
    })
  }

  function handleToggleExpand(rowId) {
    setExpandedRowIds((current) => {
      const next = new Set(current)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  async function handleToggleFavorite(row) {
    if (!canUseRemote || !token) {
      setNotice('请先登录后再收藏分数线。')
      return
    }

    const isFavorite = favoriteIds.has(row.id)
    try {
      if (isFavorite) {
        await kaoyanApi.unfavoriteScoreLine(row.id, token)
        setFavoriteIds((current) => {
          const next = new Set(current)
          next.delete(row.id)
          return next
        })
      } else {
        await kaoyanApi.favoriteScoreLine(row.id, token)
        setFavoriteIds((current) => new Set([...current, row.id]))
      }
    } catch (error) {
      setNotice(error.message || '收藏状态更新失败')
    }
  }

  function handleRemoveCompare(rowId) {
    setCompareIds((current) => current.filter((item) => item !== rowId))
  }

  const compareRows = allRows.filter((item) => compareIds.includes(item.id))
  const emptyMessage = meta.schoolCount > 0 && meta.totalElements === 0
    ? '已命中院校档案，但暂无可比较分数线数据。'
    : '当前筛选下没有可比较的分数线结果。'

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="择校账本"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '择校账本' },
          ]}
          title="择校账本"
          lead="选对方向，比埋头赶路更重要。"
          actions={<Link className="v2-secondary-link" to="/station/kaoyan/schools/favorites">查看收藏账本</Link>}
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-summary-strip" aria-label="择校账本摘要">
          <article className="v2-summary-card">
            <span>院校档案命中</span>
            <strong>{meta.schoolCount}</strong>
            <p>院校侧筛选命中的基础档案数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>分数线结果</span>
            <strong>{meta.totalElements}</strong>
            <p>当前真正可比较的分数线记录数。</p>
          </article>
          <article className="v2-summary-card">
            <span>已选对比</span>
            <strong>{compareIds.length}</strong>
            <p>{appliedFilters.year || '全部年份'} / {appliedFilters.majorCategory || '全部门类'}</p>
          </article>
        </section>

        {compareIds.length >= 2 ? (
          <div className="v2-inline-actions">
            <button className="v2-segment-button is-active" type="button" onClick={() => setCompareModalOpen(true)}>
              对比 {compareIds.length} 项
            </button>
          </div>
        ) : null}

        {loading ? <div className="v2-status-note">正在刷新择校账本…</div> : null}

        <KaoyanSchoolLedgerTable
          rows={rows}
          compareIds={compareIds}
          expandedRowIds={expandedRowIds}
          favoriteIds={favoriteIds}
          page={page}
          totalPages={meta.totalPages}
          totalElements={meta.totalElements}
          emptyMessage={emptyMessage}
          onToggleCompare={handleToggleCompare}
          onToggleExpand={handleToggleExpand}
          onToggleFavorite={handleToggleFavorite}
          onPageChange={setPage}
        />
      </div>

      <aside className="v2-side-column">
        <KaoyanSchoolFilterSidebar
          draftFilters={draftFilters}
          regionOptions={filterOptions.regionOptions}
          majorCategoryOptions={filterOptions.majorCategoryOptions}
          yearOptions={filterOptions.yearOptions}
          onChange={handleDraftFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      </aside>

      {compareModalOpen && compareRows.length >= 2 ? (
        <KaoyanSchoolCompareModal
          rows={compareRows}
          onClose={() => setCompareModalOpen(false)}
          onRemove={handleRemoveCompare}
        />
      ) : null}
    </>
  )
}
