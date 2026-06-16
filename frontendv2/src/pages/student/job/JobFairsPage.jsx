import { useDeferredValue, useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import JobFairDetailDrawer from '@/components/job/JobFairDetailDrawer.jsx'
import JobPreferenceModal from '@/components/job/JobPreferenceModal.jsx'
import JobSummaryStrip from '@/components/job/JobSummaryStrip.jsx'
import {
  normalizeFairDetail,
  normalizeFairPage,
} from '@/lib/job/employmentNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
  shouldShowStatusNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const emptyFilters = {
  city: '',
  industry: '',
  keyword: '',
  includeExpired: false,
}

const emptyPreference = {
  cities: '',
  industries: '',
  roleTypes: '',
  salaryRange: '',
  companyTypes: '',
}

const PAGE_SIZE = 10

function createFallbackFairPage() {
  return normalizeFairPage({
    items: [
      {
        id: 601,
        title: '上海春招双选会',
        city: '上海',
        industry: '教育科技',
        location: '浦东会展中心',
        description: '用于预览的招聘会样例。',
        startTime: '2026-06-22T09:00:00',
        applyDeadline: '2026-06-21T18:00:00',
      },
    ],
    totalItems: 1,
    totalPages: 1,
    page: 1,
  })
}

function compactFilters(filters) {
  const next = {}

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      if (value) next[key] = value
      return
    }

    if (value) next[key] = value
  })

  return next
}

export default function JobFairsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState(emptyFilters)
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [page, setPage] = useState(1)
  const [fairPage, setFairPage] = useState(createFallbackFairPage())
  const [preference, setPreference] = useState(emptyPreference)
  const [notice, setNotice] = useState(previewDataNotice('招聘会目录'))
  const [selectedFair, setSelectedFair] = useState(null)
  const [preferenceOpen, setPreferenceOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!canUseRemote) {
        setPage(1)
        setFairPage(createFallbackFairPage())
        setPreference(emptyPreference)
        setNotice(previewDataNotice('招聘会目录'))
        return
      }

      try {
        const requestFilters = compactFilters({
          ...filters,
          keyword: deferredKeyword.trim(),
          city: filters.city.trim(),
          industry: filters.industry.trim(),
        })

        const [fairData, preferenceData] = await withRequestTimeout(
          Promise.all([
            employmentApi.fairs({ ...requestFilters, page, size: PAGE_SIZE }),
            employmentApi.preference(token).catch(() => emptyPreference),
          ]),
          8000,
          '招聘会数据读取超时，请检查后端服务。',
        )

        if (!active) return

        setFairPage(normalizeFairPage(fairData))
        setPreference({
          ...emptyPreference,
          ...(preferenceData || {}),
        })
        setNotice(remoteDataNotice('招聘会目录'))
      } catch (error) {
        if (!active) return
        setFairPage(createFallbackFairPage())
        setPreference(emptyPreference)
        setNotice(fallbackDataNotice('招聘会目录', error))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [canUseRemote, deferredKeyword, filters.city, filters.includeExpired, filters.industry, page, token])

  function updateFilters(updater) {
    setPage(1)
    setFilters(updater)
  }

  async function handleOpenDetail(fair) {
    if (!canUseRemote) {
      setSelectedFair(normalizeFairDetail(fair))
      return
    }

    const data = await employmentApi.fairDetail(fair.id)
    setSelectedFair(normalizeFairDetail(data))
  }

  async function handleSavePreference(nextPreference) {
    if (canUseRemote) {
      const saved = await employmentApi.savePreference(nextPreference, token)
      setPreference({
        ...emptyPreference,
        ...(saved || nextPreference),
      })
    } else {
      setPreference(nextPreference)
    }

    setPreferenceOpen(false)
    setNotice('提醒偏好已更新。')
  }

  const summaryItems = [
    {
      label: '会场数量',
      value: String(fairPage.totalItems),
      note: `当前第 ${page} / ${fairPage.totalPages} 页，每页 ${PAGE_SIZE} 条。`,
    },
    {
      label: '偏好城市',
      value: preference.cities || '待补充',
      note: preference.industries || '行业偏好待补充。',
    },
    {
      label: '偏好岗位',
      value: preference.roleTypes || '待补充',
      note: preference.salaryRange || '薪资偏好待补充。',
    },
    {
      label: '开放报名',
      value: String(fairPage.items.filter((item) => !item.applicationClosed).length),
    },
  ]

  return (
    <>
      <div className="v2-main-column" data-testid="job-fairs-page">
        <PageIntro
          kicker="招聘会目录"
          kickerAsTitle
          pathItems={[
            { label: '就业主站', to: '/station/job' },
          ]}
        />

        {shouldShowStatusNotice(notice) ? <div className="v2-status-note">{notice}</div> : null}

        <JobSummaryStrip items={summaryItems} />

        <section className="v2-feed-list" aria-label="招聘会目录">
          {fairPage.items.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.city.slice(0, 2)}</div>
              <div className="v2-feed-body">
                <strong>{item.title}</strong>
                <p>{item.city} / {item.industry} / {item.location}</p>
                <p>{item.description}</p>
                <div className="v2-tag-row">
                  <span>{item.statusLabel}</span>
                  <span>{item.applyStatusLabel}</span>
                </div>
              </div>
              <div className="v2-feed-side">
                <span>{item.timeText}</span>
                <button className="v2-secondary-link" type="button" onClick={() => handleOpenDetail(item)}>查看详情</button>
                {item.applyUrl && !item.applicationClosed ? (
                  <a className="v2-primary-link" href={item.applyUrl} rel="noreferrer" target="_blank">打开报名</a>
                ) : null}
              </div>
            </article>
          ))}
          {!fairPage.items.length ? (
            <article className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有匹配的招聘会</strong>
                <p>可以放宽城市、行业或关键词后再刷新一轮。</p>
              </div>
            </article>
          ) : null}
        </section>

        <div className="v2-pagination-row">
          <button
            className="v2-secondary-link"
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            上一页
          </button>
          <span className="v2-pagination-note">{page} / {fairPage.totalPages}</span>
          <button
            className="v2-secondary-link"
            type="button"
            disabled={page >= fairPage.totalPages}
            onClick={() => setPage((current) => (current < fairPage.totalPages ? current + 1 : current))}
          >
            下一页
          </button>
        </div>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">筛选台</p>
              <h3>把浏览条件固定在右栏</h3>
            </div>
          </div>

          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>城市</span>
              <input value={filters.city} onChange={(event) => updateFilters((current) => ({ ...current, city: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>行业</span>
              <input value={filters.industry} onChange={(event) => updateFilters((current) => ({ ...current, industry: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input value={filters.keyword} onChange={(event) => updateFilters((current) => ({ ...current, keyword: event.target.value }))} />
            </label>
            <label className="v2-field">
              <span>包含已结束</span>
              <div className="v2-segment-group" role="group" aria-label="招聘会范围">
                {[
                  { value: false, label: '只看未结束' },
                  { value: true, label: '显示全部' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`v2-segment-button ${filters.includeExpired === item.value ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => updateFilters((current) => ({ ...current, includeExpired: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">偏好摘要</p>
              <h3>提醒规则和浏览筛选分开存放</h3>
            </div>
            <button className="v2-secondary-link" type="button" onClick={() => setPreferenceOpen(true)}>编辑偏好</button>
          </div>

          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>城市</strong>
              <span>{preference.cities || '待补充'}</span>
            </div>
            <div className="v2-check-row">
              <strong>行业</strong>
              <span>{preference.industries || '待补充'}</span>
            </div>
            <div className="v2-check-row">
              <strong>岗位</strong>
              <span>{preference.roleTypes || '待补充'}</span>
            </div>
            <div className="v2-check-row">
              <strong>薪资 / 企业</strong>
              <span>{[preference.salaryRange, preference.companyTypes].filter(Boolean).join(' / ') || '待补充'}</span>
            </div>
          </div>
        </section>

        <JobFairDetailDrawer fair={selectedFair} onClose={() => setSelectedFair(null)} />
      </aside>

      <JobPreferenceModal
        open={preferenceOpen}
        preference={preference}
        onClose={() => setPreferenceOpen(false)}
        onSave={handleSavePreference}
      />
    </>
  )
}
