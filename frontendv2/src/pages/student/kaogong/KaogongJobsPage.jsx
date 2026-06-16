import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createKaogongJobPreviewRows,
  defaultJobCriteria,
  normalizeFavoriteJobs,
  normalizeJobRows,
} from '@/pages/student/kaogong/kaogongPageData.js'

export default function KaogongJobsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [draftFilters, setDraftFilters] = useState(defaultJobCriteria)
  const [appliedFilters, setAppliedFilters] = useState(defaultJobCriteria)
  const [rows, setRows] = useState(createKaogongJobPreviewRows())
  const [favoriteJobs, setFavoriteJobs] = useState([])
  const [histories, setHistories] = useState([])
  const [notice, setNotice] = useState(previewDataNotice('岗位匹配'))
  const [loading, setLoading] = useState(false)
  const [actionPendingId, setActionPendingId] = useState(null)

  useEffect(() => {
    let active = true

    async function loadJobs() {
      if (!canUseRemote) {
        const previewRows = createKaogongJobPreviewRows()
        setRows(previewRows)
        setFavoriteJobs([])
        setHistories([])
        setNotice(previewDataNotice('岗位匹配'))
        return
      }

      setLoading(true)
      try {
        const [jobsData, favoriteData, historyData] = await withRequestTimeout(
          Promise.all([
            kaogongApi.matchJobs(appliedFilters, token),
            kaogongApi.favoriteJobs(token).catch(() => []),
            kaogongApi.jobMatchHistory(token).catch(() => []),
          ]),
          8000,
          '岗位匹配数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeJobRows(jobsData, favoriteData))
        setFavoriteJobs(normalizeFavoriteJobs(favoriteData))
        setHistories(Array.isArray(historyData) ? historyData : [])
        setNotice(remoteDataNotice('岗位匹配'))
      } catch (error) {
        if (!active) return
        setRows(createKaogongJobPreviewRows())
        setFavoriteJobs([])
        setHistories([])
        setNotice(fallbackDataNotice('岗位匹配', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [appliedFilters, canUseRemote, token])

  async function handleToggleFavorite(row) {
    if (!canUseRemote) return

    setActionPendingId(row.id)
    try {
      if (row.favorite) {
        await kaogongApi.unfavoriteJob(row.id, token)
      } else {
        await kaogongApi.favoriteJob(row.id, token)
      }
      const favoriteData = await kaogongApi.favoriteJobs(token).catch(() => [])
      const favoriteRows = normalizeFavoriteJobs(favoriteData)
      const favoriteIds = new Set(favoriteRows.map((item) => item.id))
      setFavoriteJobs(favoriteRows)
      setRows((current) => current.map((item) => ({
        ...item,
        favorite: favoriteIds.has(item.id),
      })))
    } catch (error) {
      setNotice(error.message || '岗位收藏操作失败。')
    } finally {
      setActionPendingId(null)
    }
  }

  function handleApplyFilters(event) {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
  }

  function resetFilters() {
    setDraftFilters(defaultJobCriteria)
    setAppliedFilters(defaultJobCriteria)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="岗位匹配"
          pathItems={[
            { label: '考公主站', to: '/station/kaogong' },
            { label: '岗位决策流' },
          ]}
          title="把可报岗位收拢成一条决策流，再决定该把时间投去哪一类岗位。"
          lead="结果流留在主区，筛选、收藏摘要和匹配历史全部收在右侧，避免再次回到旧版的大表格心智。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新岗位匹配结果…</div> : null}

        <section className="v2-summary-strip" aria-label="岗位匹配摘要">
          <article className="v2-summary-card">
            <span>结果数量</span>
            <strong>{rows.length}</strong>
            <p>先看命中数量，再判断是否要放宽条件。</p>
          </article>
          <article className="v2-summary-card">
            <span>最高匹配</span>
            <strong>{rows[0]?.matchScore || 0}</strong>
            <p>优先从匹配度最靠前的岗位开始读报名窗口和条件说明。</p>
          </article>
          <article className="v2-summary-card">
            <span>已收藏</span>
            <strong>{favoriteJobs.length}</strong>
            <p>重点岗位会沉到底栏固定回看，不再只留在首页摘要里。</p>
          </article>
        </section>

        <section className="v2-feed-list" aria-label="岗位匹配结果">
          {rows.map((item) => (
            <article className="v2-feed-item v2-feed-item--kaogong" key={item.id}>
              <div className="v2-feed-index">{item.matchScore}</div>
              <div className="v2-feed-body">
                <strong>{item.jobName}</strong>
                <p>{item.recruitingUnit}</p>
                <p>{item.region} / {item.examType} / 招录 {item.recruitCount} 人</p>
                <p>{item.educationRequirement} / {item.majorRequirement}</p>
                <div className="v2-tag-row">
                  {item.matchReasons.map((reason) => <span key={`${item.id}-${reason}`}>{reason}</span>)}
                </div>
              </div>
              <div className="v2-feed-side">
                <span>{item.registrationStart ? formatDateLabel(item.registrationStart) : '待补充'}</span>
                <span>{item.registrationEnd ? formatDateLabel(item.registrationEnd) : '待补充'}</span>
                <div className="v2-inline-actions">
                  <button
                    className={`v2-segment-button ${item.favorite ? 'is-active' : ''}`}
                    type="button"
                    disabled={!canUseRemote || actionPendingId === item.id}
                    onClick={() => handleToggleFavorite(item)}
                  >
                    {item.favorite ? '取消收藏岗位' : '收藏岗位'}
                  </button>
                  {item.sourceUrl ? (
                    <a className="v2-secondary-link" href={item.sourceUrl} rel="noreferrer" target="_blank">查看来源</a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <article className="v2-empty-card">
              <p>当前没有命中的岗位结果，可以放宽地区、专业或政治面貌条件后再试一次。</p>
            </article>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选控制器</p>
              <h3>先给画像，再生成匹配</h3>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <label className="v2-field">
              <span>学历</span>
              <input
                type="text"
                value={draftFilters.education}
                onChange={(event) => setDraftFilters((current) => ({ ...current, education: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>学位</span>
              <input
                type="text"
                value={draftFilters.degree}
                onChange={(event) => setDraftFilters((current) => ({ ...current, degree: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>专业</span>
              <input
                type="text"
                value={draftFilters.major}
                onChange={(event) => setDraftFilters((current) => ({ ...current, major: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>地区偏好</span>
              <input
                type="text"
                value={draftFilters.region}
                onChange={(event) => setDraftFilters((current) => ({ ...current, region: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>政治面貌</span>
              <input
                type="text"
                value={draftFilters.politicalStatus}
                onChange={(event) => setDraftFilters((current) => ({ ...current, politicalStatus: event.target.value }))}
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
            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" type="submit">应用筛选</button>
              <button className="v2-segment-button" type="button" onClick={resetFilters}>重置</button>
            </div>
          </form>

          <div className="v2-room-side-divider" />

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>收藏岗位</strong>
              <span>{favoriteJobs.length} 项</span>
            </div>
            <div className="v2-check-list">
              {favoriteJobs.map((item) => (
                <div className="v2-check-row" key={`favorite-job-${item.id}`}>
                  <strong>{item.jobName}</strong>
                  <span>{item.region}</span>
                </div>
              ))}
              {!favoriteJobs.length ? <p>当前还没有收藏岗位，命中结果后可以把重点岗位钉在这里。</p> : null}
            </div>
          </section>

          <section className="v2-room-side-section">
            <div className="v2-room-side-section__head">
              <strong>最近匹配</strong>
              <span>{histories.length} 次</span>
            </div>
            <div className="v2-check-list">
              {histories.map((item) => (
                <div className="v2-check-row" key={`history-${item.id}`}>
                  <strong>匹配到 {item.resultCount} 个岗位</strong>
                  <span>{formatDateTimeLabel(item.createdAt)}</span>
                </div>
              ))}
              {!histories.length ? <p>真实账号完成匹配后，这里会保留最近的匹配记录，方便回看筛选口径。</p> : null}
            </div>
          </section>
        </section>
      </aside>
    </>
  )
}
