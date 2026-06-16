import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { jobWorkspace } from '@/lib/workspacePreview.js'
import {
  canUseRemoteToken,
  ensureArray,
  ensurePage,
  fallbackDataNotice,
  firstNonEmpty,
  formatBytes,
  formatDateLabel,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const resumeFileDefaults = {
  hasFile: false,
  fileName: '',
  fileSize: 0,
  fileType: '',
  uploadedAt: '',
}

function createJobPreviewOverview() {
  return {
    metrics: [
      { label: '简历模块', value: '4 个重点块' },
      { label: '岗位推荐', value: `${jobWorkspace.recommendations.length} 条` },
      { label: '投递记录', value: `${jobWorkspace.applications.length} 条` },
    ],
    resume: createJobResumePreview(),
    recommendations: createJobRecommendationPreviewRows(),
    applications: createJobApplicationPreviewRows(),
    fairs: createJobFairPreviewRows(),
  }
}

function createJobResumePreview() {
  return {
    targetRole: '平台后端工程师',
    expectedCities: '上海, 杭州',
    expectedIndustries: '教育科技',
    skillTags: 'Java, Spring Boot, MySQL',
    projectKeywords: '权限系统, 数据看板',
    selfEvaluation: '当前为前端预览简历，用于展示真实简历接入后的版式。',
    resumeFile: {
      hasFile: true,
      fileName: 'resume-preview.pdf',
      fileSize: 409600,
      fileType: 'application/pdf',
      uploadedAt: '2026-06-12T09:30:00',
    },
  }
}

function createJobRecommendationPreviewRows() {
  return jobWorkspace.recommendations.map((item, index) => ({
    id: `preview-recommendation-${index}`,
    title: item.role,
    companyName: item.company,
    city: item.city,
    industry: '方向预览',
    companyType: '待补充',
    salaryRange: '面议',
    matchScore: Number(item.score || 0),
    matchReasons: [item.reason],
    description: item.reason,
    applyUrl: '',
  }))
}

function createJobApplicationPreviewRows() {
  return jobWorkspace.applications.map((item, index) => ({
    id: `preview-application-${index}`,
    companyName: item.company,
    jobTitle: item.role,
    status: item.status,
    appliedAt: `2026-06-${String(index + 10).padStart(2, '0')}T09:00:00`,
    nextStepAt: `2026-06-${String(index + 11).padStart(2, '0')}T14:00:00`,
    notes: `${item.nextStep} / ${item.note}`,
  }))
}

function createJobFairPreviewRows() {
  return jobWorkspace.fairs.map((item, index) => ({
    id: `preview-fair-${index}`,
    title: item.name,
    companyName: item.name,
    city: item.city,
    industry: item.industry,
    location: `${item.city} 会场`,
    description: item.note,
    startTime: `2026-06-${String(index + 18).padStart(2, '0')} 09:00`,
    applyDeadline: `2026-06-${String(index + 19).padStart(2, '0')} 18:00`,
    statusLabel: '即将开始',
    applyStatusLabel: '可报名',
    applyUrl: '',
    expired: false,
    applicationClosed: false,
  }))
}

function normalizeResume(data) {
  return {
    targetRole: data?.targetRole || '',
    expectedCities: data?.expectedCities || '',
    expectedIndustries: data?.expectedIndustries || '',
    skillTags: data?.skillTags || '',
    projectKeywords: data?.projectKeywords || '',
    selfEvaluation: data?.selfEvaluation || data?.baseInfo || '',
    resumeFile: {
      ...resumeFileDefaults,
      ...(data?.resumeFile || {}),
    },
  }
}

function normalizeRecommendationRows(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    title: item.title || '未命名岗位',
    companyName: item.companyName || '企业待补充',
    city: item.city || '城市待补充',
    industry: item.industry || '行业待补充',
    companyType: item.companyType || '企业类型待补充',
    salaryRange: item.salaryRange || '薪资待补充',
    matchScore: Number(item.matchScore || 0),
    matchReasons: ensureArray(item.matchReasons),
    description: item.description || '后端暂未补充岗位说明',
    applyUrl: item.applyUrl || '',
  }))
}

function normalizeApplicationRows(data) {
  return ensureArray(data).map((item) => ({
    id: item.id,
    companyName: item.companyName || '企业待补充',
    jobTitle: item.jobTitle || '岗位待补充',
    status: item.status || 'TODO',
    appliedAt: item.appliedAt,
    nextStepAt: item.nextStepAt,
    notes: item.notes || '后端暂未补充投递说明',
  }))
}

function normalizeFairRows(data) {
  const page = ensurePage({
    content: data?.items || data?.content || [],
    totalElements: data?.totalItems,
    totalPages: data?.totalPages,
    page: data?.page ? Number(data.page) - 1 : 0,
  })

  return page.content.map((item) => ({
    id: item.id,
    title: item.title || '未命名招聘会',
    companyName: item.companyName || item.title || '企业待补充',
    city: item.city || '城市待补充',
    industry: item.industry || '行业待补充',
    location: item.location || '地点待补充',
    description: item.description || '后端暂未补充招聘会说明',
    startTime: item.startTime,
    applyDeadline: item.applyDeadline,
    statusLabel: item.statusLabel || (item.expired ? '已结束' : '未开始'),
    applyStatusLabel: item.applyStatusLabel || (item.applicationClosed ? '报名截止' : '可报名'),
    applyUrl: item.applyUrl || '',
    expired: Boolean(item.expired),
    applicationClosed: Boolean(item.applicationClosed),
  }))
}

function normalizeNotifications(data) {
  const items = Array.isArray(data) ? data : ensureArray(data?.items)
  return {
    items,
    unreadCount: Array.isArray(data)
      ? items.filter((item) => !item.readFlag).length
      : Number(data?.unreadCount || items.filter((item) => !item.readFlag).length),
  }
}

export default function JobStationPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [overview, setOverview] = useState(createJobPreviewOverview())
  const [notice, setNotice] = useState(previewDataNotice('就业主站'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      if (!canUseRemote) {
        setOverview(createJobPreviewOverview())
        setNotice(previewDataNotice('就业主站'))
        return
      }

      setLoading(true)
      try {
        const [resumeData, recommendationData, applicationData, fairData] = await withRequestTimeout(
          Promise.all([
            employmentApi.resume(token),
            employmentApi.recommendations({}, token),
            employmentApi.applications(token),
            employmentApi.fairs({ page: 1, size: 6 }),
          ]),
          8000,
          '就业主站数据读取超时，请检查后端服务。',
        )

        if (!active) return

        setOverview({
          metrics: [
            { label: '简历状态', value: normalizeResume(resumeData).resumeFile.hasFile ? '已上传附件' : '仅在线简历' },
            { label: '岗位推荐', value: `${normalizeRecommendationRows(recommendationData).length} 条` },
            { label: '投递记录', value: `${normalizeApplicationRows(applicationData).length} 条` },
          ],
          resume: normalizeResume(resumeData),
          recommendations: normalizeRecommendationRows(recommendationData).slice(0, 3),
          applications: normalizeApplicationRows(applicationData).slice(0, 3),
          fairs: normalizeFairRows(fairData).slice(0, 3),
        })
        setNotice(remoteDataNotice('就业主站'))
      } catch (error) {
        if (!active) return
        setOverview(createJobPreviewOverview())
        setNotice(fallbackDataNotice('就业主站', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOverview()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="就业主站"
        title="把简历、推荐、投递和招聘会收进同一张求职推进台。"
        lead="先看总览，再进子页。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步就业主站数据…</div> : null}

      <section className="v2-summary-strip" aria-label="就业主站摘要">
        {overview.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>先看整体状态，再进入对应子页继续操作。</p>
          </article>
        ))}
      </section>

      <section className="v2-overview-grid" aria-label="就业主站入口">
        <Link className="v2-preview-panel" to="/station/job/resume">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">简历中心</p>
              <strong>先看简历目标与附件状态，再决定要不要继续编辑。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            <div className="v2-preview-row">
              <strong>{overview.resume.targetRole || '目标岗位待补充'}</strong>
              <span>{overview.resume.expectedCities || '意向城市待补充'}</span>
              <small>{overview.resume.resumeFile.hasFile ? overview.resume.resumeFile.fileName : '当前没有附件简历'}</small>
            </div>
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/job/recommendations">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">岗位推荐</p>
              <strong>先看匹配理由，再决定要不要进一步投递。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.recommendations.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.companyName} / {item.title}</strong>
                <span>{item.city}</span>
                <small>{firstNonEmpty(item.matchReasons[0], item.description, '等待补充匹配理由')}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-overview-grid" aria-label="就业支撑入口">
        <Link className="v2-preview-panel" to="/station/job/applications">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">投递跟踪</p>
              <strong>把每条投递挂在清晰的推进线上，而不是散在笔记里。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.applications.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.companyName} / {item.jobTitle}</strong>
                <span>{item.status}</span>
                <small>{item.notes}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/job/fairs">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">招聘会</p>
              <strong>先按城市和行业筛会场，再判断是否进入报名或现场。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.fairs.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.city} / {item.industry}</span>
                <small>{item.description}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>
    </div>
  )
}

export function JobResumePage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [resume, setResume] = useState(createJobResumePreview())
  const [notice, setNotice] = useState(previewDataNotice('简历'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadResume() {
      if (!canUseRemote) {
        setResume(createJobResumePreview())
        setNotice(previewDataNotice('简历'))
        return
      }

      setLoading(true)
      try {
        const data = await withRequestTimeout(
          employmentApi.resume(token),
          8000,
          '简历数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setResume(normalizeResume(data))
        setNotice(remoteDataNotice('简历'))
      } catch (error) {
        if (!active) return
        setResume(createJobResumePreview())
        setNotice(fallbackDataNotice('简历', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadResume()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="简历中心"
        pathItems={[
          { label: '就业主站', to: '/station/job' },
          { label: '简历档案' },
        ]}
        title="先确认求职定位和附件状态，再进入简历编辑与导出。"
        lead="这个页面不保留右栏。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}
      {loading ? <div className="v2-status-note">正在同步简历数据…</div> : null}

      <section className="v2-summary-strip" aria-label="简历摘要">
        <article className="v2-summary-card">
          <span>目标岗位</span>
          <strong>{resume.targetRole || '待补充'}</strong>
          <p>{resume.expectedCities || '意向城市待补充'}</p>
        </article>
        <article className="v2-summary-card">
          <span>目标行业</span>
          <strong>{resume.expectedIndustries || '待补充'}</strong>
          <p>{resume.skillTags || '技能标签待补充'}</p>
        </article>
        <article className="v2-summary-card">
          <span>附件状态</span>
          <strong>{resume.resumeFile.hasFile ? '已上传' : '未上传'}</strong>
          <p>{resume.resumeFile.hasFile ? resume.resumeFile.fileName : '当前仅展示在线简历字段'}</p>
        </article>
      </section>

      <section className="v2-card-grid">
        <article className="v2-module-card">
          <strong>目标岗位</strong>
          <p>{resume.targetRole || '待补充'}</p>
          <p>{resume.expectedCities || '意向城市待补充'}</p>
        </article>
        <article className="v2-module-card">
          <strong>行业与技能</strong>
          <p>{resume.expectedIndustries || '行业待补充'}</p>
          <p>{resume.skillTags || '技能标签待补充'}</p>
        </article>
        <article className="v2-module-card">
          <strong>项目关键词</strong>
          <p>{resume.projectKeywords || '项目关键词待补充'}</p>
        </article>
        <article className="v2-module-card">
          <strong>附件简历</strong>
          <p>{resume.resumeFile.hasFile ? resume.resumeFile.fileName : '当前没有附件简历'}</p>
          <p>
            {resume.resumeFile.hasFile
              ? `${formatBytes(resume.resumeFile.fileSize)} / ${formatDateTimeLabel(resume.resumeFile.uploadedAt)}`
              : '上传后会在这里显示文件信息'}
          </p>
        </article>
      </section>

      <section className="v2-article-card">
        <p className="v2-kicker">个人摘要</p>
        <p>{resume.selfEvaluation || '后端暂未补充简历摘要。'}</p>
      </section>
    </div>
  )
}

export function JobRecommendationsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    keyword: '',
    city: '',
    industry: '',
    roleType: '',
    skills: '',
    onlyApplyable: false,
  })
  const [rows, setRows] = useState(createJobRecommendationPreviewRows())
  const [notifications, setNotifications] = useState({ items: [], unreadCount: 0 })
  const [notice, setNotice] = useState(previewDataNotice('岗位推荐'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRecommendations() {
      if (!canUseRemote) {
        setRows(createJobRecommendationPreviewRows())
        setNotifications({ items: [], unreadCount: 0 })
        setNotice(previewDataNotice('岗位推荐'))
        return
      }

      setLoading(true)
      try {
        const [recommendationData, notificationData] = await withRequestTimeout(
          Promise.all([
            employmentApi.recommendations(filters, token),
            employmentApi.notifications(token).catch(() => ({ items: [], unreadCount: 0 })),
          ]),
          8000,
          '岗位推荐数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeRecommendationRows(recommendationData))
        setNotifications(normalizeNotifications(notificationData))
        setNotice(remoteDataNotice('岗位推荐'))
      } catch (error) {
        if (!active) return
        setRows(createJobRecommendationPreviewRows())
        setNotifications({ items: [], unreadCount: 0 })
        setNotice(fallbackDataNotice('岗位推荐', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRecommendations()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.city, filters.industry, filters.keyword, filters.onlyApplyable, filters.roleType, filters.skills, token])

  async function handleDeleteNotification(notificationId) {
    if (!canUseRemote) {
      setNotice('请使用真实账号登录后再删除就业提醒。')
      return
    }

    try {
      await employmentApi.deleteNotification(notificationId, token)
      setNotifications((current) => {
        const items = ensureArray(current.items).filter((item) => item.id !== notificationId)
        return { ...current, items, unreadCount: items.filter((item) => !item.readFlag).length, totalItems: items.length }
      })
    } catch (error) {
      setNotice(fallbackDataNotice('就业提醒删除', error))
    }
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="岗位推荐"
          pathItems={[
            { label: '就业主站', to: '/station/job' },
            { label: '推荐结果' },
          ]}
          title="先读懂匹配理由，再决定是否进入投递链。"
          lead="主区看结果，右栏保留筛选和提醒。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新推荐结果…</div> : null}

        <section className="v2-summary-strip" aria-label="岗位推荐摘要">
          <article className="v2-summary-card">
            <span>推荐数量</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下命中的推荐岗位数。</p>
          </article>
          <article className="v2-summary-card">
            <span>最高匹配</span>
            <strong>{rows[0]?.matchScore || 0}</strong>
            <p>当前列表中最靠前的匹配分。</p>
          </article>
          <article className="v2-summary-card">
            <span>未读提醒</span>
            <strong>{notifications.unreadCount}</strong>
            <p>真实账号下会同步就业提醒消息。</p>
          </article>
        </section>

        <section className="v2-feed-list" aria-label="岗位推荐列表">
          {rows.map((item) => (
            <article className="v2-feed-item" key={item.id}>
              <div className="v2-feed-index">{item.matchScore}</div>
              <div className="v2-feed-body">
                <strong>{item.companyName} / {item.title}</strong>
                <p>{item.city} / {item.industry} / {item.companyType}</p>
                <p>{item.salaryRange}</p>
                <p>{item.description}</p>
                <div className="v2-tag-row">
                  {item.matchReasons.map((reason) => <span key={reason}>{reason}</span>)}
                </div>
              </div>
              <div className="v2-feed-side">
                <span>{item.applyUrl ? '可外链投递' : '站内先判断'}</span>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <div className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有推荐岗位</strong>
                <p>可以放宽城市、行业或技能条件后再试一次。</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>城市</span>
              <input
                type="text"
                value={filters.city}
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>行业</span>
              <input
                type="text"
                value={filters.industry}
                onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>岗位类型</span>
              <input
                type="text"
                value={filters.roleType}
                onChange={(event) => setFilters((current) => ({ ...current, roleType: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>技能关键词</span>
              <input
                type="text"
                value={filters.skills}
                onChange={(event) => setFilters((current) => ({ ...current, skills: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>只看可投递</span>
              <div className="v2-segment-group">
                {[
                  { value: false, label: '全部' },
                  { value: true, label: '只看可投递' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`v2-segment-button ${filters.onlyApplyable === item.value ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, onlyApplyable: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">就业提醒</p>
          <div className="v2-check-list">
            {notifications.items.slice(0, 4).map((item) => (
              <div className="v2-check-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.content}</span>
                <span>{item.readFlag ? '已读' : '未读'}</span>
                <button className="v2-secondary-link" type="button" onClick={() => handleDeleteNotification(item.id)}>删除</button>
              </div>
            ))}
            {!notifications.items.length ? <p>当前没有就业提醒。</p> : null}
          </div>
        </section>
      </aside>
    </>
  )
}

export function JobApplicationsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    status: 'all',
    keyword: '',
  })
  const [rows, setRows] = useState(createJobApplicationPreviewRows())
  const [resume, setResume] = useState(createJobResumePreview())
  const [notice, setNotice] = useState(previewDataNotice('投递跟踪'))
  const [loading, setLoading] = useState(false)

  const filteredRows = rows.filter((item) => {
    const matchStatus = filters.status === 'all' || item.status === filters.status
    const keyword = filters.keyword.trim().toLowerCase()
    const text = `${item.companyName} ${item.jobTitle} ${item.notes}`.toLowerCase()
    const matchKeyword = !keyword || text.includes(keyword)
    return matchStatus && matchKeyword
  })

  useEffect(() => {
    let active = true

    async function loadApplications() {
      if (!canUseRemote) {
        setRows(createJobApplicationPreviewRows())
        setResume(createJobResumePreview())
        setNotice(previewDataNotice('投递跟踪'))
        return
      }

      setLoading(true)
      try {
        const [applicationData, resumeData] = await withRequestTimeout(
          Promise.all([
            employmentApi.applications(token),
            employmentApi.resume(token),
          ]),
          8000,
          '投递记录读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeApplicationRows(applicationData))
        setResume(normalizeResume(resumeData))
        setNotice(remoteDataNotice('投递跟踪'))
      } catch (error) {
        if (!active) return
        setRows(createJobApplicationPreviewRows())
        setResume(createJobResumePreview())
        setNotice(fallbackDataNotice('投递跟踪', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadApplications()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="投递跟踪"
          pathItems={[
            { label: '就业主站', to: '/station/job' },
            { label: '投递进度' },
          ]}
          title="把每条投递挂到清楚的推进线上，下一步动作一眼能看见。"
          lead="主区专门看推进状态。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在同步投递记录…</div> : null}

        <section className="v2-summary-strip" aria-label="投递跟踪摘要">
          <article className="v2-summary-card">
            <span>投递条数</span>
            <strong>{rows.length}</strong>
            <p>当前账号已有的投递记录数。</p>
          </article>
          <article className="v2-summary-card">
            <span>当前简历</span>
            <strong>{resume.resumeFile.hasFile ? '附件已就绪' : '仅在线简历'}</strong>
            <p>{resume.resumeFile.hasFile ? resume.resumeFile.fileName : '还没有上传附件简历'}</p>
          </article>
          <article className="v2-summary-card">
            <span>筛选后</span>
            <strong>{filteredRows.length}</strong>
            <p>当前状态和关键词条件下保留下来的记录数。</p>
          </article>
        </section>

        <section className="v2-timeline-card" aria-label="投递进度轨道">
          {filteredRows.map((item) => (
            <article className="v2-timeline-row" key={item.id}>
              <div className="v2-timeline-pin">{item.status.slice(0, 2)}</div>
              <div className="v2-timeline-body">
                <strong>{item.companyName} / {item.jobTitle}</strong>
                <p>投递时间：{item.appliedAt ? formatDateTimeLabel(item.appliedAt) : '待补充'}</p>
                <span>{item.notes}</span>
                <div className="v2-tag-row">
                  <span>{item.status}</span>
                  <span>下一步：{item.nextStepAt ? formatDateTimeLabel(item.nextStepAt) : '待安排'}</span>
                </div>
              </div>
            </article>
          ))}
          {!filteredRows.length ? (
            <div className="v2-status-note">当前筛选条件下没有投递记录。</div>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>投递状态</span>
              <div className="v2-segment-group">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'TODO', label: '待处理' },
                  { value: 'APPLIED', label: '已投递' },
                  { value: 'INTERVIEW', label: '面试中' },
                  { value: 'OFFER', label: '已录用' },
                  { value: 'REJECTED', label: '未通过' },
                ].map((item) => (
                  <button
                    key={item.value}
                    className={`v2-segment-button ${filters.status === item.value ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, status: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                placeholder="公司或岗位"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

      </aside>
    </>
  )
}

export function JobFairsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [filters, setFilters] = useState({
    city: '',
    industry: '',
    keyword: '',
    includeExpired: false,
  })
  const [rows, setRows] = useState(createJobFairPreviewRows())
  const [preference, setPreference] = useState({
    cities: '',
    industries: '',
    roleTypes: '',
    salaryRange: '',
    companyTypes: '',
  })
  const [notice, setNotice] = useState(previewDataNotice('招聘会'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    async function loadFairs() {
      if (!canUseRemote) {
        setRows(createJobFairPreviewRows())
        setPreference({
          cities: '上海, 杭州',
          industries: '互联网',
          roleTypes: '后端, 产品',
          salaryRange: '15k-25k',
          companyTypes: '民企, 外企',
        })
        setNotice(previewDataNotice('招聘会'))
        return
      }

      setLoading(true)
      try {
        const [fairData, preferenceData] = await withRequestTimeout(
          Promise.all([
            employmentApi.fairs({ ...filters, page: 1, size: 12 }),
            employmentApi.preference(token).catch(() => ({})),
          ]),
          8000,
          '招聘会数据读取超时，请检查后端服务。',
        )
        if (!active) return
        setRows(normalizeFairRows(fairData))
        setPreference({
          cities: preferenceData?.cities || '',
          industries: preferenceData?.industries || '',
          roleTypes: preferenceData?.roleTypes || '',
          salaryRange: preferenceData?.salaryRange || '',
          companyTypes: preferenceData?.companyTypes || '',
        })
        setNotice(remoteDataNotice('招聘会'))
      } catch (error) {
        if (!active) return
        setRows(createJobFairPreviewRows())
        setNotice(fallbackDataNotice('招聘会', error))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadFairs()
    return () => {
      active = false
    }
  }, [canUseRemote, filters.city, filters.includeExpired, filters.industry, filters.keyword, token])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="招聘会"
          pathItems={[
            { label: '就业主站', to: '/station/job' },
            { label: '会场目录' },
          ]}
          title="先按城市和行业筛会场，再决定是现场参加还是继续线上投递。"
          lead="主区只保留会场目录。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}
        {loading ? <div className="v2-status-note">正在刷新招聘会列表…</div> : null}

        <section className="v2-summary-strip" aria-label="招聘会摘要">
          <article className="v2-summary-card">
            <span>会场数量</span>
            <strong>{rows.length}</strong>
            <p>当前筛选下可浏览的招聘会数量。</p>
          </article>
          <article className="v2-summary-card">
            <span>偏好城市</span>
            <strong>{preference.cities || '待补充'}</strong>
            <p>{preference.industries || '行业偏好待补充'}</p>
          </article>
          <article className="v2-summary-card">
            <span>岗位偏好</span>
            <strong>{preference.roleTypes || '待补充'}</strong>
            <p>{preference.salaryRange || '薪资偏好待补充'}</p>
          </article>
        </section>

        <section className="v2-feed-list" aria-label="招聘会目录">
          {rows.map((item) => (
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
                <span>{item.startTime ? formatDateTimeLabel(item.startTime) : '待补充'}</span>
                <span>{item.applyDeadline ? formatDateTimeLabel(item.applyDeadline) : '待补充'}</span>
              </div>
            </article>
          ))}
          {!rows.length ? (
            <div className="v2-feed-item">
              <div className="v2-feed-body">
                <strong>当前没有匹配的招聘会</strong>
                <p>可以放宽城市、行业或关键词条件后再试一次。</p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">筛选控制器</p>
          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>城市</span>
              <input
                type="text"
                value={filters.city}
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>行业</span>
              <input
                type="text"
                value={filters.industry}
                onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>关键词</span>
              <input
                type="text"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
            <label className="v2-field">
              <span>包含已结束</span>
              <div className="v2-segment-group">
                {[
                  { value: false, label: '只看未结束' },
                  { value: true, label: '显示全部' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`v2-segment-button ${filters.includeExpired === item.value ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, includeExpired: item.value }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </label>
          </form>
        </section>
      </aside>
    </>
  )
}
