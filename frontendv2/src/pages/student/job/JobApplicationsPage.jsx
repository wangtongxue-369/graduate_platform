import { useDeferredValue, useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import { useSearchParams } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import JobApplicationBoard from '@/components/job/JobApplicationBoard.jsx'
import JobApplicationEditorDrawer from '@/components/job/JobApplicationEditorDrawer.jsx'
import JobSummaryStrip from '@/components/job/JobSummaryStrip.jsx'
import {
  buildApplicationGroups,
  normalizeApplications,
  normalizeResume,
} from '@/lib/job/employmentNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  formatDateTimeLabel,
  previewDataNotice,
  remoteDataNotice,
  shouldShowStatusNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const emptyDraft = {
  id: '',
  jobPostingId: '',
  companyName: '',
  jobTitle: '',
  city: '',
  industry: '',
  companyType: '',
  roleType: '',
  salaryRange: '',
  educationRequirement: '',
  majorKeywords: '',
  skillTags: '',
  applyUrl: '',
  channel: '',
  status: 'TODO',
  interviewRound: '',
  interviewMode: '',
  interviewLocation: '',
  contactInfo: '',
  resumeFileName: '',
  appliedAt: '',
  nextStepAt: '',
  offerSalary: '',
  failureReason: '',
  notes: '',
}

const laneFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'todo', label: '待启动' },
  { value: 'active', label: '推进中' },
  { value: 'interview', label: '面试中' },
  { value: 'result', label: '已出结果' },
]

function createFallbackApplications() {
  return normalizeApplications([
    {
      id: 401,
      companyName: '云阶教育',
      jobTitle: '平台后端工程师',
      city: '上海',
      industry: '教育科技',
      status: 'TODO',
      nextStepAt: '2026-06-20T10:00:00',
      notes: '补齐简历后进入官网投递。',
    },
  ])
}

function normalizeDraft(record, resumeFileName = '') {
  return {
    ...emptyDraft,
    id: record?.id ? String(record.id) : '',
    jobPostingId: record?.jobPostingId ? String(record.jobPostingId) : '',
    companyName: record?.companyName || '',
    jobTitle: record?.jobTitle || '',
    city: record?.city || '',
    industry: record?.industry || '',
    companyType: record?.companyType || '',
    roleType: record?.roleType || '',
    salaryRange: record?.salaryRange || '',
    educationRequirement: record?.educationRequirement || '',
    majorKeywords: record?.majorKeywords || '',
    skillTags: record?.skillTags || '',
    applyUrl: record?.applyUrl || '',
    channel: record?.channel || '',
    status: record?.status || 'TODO',
    interviewRound: record?.interviewRound || '',
    interviewMode: record?.interviewMode || '',
    interviewLocation: record?.interviewLocation || '',
    contactInfo: record?.contactInfo || '',
    resumeFileName: record?.resumeFileName || resumeFileName,
    appliedAt: record?.appliedAt ? String(record.appliedAt).slice(0, 16) : '',
    nextStepAt: record?.nextStepAt ? String(record.nextStepAt).slice(0, 16) : '',
    offerSalary: record?.offerSalary || '',
    failureReason: record?.failureReason || '',
    notes: record?.notes || '',
  }
}

function createDraftFromSearchParams(searchParams, resumeFileName) {
  return normalizeDraft({
    jobPostingId: searchParams.get('jobPostingId') || '',
    companyName: searchParams.get('companyName') || '',
    jobTitle: searchParams.get('jobTitle') || '',
    city: searchParams.get('city') || '',
    industry: searchParams.get('industry') || '',
    companyType: searchParams.get('companyType') || '',
    roleType: searchParams.get('roleType') || '',
    salaryRange: searchParams.get('salaryRange') || '',
    educationRequirement: searchParams.get('educationRequirement') || '',
    majorKeywords: searchParams.get('majorKeywords') || '',
    skillTags: searchParams.get('skillTags') || '',
    applyUrl: searchParams.get('applyUrl') || '',
    status: 'TODO',
  }, resumeFileName)
}

function toApiPayload(draft) {
  return {
    jobPostingId: draft.jobPostingId ? Number(draft.jobPostingId) : null,
    companyName: draft.companyName,
    jobTitle: draft.jobTitle,
    city: draft.city,
    industry: draft.industry,
    companyType: draft.companyType,
    roleType: draft.roleType,
    salaryRange: draft.salaryRange,
    educationRequirement: draft.educationRequirement,
    majorKeywords: draft.majorKeywords,
    skillTags: draft.skillTags,
    applyUrl: draft.applyUrl,
    channel: draft.channel,
    status: draft.status,
    interviewRound: draft.interviewRound,
    interviewMode: draft.interviewMode,
    interviewLocation: draft.interviewLocation,
    contactInfo: draft.contactInfo,
    resumeFileName: draft.resumeFileName,
    appliedAt: draft.appliedAt || null,
    nextStepAt: draft.nextStepAt || null,
    offerSalary: draft.offerSalary,
    failureReason: draft.failureReason,
    notes: draft.notes,
  }
}

export default function JobApplicationsPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({ lane: 'all', keyword: '' })
  const deferredKeyword = useDeferredValue(filters.keyword)
  const [applications, setApplications] = useState(createFallbackApplications())
  const [resume, setResume] = useState(normalizeResume({}))
  const [notice, setNotice] = useState(previewDataNotice('投递跟踪'))
  const [drawerMode, setDrawerMode] = useState('create')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draft, setDraft] = useState(() => normalizeDraft({}, ''))
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!canUseRemote) {
        setApplications(createFallbackApplications())
        setResume(normalizeResume({}))
        setNotice(previewDataNotice('投递跟踪'))
        return
      }

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

        setApplications(normalizeApplications(applicationData))
        setResume(normalizeResume(resumeData))
        setNotice(remoteDataNotice('投递跟踪'))
      } catch (error) {
        if (!active) return
        setApplications(createFallbackApplications())
        setResume(normalizeResume({}))
        setNotice(fallbackDataNotice('投递跟踪', error))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  useEffect(() => {
    if (searchParams.get('openDrawer') !== 'create') return
    setDrawerMode('create')
    setDrawerOpen(true)
    setDraft(createDraftFromSearchParams(searchParams, resume.resumeFile.fileName || ''))
  }, [resume.resumeFile.fileName, searchParams])

  function closeDrawer() {
    setDrawerOpen(false)
    const next = new URLSearchParams(searchParams)
    next.delete('openDrawer')
    setSearchParams(next, { replace: true })
  }

  function openCreateDrawer() {
    setDrawerMode('create')
    setDrawerOpen(true)
    setDraft(normalizeDraft({}, resume.resumeFile.fileName || ''))
  }

  function openEditDrawer(item) {
    setDrawerMode('edit')
    setDrawerOpen(true)
    setDraft(normalizeDraft(item, resume.resumeFile.fileName || ''))
  }

  const groupedApplications = buildApplicationGroups(applications)
  const keyword = deferredKeyword.trim().toLowerCase()
  const filteredGroups = groupedApplications
    .filter((group) => filters.lane === 'all' || group.key === filters.lane)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const text = `${item.companyName} ${item.jobTitle} ${item.notes}`.toLowerCase()
        const keywordMatch = !keyword || text.includes(keyword)
        return keywordMatch
      }),
    }))

  const visibleCount = filteredGroups.reduce((sum, group) => sum + group.items.length, 0)
  const nextStepCount = applications.filter((item) => item.nextStepAt).length
  const upcomingStep = applications
    .filter((item) => item.nextStepAt)
    .sort((left, right) => String(left.nextStepAt).localeCompare(String(right.nextStepAt)))[0]

  const summaryItems = [
    { label: '全部投递', value: String(applications.length), note: '已建立的跟踪记录' },
    { label: '当前泳道', value: String(visibleCount), note: '筛选后仍保留在看板里的记录。' },
    { label: '下一步动作', value: String(nextStepCount), note: '需要跟进的后续节点' },
    {
      label: '简历状态',
      value: resume.resumeFile.hasFile ? '附件已就绪' : '待补充附件',
      note: resume.resumeFile.fileName || '当前只保留在线简历字段。',
    },
  ]

  async function handleSave() {
    const payload = toApiPayload(draft)
    let savedRecord = payload

    if (canUseRemote) {
      if (drawerMode === 'edit' && draft.id) {
        savedRecord = await employmentApi.updateApplication(Number(draft.id), payload, token) || payload
      } else {
        savedRecord = await employmentApi.createApplication(payload, token) || payload
      }
    }

    const nextRecord = normalizeApplications([{
      ...payload,
      ...savedRecord,
      id: savedRecord?.id || payload.jobPostingId || Date.now(),
    }])[0]

    setApplications((current) => {
      if (drawerMode === 'edit' && draft.id) {
        return current.map((item) => (String(item.id) === draft.id ? nextRecord : item))
      }
      return [nextRecord, ...current]
    })

    setNotice(drawerMode === 'edit' ? '投递记录已更新。' : '投递记录已新增。')
    closeDrawer()
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    if (canUseRemote) {
      await employmentApi.deleteApplication(pendingDelete.id, token)
    }

    setApplications((current) => current.filter((item) => item.id !== pendingDelete.id))
    setPendingDelete(null)
    setNotice('投递记录已移除。')
  }

  return (
    <>
      <div className="v2-main-column" data-testid="job-applications-page">
        <PageIntro
          kicker="投递跟踪"
          kickerAsTitle
          pathItems={[
            { label: '就业主站', to: '/station/job' },
          ]}
        />

        {shouldShowStatusNotice(notice) ? <div className="v2-status-note">{notice}</div> : null}

        <JobSummaryStrip items={summaryItems} />

        <JobApplicationBoard
          groups={filteredGroups}
          onEdit={openEditDrawer}
          onDelete={setPendingDelete}
        />
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <div className="v2-side-card__head">
            <div>
              <p className="v2-kicker">看板控制台</p>
              <h3>筛选后再决定是否开启新记录</h3>
            </div>
            <button className="v2-primary-link" type="button" onClick={openCreateDrawer}>新建记录</button>
          </div>

          <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
            <label className="v2-field">
              <span>推进泳道</span>
              <div className="v2-segment-group" role="group" aria-label="推进泳道筛选">
                {laneFilterOptions.map((item) => (
                  <button
                    key={item.value}
                    className={`v2-segment-button ${filters.lane === item.value ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, lane: item.value }))}
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
                placeholder="公司、岗位、备注"
                value={filters.keyword}
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </label>
          </form>
        </section>

        <section className="v2-side-card">
          <p className="v2-kicker">下一步提醒</p>
          <div className="v2-check-list">
            <div className="v2-check-row">
              <strong>附件简历</strong>
              <span>{resume.resumeFile.hasFile ? resume.resumeFile.fileName : '当前还没有附件简历。'}</span>
            </div>
            <div className="v2-check-row">
              <strong>最近节点</strong>
              <span>{upcomingStep ? `${upcomingStep.companyName} / ${formatDateTimeLabel(upcomingStep.nextStepAt)}` : '当前没有待跟进节点。'}</span>
            </div>
          </div>
        </section>
      </aside>

      <JobApplicationEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        draft={draft}
        onChange={setDraft}
        onClose={closeDrawer}
        onSave={handleSave}
      />

      <EmploymentConfirmModal
        open={Boolean(pendingDelete)}
        title="确认删除这条投递记录？"
        body="删除后会从当前推进看板移除这条记录。"
        confirmLabel="删除记录"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
