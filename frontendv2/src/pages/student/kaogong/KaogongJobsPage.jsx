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

const educationOptions = ['', '大专', '本科', '硕士', '博士']
const degreeOptions = ['', '学士', '硕士', '博士']
const politicalStatusOptions = ['', '中共党员', '共青团员', '群众']
const jobCategoryOptions = ['', '综合管理', '行政执法', '专业技术']
const unitTypeOptions = ['', '中央机关直属机构', '地方机关', '事业单位']

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
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false)

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

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  const latestHistory = histories[0] || null

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

      <aside className="v2-side-column v2-kaogong-jobs-side-column">
        <section className="v2-side-card v2-kaogong-filter-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选控制器</p>
              <h3>先给画像，再生成匹配</h3>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <section className="v2-kaogong-filter-cluster" aria-label="岗位筛选器">
              <div className="v2-kaogong-filter-cluster__head">
                <strong>筛选条件</strong>
                <span>沿用旧版字段和筛选方式，把门槛条件与偏好条件收进同一个控制面板。</span>
              </div>
              <div className="v2-kaogong-filter-grid">
                <label className="v2-field">
                  <span>学历</span>
                  <select
                    value={draftFilters.education}
                    onChange={(event) => updateDraftFilter('education', event.target.value)}
                  >
                    {educationOptions.map((item) => (
                      <option key={`education-${item || 'empty'}`} value={item}>
                        {item || '不限'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="v2-field">
                  <span>学位</span>
                  <select
                    value={draftFilters.degree}
                    onChange={(event) => updateDraftFilter('degree', event.target.value)}
                  >
                    {degreeOptions.map((item) => (
                      <option key={`degree-${item || 'empty'}`} value={item}>
                        {item || '不限'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="v2-field v2-field--wide">
                  <span>专业</span>
                  <input
                    type="text"
                    value={draftFilters.major}
                    placeholder="如：计算机科学"
                    onChange={(event) => updateDraftFilter('major', event.target.value)}
                  />
                </label>
                <label className="v2-field v2-field--wide">
                  <span>户籍/生源地</span>
                  <input
                    type="text"
                    value={draftFilters.household}
                    placeholder="如：上海生源"
                    onChange={(event) => updateDraftFilter('household', event.target.value)}
                  />
                </label>
                <label className="v2-field v2-field--wide">
                  <span>地区偏好</span>
                  <input
                    type="text"
                    value={draftFilters.region}
                    placeholder="如：北京/上海/江苏"
                    onChange={(event) => updateDraftFilter('region', event.target.value)}
                  />
                </label>
                <label className="v2-field">
                  <span>政治面貌</span>
                  <select
                    value={draftFilters.politicalStatus}
                    onChange={(event) => updateDraftFilter('politicalStatus', event.target.value)}
                  >
                    {politicalStatusOptions.map((item) => (
                      <option key={`political-${item || 'empty'}`} value={item}>
                        {item || '不限'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="v2-field">
                  <span>岗位类别</span>
                  <select
                    value={draftFilters.jobCategory}
                    onChange={(event) => updateDraftFilter('jobCategory', event.target.value)}
                  >
                    {jobCategoryOptions.map((item) => (
                      <option key={`job-category-${item || 'empty'}`} value={item}>
                        {item || '不限'}
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
                    {unitTypeOptions.map((item) => (
                      <option key={`unit-type-${item || 'empty'}`} value={item}>
                        {item || '不限'}
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
            <strong>收藏岗位</strong>
            <span>{favoriteJobs.length} 项</span>
          </div>
          <p className="v2-kaogong-side-tip">
            {favoriteJobs.length
              ? '右栏只保留入口，完整收藏清单放进弹窗里查看。'
              : '当前还没有收藏岗位，命中结果后可以从这里集中查看。'}
          </p>
          <button
            className="v2-secondary-link v2-kaogong-favorite-trigger"
            type="button"
            onClick={() => setFavoriteModalOpen(true)}
          >
            查看收藏岗位
          </button>
        </section>

        <section className="v2-side-card v2-kaogong-side-panel">
          <div className="v2-room-side-section__head">
            <strong>最近匹配</strong>
            <span>{latestHistory ? '当前结果' : '待生成'}</span>
          </div>
          <div className="v2-check-list">
            {latestHistory ? (
              <div className="v2-check-row" key={`history-${latestHistory.id}`}>
                <strong>匹配到 {latestHistory.resultCount} 个岗位</strong>
                <span>{formatDateTimeLabel(latestHistory.createdAt)}</span>
              </div>
            ) : <p>完成一次岗位匹配后，这里只保留当前结果摘要，方便快速确认筛选命中数。</p>}
          </div>
        </section>
      </aside>

      {favoriteModalOpen ? (
        <div className="v2-modal-overlay" onClick={() => setFavoriteModalOpen(false)}>
          <div
            aria-label="收藏岗位"
            aria-modal="true"
            className="v2-modal-card v2-kaogong-favorite-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="v2-modal-head">
              <div>
                <p className="v2-kicker">收藏岗位</p>
                <h3>重点岗位清单</h3>
              </div>
              <button
                aria-label="关闭收藏岗位弹窗"
                className="v2-ghost-link"
                type="button"
                onClick={() => setFavoriteModalOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="v2-check-list">
              {favoriteJobs.map((item) => (
                <div className="v2-check-row" key={`favorite-modal-${item.id}`}>
                  <strong>{item.jobName}</strong>
                  <span>{item.region}</span>
                </div>
              ))}
              {!favoriteJobs.length ? <p>当前还没有收藏岗位，先从匹配结果里钉住几个重点岗位再回来查看。</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
