import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { studyAbroadApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import StudyAbroadProgramCompareRail from '@/components/studyabroad/StudyAbroadProgramCompareRail.jsx'
import StudyAbroadProgramDetailDrawer from '@/components/studyabroad/StudyAbroadProgramDetailDrawer.jsx'
import {
  studyAbroadCountryOptions,
  studyAbroadSubjectOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'
import {
  createFallbackPrograms,
  normalizeProgramsPage,
} from '@/lib/studyabroad/studyAbroadNormalizers.js'
import {
  canUseRemoteToken,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function StudyAbroadProgramsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    country: '',
    subjectArea: '',
    partnerOnly: false,
    keyword: '',
  })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState(createFallbackPrograms())
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, totalElements: createFallbackPrograms().length })
  const [notice, setNotice] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [activeProgram, setActiveProgram] = useState(null)

  useEffect(() => {
    let active = true

    async function loadPrograms() {
      if (!canUseRemote) {
        setRows(createFallbackPrograms())
        setPageInfo({ totalPages: 1, totalElements: createFallbackPrograms().length })
        setNotice('')
        return
      }

      try {
        const data = await withRequestTimeout(
          studyAbroadApi.schoolProgramsPage({
            page,
            size: 9,
            country: filters.country,
            subjectArea: filters.subjectArea,
            partnerOnly: filters.partnerOnly ? true : undefined,
            keyword: deferredKeyword,
          }),
          8000,
          '院校项目库读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeProgramsPage(data)
        setRows(normalized.content)
        setPageInfo({
          totalPages: normalized.totalPages,
          totalElements: normalized.totalElements,
        })
        setNotice('')
      } catch (error) {
        if (!active) return
        setRows(createFallbackPrograms())
        setPageInfo({ totalPages: 1, totalElements: createFallbackPrograms().length })
        setNotice('院校项目库暂时不可用，请稍后再试。')
      }
    }

    loadPrograms()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.country, filters.partnerOnly, filters.subjectArea, page, token])

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)).slice(0, 3),
    [rows, selectedIds],
  )

  function toggleCompare(id) {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= 3
          ? [...current.slice(1), id]
          : [...current, id]
    ))
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="院校项目库"
          pathItems={[
            { label: '留学总览', to: '/station/studyabroad' },
            { label: '院校项目库' },
          ]}
          title="院校项目库"
          lead="浏览可申请的海外院校和专业项目，按国家、学科和合作项目筛选，也可以加入对比后查看详细要求。"
          compact
        />
        {notice ? <div className="v2-status-note">{notice}</div> : null}
        <section className="v2-summary-strip">
          <article className="v2-summary-card">
            <span>当前页项目</span>
            <strong>{rows.length}</strong>
            <p>当前列表页里可直接进入对比的项目数。</p>
          </article>
          <article className="v2-summary-card">
            <span>已选项目</span>
            <strong>{selectedRows.length}</strong>
            <p>最多保留 3 个项目进行横向判断。</p>
          </article>
          <article className="v2-summary-card">
            <span>项目总数</span>
            <strong>{pageInfo.totalElements}</strong>
            <p>来自后端分页结果的项目条目总数。</p>
          </article>
        </section>
        <section className="v2-feed-list" aria-label="院校项目库列表">
          {rows.map((row) => {
            const selected = selectedIds.includes(row.id)
            return (
              <article className="v2-feed-item" key={row.id}>
                <div className="v2-feed-index">{row.country.slice(0, 2).toUpperCase()}</div>
                <div className="v2-feed-body">
                  <strong>{row.schoolName}</strong>
                  <p>{row.programName}</p>
                  <p>{row.subjectArea} / {row.degree} / {row.qsRank}</p>
                </div>
                <div className="v2-feed-side">
                  <button
                    aria-label={`选择 ${row.schoolName} 对比`}
                    className={`v2-segment-button ${selected ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => toggleCompare(row.id)}
                  >
                    {selected ? '已选择' : '加入对比'}
                  </button>
                  <button className="v2-secondary-link" type="button" onClick={() => setActiveProgram(row)}>查看详情</button>
                </div>
              </article>
            )
          })}
        </section>
      </div>
      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选条件</p>
              <h3>筛选院校项目</h3>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>国家 / 地区</span>
              <select value={filters.country} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, country: event.target.value })) }}>
                <option value="">全部</option>
                {studyAbroadCountryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>学科方向</span>
              <select value={filters.subjectArea} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, subjectArea: event.target.value })) }}>
                <option value="">全部</option>
                {studyAbroadSubjectOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input value={filters.keyword} onChange={(event) => { setPage(0); setFilters((current) => ({ ...current, keyword: event.target.value })) }} />
            </label>
            <button
              className={`v2-toggle-button ${filters.partnerOnly ? 'is-active' : ''}`}
              type="button"
              onClick={() => { setPage(0); setFilters((current) => ({ ...current, partnerOnly: !current.partnerOnly })) }}
            >
              {filters.partnerOnly ? '只看合作项目中' : '只看合作项目'}
            </button>
            <div className="v2-inline-actions">
              <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => Math.max(0, current - 1))}>上一页</button>
              <button className="v2-secondary-link" type="button" onClick={() => setPage((current) => (current + 1 < pageInfo.totalPages ? current + 1 : current))}>下一页</button>
            </div>
          </form>
        </section>
        <StudyAbroadProgramCompareRail
          rows={selectedRows}
          onRemove={(rowId) => setSelectedIds((current) => current.filter((id) => id !== rowId))}
        />
        <StudyAbroadProgramDetailDrawer
          open={Boolean(activeProgram)}
          row={activeProgram}
          onClose={() => setActiveProgram(null)}
        />
      </aside>
    </>
  )
}
