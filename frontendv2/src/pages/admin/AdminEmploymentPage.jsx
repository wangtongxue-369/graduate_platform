import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { adminEmploymentApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import AdminEmploymentEditorPanel, {
  createFairDraft,
  createJobDraft,
} from '@/components/job/AdminEmploymentEditorPanel.jsx'
import AdminEmploymentSourceList from '@/components/job/AdminEmploymentSourceList.jsx'
import AdminEmploymentTabs from '@/components/job/AdminEmploymentTabs.jsx'
import AdminEmploymentTriggerPanel from '@/components/job/AdminEmploymentTriggerPanel.jsx'
import AdminResumeStatusDrawer from '@/components/job/AdminResumeStatusDrawer.jsx'
import JobSummaryStrip from '@/components/job/JobSummaryStrip.jsx'
import { normalizeResume } from '@/lib/job/employmentNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const employmentTabs = [
  { key: 'fairs', label: '招聘会' },
  { key: 'jobs', label: '岗位台账' },
  { key: 'trigger', label: '提醒触发' },
  { key: 'resumes', label: '简历状态' },
]

function createFallbackFairs() {
  return [
    {
      id: 701,
      title: '上海春招双选会',
      companyName: '云梯教育',
      city: '上海',
      industry: '教育科技',
      targetRoles: '后端, 产品',
      location: '浦东会展中心',
      startTime: '2026-06-22T09:00:00',
      applyDeadline: '2026-06-21T18:00:00',
      active: true,
    },
  ]
}

function createFallbackJobs() {
  return [
    {
      id: 801,
      title: '平台后端工程师',
      companyName: '云梯教育',
      city: '上海',
      industry: '教育科技',
      companyType: '民企',
      roleType: '后端',
      salaryRange: '18k-24k',
      active: true,
    },
  ]
}

function normalizeResumeSummary(item) {
  return {
    ...(item || {}),
    resumeFile: {
      ...normalizeResume({}).resumeFile,
      ...(item?.resumeFile || {}),
    },
  }
}

function createFallbackResumes() {
  return [
    normalizeResumeSummary({
      id: 901,
      name: '演示学生',
      studentId: '2026901',
      school: '华东师范大学',
      major: '软件工程',
      targetRole: '平台后端工程师',
      resumeFile: {
        hasFile: true,
        fileName: 'resume-preview.pdf',
      },
    }),
  ]
}

function buildTriggerSources(fairs, jobs) {
  return [
    ...fairs.map((item) => ({ id: item.id, relatedType: 'FAIR', title: item.title })),
    ...jobs.map((item) => ({ id: item.id, relatedType: 'JOB', title: item.title })),
  ]
}

export default function AdminEmploymentPage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [activeTab, setActiveTab] = useState('fairs')
  const [fairs, setFairs] = useState(createFallbackFairs())
  const [jobs, setJobs] = useState(createFallbackJobs())
  const [resumes, setResumes] = useState(createFallbackResumes())
  const [notice, setNotice] = useState(previewDataNotice('就业运营'))
  const [selectedFair, setSelectedFair] = useState(createFallbackFairs()[0])
  const [selectedJob, setSelectedJob] = useState(createFallbackJobs()[0])
  const [creatingFair, setCreatingFair] = useState(false)
  const [creatingJob, setCreatingJob] = useState(false)
  const [fairDraft, setFairDraft] = useState(() => createFairDraft(createFallbackFairs()[0]))
  const [jobDraft, setJobDraft] = useState(() => createJobDraft(createFallbackJobs()[0]))
  const [selectedTriggerSource, setSelectedTriggerSource] = useState({
    id: createFallbackFairs()[0].id,
    relatedType: 'FAIR',
    title: createFallbackFairs()[0].title,
  })
  const [selectedResume, setSelectedResume] = useState(null)
  const [confirmTriggerOpen, setConfirmTriggerOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!canUseRemote) {
        const fallbackFairs = createFallbackFairs()
        const fallbackJobs = createFallbackJobs()
        const fallbackResumes = createFallbackResumes()
        setFairs(fallbackFairs)
        setJobs(fallbackJobs)
        setResumes(fallbackResumes)
        setSelectedFair(fallbackFairs[0] || null)
        setSelectedJob(fallbackJobs[0] || null)
        setCreatingFair(false)
        setCreatingJob(false)
        setFairDraft(createFairDraft(fallbackFairs[0]))
        setJobDraft(createJobDraft(fallbackJobs[0]))
        setSelectedTriggerSource(buildTriggerSources(fallbackFairs, fallbackJobs)[0] || null)
        setNotice(previewDataNotice('就业运营'))
        return
      }

      try {
        const [fairData, jobData, resumeData] = await withRequestTimeout(
          Promise.all([
            adminEmploymentApi.fairs(token),
            adminEmploymentApi.jobs(token),
            adminEmploymentApi.resumes(token),
          ]),
          8000,
          '就业运营数据读取超时，请检查后端服务。',
        )

        if (!active) return

        const nextFairs = Array.isArray(fairData) ? fairData : []
        const nextJobs = Array.isArray(jobData) ? jobData : []
        const nextResumes = Array.isArray(resumeData)
          ? resumeData.map((item) => normalizeResumeSummary(item))
          : []

        setFairs(nextFairs)
        setJobs(nextJobs)
        setResumes(nextResumes)
        setSelectedFair(nextFairs[0] || null)
        setSelectedJob(nextJobs[0] || null)
        setCreatingFair(false)
        setCreatingJob(false)
        setFairDraft(createFairDraft(nextFairs[0]))
        setJobDraft(createJobDraft(nextJobs[0]))
        setSelectedTriggerSource(buildTriggerSources(nextFairs, nextJobs)[0] || null)
        setNotice(remoteDataNotice('就业运营'))
      } catch (error) {
        if (!active) return
        setNotice(fallbackDataNotice('就业运营', error))
      }
    }

    load()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  const summaryItems = [
    { label: '招聘会总数', value: String(fairs.length), note: '当前在运营中的招聘会源。' },
    { label: '岗位台账', value: String(jobs.length), note: '当前在运营中的岗位记录。' },
    { label: '已上传简历', value: String(resumes.filter((item) => item.resumeFile.hasFile).length), note: '展示简历附件状态' },
    { label: '提醒源', value: String(buildTriggerSources(fairs, jobs).length), note: '可触发一轮提醒的上下文来源。' },
  ]

  function handleSelectFair(item) {
    setSelectedFair(item)
    setCreatingFair(false)
    setFairDraft(createFairDraft(item))
    setSelectedTriggerSource({ id: item.id, relatedType: 'FAIR', title: item.title })
  }

  function handleSelectJob(item) {
    setSelectedJob(item)
    setCreatingJob(false)
    setJobDraft(createJobDraft(item))
    setSelectedTriggerSource({ id: item.id, relatedType: 'JOB', title: item.title })
  }

  function handleCreateFair() {
    setSelectedFair(null)
    setCreatingFair(true)
    setFairDraft(createFairDraft())
  }

  function handleCreateJob() {
    setSelectedJob(null)
    setCreatingJob(true)
    setJobDraft(createJobDraft())
  }

  async function handleSaveFair() {
    if (!creatingFair && selectedFair?.id) {
      if (canUseRemote) {
        await adminEmploymentApi.updateFair(selectedFair.id, fairDraft, token)
      }

      const nextItem = { ...selectedFair, ...fairDraft }
      setFairs((current) => current.map((item) => (item.id === nextItem.id ? nextItem : item)))
      setSelectedFair(nextItem)
      setNotice('招聘会条目已保存。')
      return
    }

    const created = canUseRemote
      ? await adminEmploymentApi.createFair(fairDraft, token)
      : { ...fairDraft, id: Date.now() }
    const nextItem = { ...fairDraft, ...(created || {}) }
    setFairs((current) => [nextItem, ...current])
    setSelectedFair(nextItem)
    setCreatingFair(false)
    setSelectedTriggerSource({ id: nextItem.id, relatedType: 'FAIR', title: nextItem.title })
    setNotice('招聘会条目已创建。')
  }

  async function handleSaveJob() {
    if (!creatingJob && selectedJob?.id) {
      if (canUseRemote) {
        await adminEmploymentApi.updateJob(selectedJob.id, jobDraft, token)
      }

      const nextItem = { ...selectedJob, ...jobDraft }
      setJobs((current) => current.map((item) => (item.id === nextItem.id ? nextItem : item)))
      setSelectedJob(nextItem)
      setNotice('岗位条目已保存。')
      return
    }

    const created = canUseRemote
      ? await adminEmploymentApi.createJob(jobDraft, token)
      : { ...jobDraft, id: Date.now() }
    const nextItem = { ...jobDraft, ...(created || {}) }
    setJobs((current) => [nextItem, ...current])
    setSelectedJob(nextItem)
    setCreatingJob(false)
    setSelectedTriggerSource({ id: nextItem.id, relatedType: 'JOB', title: nextItem.title })
    setNotice('岗位条目已创建。')
  }

  async function confirmTrigger() {
    if (!selectedTriggerSource) return

    if (canUseRemote) {
      await adminEmploymentApi.triggerNotification({
        relatedType: selectedTriggerSource.relatedType,
        relatedId: selectedTriggerSource.id,
      }, token)
    }

    setConfirmTriggerOpen(false)
    setNotice('就业提醒已触发。')
  }

  const triggerSources = buildTriggerSources(fairs, jobs)
  const selectedResumeKey = selectedResume
    ? selectedResume.id ?? selectedResume.studentId ?? selectedResume.name
    : null

  return (
    <>
      <div className="v2-main-column" data-testid="admin-employment-page">
        <PageIntro
          kicker="就业运营"
          pathItems={[
            { label: '管理员主站', to: '/admin' },
            { label: '就业运营' },
          ]}
          title="就业运营总台"
        />

        <JobSummaryStrip items={summaryItems} />

        <AdminEmploymentTabs
          tabs={employmentTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'fairs' ? (
          <AdminEmploymentSourceList
            title="招聘会源列表"
            items={fairs}
            selectedId={creatingFair ? null : selectedFair?.id}
            onSelect={handleSelectFair}
            variant="main"
          />
        ) : null}

        {activeTab === 'jobs' ? (
          <AdminEmploymentSourceList
            title="岗位源列表"
            items={jobs}
            selectedId={creatingJob ? null : selectedJob?.id}
            onSelect={handleSelectJob}
            variant="main"
          />
        ) : null}

        {activeTab === 'trigger' ? (
          <section className="v2-feed-list v2-admin-employment-source-list" aria-label="提醒来源列表">
            {triggerSources.map((item) => {
              const selected = selectedTriggerSource?.id === item.id
                && selectedTriggerSource?.relatedType === item.relatedType
              return (
                <article className="v2-feed-item" key={`${item.relatedType}-${item.id}`}>
                  <div className="v2-feed-index">{item.relatedType === 'FAIR' ? '会' : '岗'}</div>
                  <div className="v2-feed-body">
                    <strong>{item.title}</strong>
                    <p>{item.relatedType === 'FAIR' ? '招聘会提醒来源' : '岗位提醒来源'}</p>
                  </div>
                  <div className="v2-feed-side">
                    <button
                      className={`v2-secondary-link ${selected ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => setSelectedTriggerSource(item)}
                    >
                      {selected ? '已选中' : '选择'}
                    </button>
                  </div>
                </article>
              )
            })}
            {!triggerSources.length ? <p className="v2-admin-employment-empty">当前没有可触发提醒的上下文。</p> : null}
          </section>
        ) : null}

        {activeTab === 'resumes' ? (
          <AdminEmploymentSourceList
            title="简历状态列表"
            items={resumes}
            selectedId={selectedResumeKey}
            onSelect={setSelectedResume}
            variant="main"
          />
        ) : null}
      </div>

      <aside className="v2-side-column">
        {activeTab === 'fairs' ? (
          <AdminEmploymentEditorPanel
            mode="fairs"
            draft={fairDraft}
            isCreating={creatingFair}
            onChange={setFairDraft}
            onCreate={handleCreateFair}
            onSave={handleSaveFair}
            onReset={() => setFairDraft(createFairDraft(creatingFair ? null : selectedFair))}
          />
        ) : null}

        {activeTab === 'jobs' ? (
          <AdminEmploymentEditorPanel
            mode="jobs"
            draft={jobDraft}
            isCreating={creatingJob}
            onChange={setJobDraft}
            onCreate={handleCreateJob}
            onSave={handleSaveJob}
            onReset={() => setJobDraft(createJobDraft(creatingJob ? null : selectedJob))}
          />
        ) : null}

        {activeTab === 'trigger' ? (
          <AdminEmploymentTriggerPanel
            sources={triggerSources}
            selectedSource={selectedTriggerSource}
            onSelectSource={setSelectedTriggerSource}
            onTrigger={() => setConfirmTriggerOpen(true)}
            showSources={false}
          />
        ) : null}

        {activeTab === 'resumes' ? (
          <AdminResumeStatusDrawer resume={selectedResume} onClose={() => setSelectedResume(null)} />
        ) : null}
      </aside>

      <EmploymentConfirmModal
        open={confirmTriggerOpen}
        title="确认触发当前上下文的就业提醒？"
        body="将按当前上下文向匹配学生发送一轮就业提醒。"
        confirmLabel="确认触发"
        onConfirm={confirmTrigger}
        onClose={() => setConfirmTriggerOpen(false)}
      />
    </>
  )
}
