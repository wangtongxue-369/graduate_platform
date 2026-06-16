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

const scoreJobCategoryOptions = ['', '综合管理', '行政执法', '专业技术']
const scoreUnitTypeOptions = ['', '中央机关直属机构', '地方机关', '事业单位']
const scoreExamTypeOptions = ['', '国家公务员考试', '上海市公务员考试', '浙江省公务员考试']

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
        {loading ? <div className="v2-status-note">正在刷新分数线账本...</div> : null}

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

      <aside className="v2-side-column v2-kaogong-score-side-column">
        <section className="v2-side-card v2-kaogong-filter-card v2-kaogong-score-filter-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选控制器</p>
              <h3>先收口对比范围</h3>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <section className="v2-kaogong-filter-cluster" aria-label="分数线筛选器">
              <div className="v2-kaogong-filter-cluster__head">
                <strong>筛选条件</strong>
                <span>先把对比范围收紧，再决定哪些年份和岗位线值得继续跟踪。</span>
              </div>
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
              <button className="v2-segment-button is-active" type="submit">应用筛选</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置</button>
            </div>
          </form>
        </section>

        <section className="v2-side-card v2-kaogong-side-panel">
          <div className="v2-room-side-section__head">
            <strong>已收藏分数线</strong>
            <span>{favoriteRows.length} 项</span>
          </div>
          <p className="v2-kaogong-side-tip">
            {favoriteRows.length
              ? '右栏只保留入口，全部收藏分数线放到弹窗里集中回看。'
              : '当前还没有收藏分数线，看到值得持续跟踪的岗位线时可以从这里集中查看。'}
          </p>
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
            <div className="v2-check-list">
              {favoriteRows.map((item) => (
                <div className="v2-check-row" key={`favorite-score-modal-${item.id}`}>
                  <strong>{item.jobName}</strong>
                  <span>{item.region} / {item.year}</span>
                  <span>{item.scoreLine}</span>
                </div>
              ))}
              {!favoriteRows.length ? <p>当前还没有收藏分数线，先在主区钉住值得持续跟踪的岗位线再回来看。</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
