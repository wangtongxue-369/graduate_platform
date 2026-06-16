import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { kaogongApi } from '@legacy/lib/api.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateLabel,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'
import {
  createDefaultJobCriteriaFromUser,
  createKaogongJobPreviewRows,
  normalizeFavoriteJobs,
  normalizeJobRows,
} from '@/pages/student/kaogong/kaogongPageData.js'

const educationOptions = ['', '大专', '本科', '硕士', '博士']
const degreeOptions = ['', '学士', '硕士', '博士']
const politicalStatusOptions = ['', '中共党员', '共青团员', '群众']
const jobCategoryOptions = ['', '综合管理', '行政执法', '专业技术']
const unitTypeOptions = ['', '中央机关直属机构', '地方机关', '事业单位']

export default function KaogongJobsPage() {
  const { token, user } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const profileCriteria = createDefaultJobCriteriaFromUser(user)
  const [draftFilters, setDraftFilters] = useState(() => profileCriteria)
  const [appliedFilters, setAppliedFilters] = useState(() => profileCriteria)
  const [rows, setRows] = useState(createKaogongJobPreviewRows())
  const [favoriteJobs, setFavoriteJobs] = useState([])
  const [histories, setHistories] = useState([])
  const [notice, setNotice] = useState('')
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
        setNotice('')
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
        setNotice('')
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
    const nextCriteria = createDefaultJobCriteriaFromUser(user)
    setDraftFilters(nextCriteria)
    setAppliedFilters(nextCriteria)
  }

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }

  const latestHistory = histories[0] || null
  const activeFilterChips = [
    ['学历', appliedFilters.education],
    ['学位', appliedFilters.degree],
    ['专业', appliedFilters.major],
    ['户籍', appliedFilters.household],
    ['地区', appliedFilters.region],
    ['政治面貌', appliedFilters.politicalStatus],
    ['岗位类别', appliedFilters.jobCategory],
    ['单位类型', appliedFilters.unitType],
  ].filter(([, value]) => Boolean(value))
  const summaryText = `共 ${rows.length} 个岗位 · 最高匹配 ${rows[0]?.matchScore || 0}% · 已收藏 ${favoriteJobs.length}`
  const hasProfileDefaults = Object.values(profileCriteria).some(Boolean)

  return (
    <>
      <div className="v2-main-column">
        <section className="v2-kaogong-jobs-head" aria-label="岗位匹配页头">
          <div>
            <p className="v2-kicker">考公主站 / 岗位匹配</p>
            <h2>岗位匹配</h2>
            <p>根据学历、专业、地区筛选可报岗位。</p>
          </div>
          <strong>{summaryText}</strong>
        </section>

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-kaogong-active-filters" aria-label="当前筛选条件">
          {activeFilterChips.length ? (
            activeFilterChips.map(([label, value]) => (
              <span key={`${label}-${value}`}>{label}：{value}</span>
            ))
          ) : (
            <span>当前未限制筛选条件</span>
          )}
        </section>

        <section className="v2-feed-list" aria-label="岗位匹配结果">
          {rows.map((item) => (
            <article className="v2-feed-item v2-feed-item--kaogong" key={item.id}>
              <div className="v2-feed-index v2-feed-index--match">
                <strong>{item.matchScore}%</strong>
                <span>匹配度</span>
              </div>
              <div className="v2-feed-body">
                <strong>{item.jobName}</strong>
                <p>{item.recruitingUnit}</p>
                <p>{item.region} / {item.examType} / 招录 {item.recruitCount} 人</p>
                <p>{item.educationRequirement} / {item.majorRequirement}</p>
                <p>户籍/生源地：{item.householdRequirement || '不限'}</p>
                <div className="v2-tag-row">
                  {item.matchReasons.map((reason) => <span key={`${item.id}-${reason}`}>{reason}</span>)}
                </div>
              </div>
              <div className="v2-feed-side">
                <span>报名 {item.registrationStart ? formatDateLabel(item.registrationStart) : '待补充'}</span>
                <span>截止 {item.registrationEnd ? formatDateLabel(item.registrationEnd) : '待补充'}</span>
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
              <p className="v2-kicker">筛选条件</p>
              <h3>调整岗位范围</h3>
              <p>{hasProfileDefaults ? '已根据个人信息预填，可继续修改。' : '完善个人信息后会自动预填。'}</p>
            </div>
          </div>
          <form className="v2-filter-form" onSubmit={handleApplyFilters}>
            <section className="v2-kaogong-filter-cluster" aria-label="岗位筛选器">
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
              <button className="v2-segment-button is-active" type="submit" disabled={loading}>
                {loading ? '筛选中…' : '应用筛选'}
              </button>
              <button className="v2-segment-button" type="button" disabled={loading} onClick={resetFilters}>重置</button>
            </div>
          </form>
          <div className="v2-kaogong-filter-foot">
            <span>已收藏 {favoriteJobs.length} 个岗位</span>
            <button
              aria-label="查看收藏岗位"
              className="v2-secondary-link"
              type="button"
              onClick={() => setFavoriteModalOpen(true)}
            >
              查看
            </button>
          </div>
          {latestHistory ? (
            <p className="v2-kaogong-side-tip">最近一次匹配到 {latestHistory.resultCount} 个岗位。</p>
          ) : null}
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
                <span>已收藏 {favoriteJobs.length} 个岗位，优先回看报名窗口和硬性条件。</span>
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
            <div className="v2-kaogong-favorite-list">
              {favoriteJobs.map((item) => (
                <article className="v2-kaogong-favorite-card" key={`favorite-modal-${item.id}`}>
                  <div className="v2-kaogong-favorite-score">
                    <span>招录</span>
                    <strong>{item.recruitCount ? `${item.recruitCount}人` : '-'}</strong>
                  </div>
                  <div className="v2-kaogong-favorite-main">
                    <div className="v2-kaogong-favorite-card__head">
                      <div>
                        <strong>{item.jobName}</strong>
                        <p>{item.recruitingUnit}</p>
                      </div>
                      <span>{item.region}</span>
                    </div>
                    <div className="v2-kaogong-favorite-meta">
                      <span>{item.examType} / 招录 {item.recruitCount || 0} 人</span>
                      <span>{item.educationRequirement} / {item.degreeRequirement}</span>
                      <span>户籍/生源地：{item.householdRequirement || '不限'}</span>
                      <span>{item.majorRequirement}</span>
                    </div>
                    <div className="v2-kaogong-favorite-foot">
                      <span>{item.registrationEnd ? `报名截止 ${formatDateLabel(item.registrationEnd)}` : '报名截止待补充'}</span>
                      <div className="v2-inline-actions">
                        {item.sourceUrl ? (
                          <a className="v2-secondary-link" href={item.sourceUrl} rel="noreferrer" target="_blank">查看来源</a>
                        ) : null}
                        <button
                          aria-label={`取消收藏岗位 ${item.jobName}`}
                          className="v2-segment-button"
                          type="button"
                          disabled={!canUseRemote || actionPendingId === item.id}
                          onClick={() => handleToggleFavorite(item)}
                        >
                          {actionPendingId === item.id ? '处理中…' : '取消收藏'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {!favoriteJobs.length ? (
                <div className="v2-empty-card">
                  <p>当前还没有收藏岗位，先从匹配结果里钉住几个重点岗位再回来查看。</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
