import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createKaogongScorePreviewRows,
  normalizeFavoriteScoreLines,
  normalizeScoreRows,
} from '@/pages/student/kaogong/kaogongPageData.js'

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
        setNotice(remoteDataNotice('分数线账本'))
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

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="分数线账本"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '进面账本' },
          ]}
          title="把历年进面线整理成一本能连续比对的账本，而不是查完就走的列表页。"
          lead="主区专心做纵向比对，右侧负责筛选和收藏回看，让重点岗位的线真正沉淀下来。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新分数线账本…</div> : null}

        <section className="v2-summary-strip" aria-label="分数线账本摘要">
          <article className="v2-summary-card">
            <span>记录数</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下命中的分数线记录数。</p>
          </article>
          <article className="v2-summary-card">
            <span>最高线</span>
            <strong>{rows[0]?.scoreLine || '待补充'}</strong>
            <p>优先判断最紧的进面线，再决定是否保留该岗位。</p>
          </article>
          <article className="v2-summary-card">
            <span>已收藏</span>
            <strong>{favoriteRows.length}</strong>
            <p>收藏记录会留在右侧固定回看，不再只靠首页的一小段摘要。</p>
          </article>
        </section>

        <section className="v2-ledger-card" aria-label="分数线账本结果">
          {rows.map((item) => (
            <article className="v2-ledger-row v2-ledger-row--material v2-kaogong-score-row" key={item.id}>
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
                <span>进面线 {item.scoreLine}</span>
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

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选控制器</p>
              <h3>先收口对比范围</h3>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <label className="v2-field">
              <span>地区</span>
              <input
                type="text"
                value={draftFilters.region}
                onChange={(event) => setDraftFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>年份</span>
              <input
                type="text"
                value={draftFilters.year}
                onChange={(event) => setDraftFilters((current) => ({ ...current, year: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>岗位类别</span>
              <input
                type="text"
                value={draftFilters.jobCategory}
                onChange={(event) => setDraftFilters((current) => ({ ...current, jobCategory: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>单位类型</span>
              <input
                type="text"
                value={draftFilters.unitType}
                onChange={(event) => setDraftFilters((current) => ({ ...current, unitType: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>考试类别</span>
              <input
                type="text"
                value={draftFilters.examType}
                onChange={(event) => setDraftFilters((current) => ({ ...current, examType: event.target.value }))}
              />
            </label>
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">应用筛选</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置</button>
            </div>
          </form>

          <div className="v2-room-side-divider" />

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>已收藏分数线</strong>
              <span>{favoriteRows.length} 项</span>
            </div>
            <div className="v2-check-list">
              {favoriteRows.map((item) => (
                <div className="v2-check-row" key={`favorite-score-${item.id}`}>
                  <strong>{item.jobName}</strong>
                  <span>{item.region} / {item.year}</span>
                  <span>{item.scoreLine}</span>
                </div>
              ))}
              {!favoriteRows.length ? <p>当前还没有收藏分数线，看到值得持续跟踪的岗位线时可以直接钉在这里。</p> : null}
            </div>
          </section>
        </section>
      </aside>
    </>
  )
}
