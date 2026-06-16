import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createKaogongScorePreviewRows,
  normalizeFavoriteScoreLines,
  normalizeScoreRows,
} from '@/pages/student/kaogong/kaogongPageData.js'

const scoreJobCategoryOptions = ['', '综合管理', '行政执法', '专业技术']
const scoreUnitTypeOptions = ['', '中央机关直属机构', '地方机关', '事业单位']
const scoreExamTypeOptions = ['', '国家公务员考试', '上海市公务员考试', '浙江省公务员考试']
const scoreSortOptions = [
  { value: 'score-desc', label: '进面线从高到低' },
  { value: 'year-desc', label: '年份最新' },
  { value: 'recruit-desc', label: '招录人数最多' },
]

function createScoreFilters() {
  return {
    region: '',
    year: '',
    jobCategory: '',
    unitType: '',
    examType: '',
  }
}

export default function KaogongScoreLinesPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [draftFilters, setDraftFilters] = useState(createScoreFilters())
  const [appliedFilters, setAppliedFilters] = useState(createScoreFilters())
  const [rows, setRows] = useState(createKaogongScorePreviewRows())
  const [favoriteRows, setFavoriteRows] = useState([])
  const [notice, setNotice] = useState(previewDataNotice('分数线账本'))
  const [loading, setLoading] = useState(false)
  const [actionPendingId, setActionPendingId] = useState(null)
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false)
  const [sortMode, setSortMode] = useState('score-desc')

  useEffect(() => {
    let active = true

    async function loadScoreLines() {
      if (!canUseRemote) {
        setRows(createKaogongScorePreviewRows())
        setFavoriteRows([])
        setNotice(previewDataNotice('分数线账本'))
        return
      }

      setLoading(true)
      try {
        const [scoreData, favoriteData] = await withRequestTimeout(
          Promise.all([
            kaogongApi.scoreLinesPage({ ...appliedFilters, page: 0, size: 12 }),
            kaogongApi.favoriteScoreLines(token).catch(() => []),
          ]),
          8000,
          '分数线数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeScoreRows(scoreData, favoriteData))
        setFavoriteRows(normalizeFavoriteScoreLines(favoriteData))
        setNotice('')
      } catch (error) {
        if (!active) return
        setRows(createKaogongScorePreviewRows())
        setFavoriteRows([])
        setNotice(fallbackDataNotice('分数线账本', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadScoreLines()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, token])

  async function handleToggleFavorite(row) {
    if (!canUseRemote) return

    setActionPendingId(row.id)
    try {
      if (row.favorite) {
        await kaogongApi.unfavoriteScoreLine(row.id, token)
      } else {
        await kaogongApi.favoriteScoreLine(row.id, token)
      }
      const favoriteData = await kaogongApi.favoriteScoreLines(token).catch(() => [])
      const nextFavoriteRows = normalizeFavoriteScoreLines(favoriteData)
      const favoriteIds = new Set(nextFavoriteRows.map((item) => item.id))
      setFavoriteRows(nextFavoriteRows)
      setRows((current) => current.map((item) => ({
        ...item,
        favorite: favoriteIds.has(item.id),
      })))
    } catch (error) {
      setNotice(error.message || '分数线收藏操作失败。')
    } finally {
      setActionPendingId(null)
    }
  }

  function handleApplyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
  }

  function resetFilters() {
    const nextFilters = createScoreFilters()
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  const sortedRows = [...rows].sort((left, right) => {
    if (sortMode === 'year-desc') return Number(right.year || 0) - Number(left.year || 0)
    if (sortMode === 'recruit-desc') return Number(right.recruitCount || 0) - Number(left.recruitCount || 0)
    return Number(right.scoreLine || 0) - Number(left.scoreLine || 0)
  })
  const highestScore = sortedRows.reduce((highest, item) => Math.max(highest, Number(item.scoreLine || 0)), 0)
  const scoreSummaryText = `共 ${rows.length} 条 · 最高进面线 ${highestScore || '待补充'} · 已收藏 ${favoriteRows.length}`
  const visibleFavoriteRows = favoriteRows.slice(0, 2)
  const favoriteHighestScore = favoriteRows.reduce((highest, item) => Math.max(highest, Number(item.scoreLine || 0)), 0)

  return (
    <>
      <div className="v2-main-column">
        <section className="v2-kaogong-score-head" aria-label="分数线账本页头">
          <div>
            <p className="v2-kicker">考公主站 / 进面分数线</p>
            <h2>进面分数线账本</h2>
            <p>按地区、年份和岗位类型快速比对历年进面线。</p>
          </div>
          <strong>{scoreSummaryText}</strong>
        </section>

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-kaogong-score-toolbar" aria-label="分数线账本工具栏">
          <div className="v2-kaogong-score-metrics">
            <span>记录 {rows.length}</span>
            <span>最高线 {highestScore || '待补充'}</span>
            <span>收藏 {favoriteRows.length}</span>
          </div>
          <label className="v2-field v2-kaogong-sort-field">
            <span>排序</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              {scoreSortOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="v2-ledger-card" aria-label="分数线账本结果">
          {sortedRows.map((item) => (
            <article className="v2-ledger-row v2-ledger-row--material v2-kaogong-score-row" key={item.id}>
              <div className="v2-kaogong-score-value" aria-label={`${item.jobName} 进面线`}>
                <span>进面线</span>
                <strong>{item.scoreLine}</strong>
              </div>
              <div className="v2-ledger-row__main">
                <strong>{item.jobName}</strong>
                <p>{item.recruitingUnit}</p>
                <div className="v2-tag-row">
                  <span>{item.region}</span>
                  <span>{item.examType}</span>
                  <span>{item.year}</span>
                </div>
                <p>{item.dataNote}</p>
              </div>
              <div className="v2-ledger-row__meta">
                <span>面试比 {item.interviewRatio}</span>
                <span>招录 {item.recruitCount} / 进面 {item.interviewCount}</span>
                <span>{item.source}</span>
              </div>
              <div className="v2-ledger-row__actions">
                <button
                  className={`v2-segment-button ${item.favorite ? 'is-active' : ''}`}
                  type="button"
                  disabled={!canUseRemote || actionPendingId === item.id}
                  onClick={() => handleToggleFavorite(item)}
                >
                  {item.favorite ? '取消收藏分数线' : '收藏分数线'}
                </button>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-empty-card">
              <p>当前筛选条件下没有分数线结果，先调整地区、年份或考试类别再继续比对。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column v2-kaogong-score-side-column">
        <section className="v2-side-card v2-kaogong-filter-card v2-kaogong-score-filter-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选分数线</p>
              <h3>缩小对比范围</h3>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <section className="v2-kaogong-filter-cluster" aria-label="分数线筛选器">
              <div className="v2-kaogong-filter-grid">
                <label className="v2-field">
                  <span>地区</span>
                  <input
                    type="text"
                    placeholder="如：北京/上海/江苏"
                    value={draftFilters.region}
                    onChange={(event) => updateDraftFilter('region', event.target.value)}
                  />
                </label>
                <label className="v2-field">
                  <span>年份</span>
                  <input
                    type="text"
                    placeholder="如：2026"
                    value={draftFilters.year}
                    onChange={(event) => updateDraftFilter('year', event.target.value)}
                  />
                </label>
                <label className="v2-field">
                  <span>岗位类别</span>
                  <select
                    value={draftFilters.jobCategory}
                    onChange={(event) => updateDraftFilter('jobCategory', event.target.value)}
                  >
                    {scoreJobCategoryOptions.map((item) => (
                      <option key={`score-job-category-${item || 'empty'}`} value={item}>
                        {item || '全部'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="v2-field">
                  <span>单位类型</span>
                  <select
                    value={draftFilters.unitType}
                    onChange={(event) => updateDraftFilter('unitType', event.target.value)}
                  >
                    {scoreUnitTypeOptions.map((item) => (
                      <option key={`score-unit-type-${item || 'empty'}`} value={item}>
                        {item || '全部'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="v2-field v2-field--wide">
                  <span>考试类别</span>
                  <select
                    value={draftFilters.examType}
                    onChange={(event) => updateDraftFilter('examType', event.target.value)}
                  >
                    {scoreExamTypeOptions.map((item) => (
                      <option key={`score-exam-type-${item || 'empty'}`} value={item}>
                        {item || '全部'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
            <div className="v2-inline-actions v2-kaogong-filter-actions">
              <button className="v2-segment-button is-active" type="submit" disabled={loading}>
                {loading ? '筛选中…' : '应用筛选'}
              </button>
              <button className="v2-segment-button" type="button" disabled={loading} onClick={resetFilters}>重置</button>
            </div>
          </form>
        </section>

        <section className="v2-side-card v2-kaogong-side-panel">
          <div className="v2-room-side-section__head">
            <strong>已收藏分数线</strong>
            <span>{favoriteRows.length} 项</span>
          </div>
          <div className="v2-kaogong-score-favorite-preview">
            {visibleFavoriteRows.map((item) => (
              <button
                className="v2-check-row v2-check-row--action"
                key={`favorite-score-preview-${item.id}`}
                type="button"
                onClick={() => setFavoriteModalOpen(true)}
              >
                <span>
                  <strong>{item.jobName}</strong>
                  <small>{item.region} / {item.year} / {item.scoreLine}</small>
                </span>
              </button>
            ))}
            {!favoriteRows.length ? <p className="v2-kaogong-side-tip">当前还没有收藏分数线，看到值得持续跟踪的岗位线时可以先收藏。</p> : null}
          </div>
          <button
            className="v2-secondary-link v2-kaogong-favorite-trigger"
            type="button"
            onClick={() => setFavoriteModalOpen(true)}
          >
            查看收藏分数线
          </button>
        </section>
      </aside>

      {favoriteModalOpen ? (
        <div className="v2-modal-overlay" onClick={() => setFavoriteModalOpen(false)}>
          <div
            aria-label="收藏分数线"
            aria-modal="true"
            className="v2-modal-card v2-kaogong-favorite-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">收藏分数线</p>
                <h3>关键分数线清单</h3>
                <span>
                  已收藏 {favoriteRows.length} 条分数线
                  {favoriteHighestScore ? `，最高收藏线 ${favoriteHighestScore}` : '，先收藏重点岗位线后再集中比对。'}
                </span>
              </div>
              <button
                aria-label="关闭收藏分数线弹窗"
                className="v2-ghost-link"
                type="button"
                onClick={() => setFavoriteModalOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="v2-kaogong-favorite-list">
              {favoriteRows.map((item) => (
                <article className="v2-kaogong-favorite-card v2-kaogong-score-favorite-card" key={`favorite-score-modal-${item.id}`}>
                  <div className="v2-kaogong-favorite-score v2-kaogong-score-favorite-badge">
                    <span>进面线</span>
                    <strong>{item.scoreLine || '-'}</strong>
                  </div>
                  <div className="v2-kaogong-favorite-main">
                    <div className="v2-kaogong-favorite-card__head">
                      <div>
                        <strong>{item.jobName}</strong>
                        <p>{item.recruitingUnit || '招录单位待补充'}</p>
                      </div>
                      <span>{item.region} / {item.year || '年份待补充'}</span>
                    </div>
                    <div className="v2-kaogong-favorite-meta">
                      <span>{item.examType || '考试类别待补充'}</span>
                      <span>面试比 {item.interviewRatio || '待补充'}</span>
                      <span>招录 {item.recruitCount || 0} / 进面 {item.interviewCount || 0}</span>
                      <span>{item.source || '来源待补充'}</span>
                    </div>
                    <div className="v2-kaogong-favorite-foot">
                      <span>{item.dataNote || '收藏后可用于横向对比历年岗位进面线。'}</span>
                      <div className="v2-inline-actions">
                        <button
                          aria-label={`取消收藏分数线 ${item.jobName}`}
                          className="v2-segment-button"
                          type="button"
                          disabled={!canUseRemote || actionPendingId === item.id}
                          onClick={() => handleToggleFavorite({ ...item, favorite: true })}
                        >
                          {actionPendingId === item.id ? '处理中…' : '取消收藏'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {!favoriteRows.length ? (
                <div className="v2-empty-card">
                  <p>当前还没有收藏分数线，先在主区收藏值得持续跟踪的岗位线，再回到这里集中比对。</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
