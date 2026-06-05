import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { adminEmploymentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const emptyFair = {
  title: '',
  companyName: '',
  city: '',
  industry: '',
  targetRoles: '',
  location: '',
  startTime: '',
  endTime: '',
  applyDeadline: '',
  applyUrl: '',
  description: '',
  active: true,
}

const emptyJob = {
  title: '',
  companyName: '',
  city: '',
  industry: '',
  companyType: '',
  roleType: '',
  salaryRange: '',
  educationRequirement: '',
  majorKeywords: '',
  skillTags: '',
  description: '',
  applyUrl: '',
  active: true,
}

const activeStatusClassMap = {
  true: 'is-success',
  false: 'is-neutral',
}

const ADMIN_PAGE_SIZE = 5
const emptyListQuery = { keyword: '', active: 'all', page: 1 }
const emptyResumeListQuery = { keyword: '', fileStatus: 'all', page: 1 }
const resumeFileDefaults = { hasFile: false, fileName: '', fileSize: null, fileType: '', uploadedAt: '' }

function normalizeDateFields(payload, keys) {
  const next = { ...payload }
  keys.forEach((key) => {
    next[key] = next[key] || null
  })
  return next
}

function formatDateTime(value) {
  if (!value) return '未设置'
  return value.replace('T', ' ').slice(0, 16)
}

function formatFileSize(size) {
  if (!size || Number.isNaN(Number(size))) return '0 B'
  const bytes = Number(size)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function filterManagedItems(items, query, fields) {
  const keyword = query.keyword.trim().toLowerCase()
  const expectedActive = query.active === 'all' ? null : query.active === 'true'
  return items.filter((item) => {
    if (expectedActive !== null && (item.active !== false) !== expectedActive) return false
    if (!keyword) return true
    return fields.some((field) => String(item[field] || '').toLowerCase().includes(keyword))
  })
}

function pageItems(items, page) {
  const start = (page - 1) * ADMIN_PAGE_SIZE
  return items.slice(start, start + ADMIN_PAGE_SIZE)
}

function normalizeResumeSummary(item) {
  return {
    ...(item || {}),
    resumeFile: { ...resumeFileDefaults, ...(item?.resumeFile || {}) },
  }
}

function filterResumeSummaries(items, query) {
  const keyword = query.keyword.trim().toLowerCase()
  const expectedHasFile = query.fileStatus === 'all' ? null : query.fileStatus === 'uploaded'
  return items.filter((item) => {
    const resumeFile = item.resumeFile || resumeFileDefaults
    if (expectedHasFile !== null && Boolean(resumeFile.hasFile) !== expectedHasFile) return false
    if (!keyword) return true
    return [
      item.username, item.email, item.studentId, item.school, item.major, resumeFile.fileName,
    ].some((value) => String(value || '').toLowerCase().includes(keyword))
  })
}

export default function EmploymentManagementPage() {
  const { user, token, isAuthed, loading: authLoading } = useAuth()
  const [fairs, setFairs] = useState([])
  const [jobs, setJobs] = useState([])
  const [resumeSummaries, setResumeSummaries] = useState([])
  const [fairForm, setFairForm] = useState(emptyFair)
  const [jobForm, setJobForm] = useState(emptyJob)
  const [editingFairId, setEditingFairId] = useState(null)
  const [editingJobId, setEditingJobId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [actingKey, setActingKey] = useState('')
  const [activePanel, setActivePanel] = useState('fairs')
  const [fairListQuery, setFairListQuery] = useState(emptyListQuery)
  const [jobListQuery, setJobListQuery] = useState(emptyListQuery)
  const [resumeListQuery, setResumeListQuery] = useState(emptyResumeListQuery)

  const activeFairCount = fairs.filter((item) => item.active !== false).length
  const activeJobCount = jobs.filter((item) => item.active !== false).length
  const uploadedResumeCount = resumeSummaries.filter((item) => item.resumeFile?.hasFile).length
  const filteredFairs = filterManagedItems(fairs, fairListQuery, [
    'title', 'companyName', 'city', 'industry', 'targetRoles', 'location', 'applyUrl',
  ])
  const filteredJobs = filterManagedItems(jobs, jobListQuery, [
    'title', 'companyName', 'city', 'industry', 'companyType', 'roleType', 'salaryRange', 'applyUrl',
  ])
  const filteredResumeSummaries = filterResumeSummaries(resumeSummaries, resumeListQuery)
  const fairTotalPages = Math.max(1, Math.ceil(filteredFairs.length / ADMIN_PAGE_SIZE))
  const jobTotalPages = Math.max(1, Math.ceil(filteredJobs.length / ADMIN_PAGE_SIZE))
  const resumeTotalPages = Math.max(1, Math.ceil(filteredResumeSummaries.length / ADMIN_PAGE_SIZE))
  const currentFairPage = Math.min(fairListQuery.page, fairTotalPages)
  const currentJobPage = Math.min(jobListQuery.page, jobTotalPages)
  const currentResumePage = Math.min(resumeListQuery.page, resumeTotalPages)
  const pagedFairs = pageItems(filteredFairs, currentFairPage)
  const pagedJobs = pageItems(filteredJobs, currentJobPage)
  const pagedResumeSummaries = pageItems(filteredResumeSummaries, currentResumePage)

  const panelMeta = {
    fairs: {
      key: 'fairs',
      label: '招聘会管理',
      shortLabel: '招聘会',
      description: '维护招聘会源数据，统一管理排期、地点与提醒触发。',
      count: fairs.length,
      activeCount: activeFairCount,
      summary: editingFairId ? '当前正在编辑招聘会条目。' : '可直接新增、编辑或停用招聘会。',
    },
    jobs: {
      key: 'jobs',
      label: '岗位管理',
      shortLabel: '岗位',
      description: '维护岗位源数据，统一管理投递入口与岗位启用状态。',
      count: jobs.length,
      activeCount: activeJobCount,
      summary: editingJobId ? '当前正在编辑岗位条目。' : '可直接新增、编辑或停用岗位。',
    },
    resumes: {
      key: 'resumes',
      label: '简历附件状态',
      shortLabel: '简历',
      description: '只读查看用户当前简历附件上传状态，不提供下载、上传或删除管理动作。',
      count: resumeSummaries.length,
      activeCount: uploadedResumeCount,
      summary: `已上传 ${uploadedResumeCount} 份附件，仅展示安全元数据。`,
    },
  }

  const currentPanel = panelMeta[activePanel]

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [fairData, jobData, resumeData] = await Promise.all([
        adminEmploymentApi.fairs(token),
        adminEmploymentApi.jobs(token),
        adminEmploymentApi.resumes(token),
      ])
      setFairs(Array.isArray(fairData) ? fairData : [])
      setJobs(Array.isArray(jobData) ? jobData : [])
      setResumeSummaries(Array.isArray(resumeData) ? resumeData.map(normalizeResumeSummary) : [])
    } catch (e) {
      setError(e.message || '加载就业管理数据失败')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthed && user?.role === 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAll()
    }
  }, [isAuthed, user?.role, loadAll])

  if (!authLoading && (!isAuthed || user?.role !== 'admin')) {
    return <Navigate to="/login" replace />
  }

  const updateFair = (field, value) => {
    setMessage('')
    setFairForm((current) => ({ ...current, [field]: value }))
  }

  const updateJob = (field, value) => {
    setMessage('')
    setJobForm((current) => ({ ...current, [field]: value }))
  }

  const updateFairListQuery = (field, value) => {
    setFairListQuery((current) => ({ ...current, [field]: value, page: field === 'page' ? value : 1 }))
  }

  const updateJobListQuery = (field, value) => {
    setJobListQuery((current) => ({ ...current, [field]: value, page: field === 'page' ? value : 1 }))
  }

  const updateResumeListQuery = (field, value) => {
    setResumeListQuery((current) => ({ ...current, [field]: value, page: field === 'page' ? value : 1 }))
  }

  function startEditFair(fair) {
    setActivePanel('fairs')
    setEditingFairId(fair.id)
    setFairForm({
      ...emptyFair,
      ...fair,
      startTime: (fair.startTime || '').slice(0, 16),
      endTime: (fair.endTime || '').slice(0, 16),
      applyDeadline: (fair.applyDeadline || '').slice(0, 16),
    })
    setMessage(`正在编辑招聘会：${fair.title}`)
  }

  function startEditJob(job) {
    setActivePanel('jobs')
    setEditingJobId(job.id)
    setJobForm({ ...emptyJob, ...job })
    setMessage(`正在编辑岗位：${job.title}`)
  }

  function resetFairForm() {
    setEditingFairId(null)
    setFairForm(emptyFair)
  }

  function resetJobForm() {
    setEditingJobId(null)
    setJobForm(emptyJob)
  }

  async function saveFair(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setActingKey('save-fair')
    try {
      const payload = normalizeDateFields(fairForm, ['startTime', 'endTime', 'applyDeadline'])
      if (editingFairId) {
        await adminEmploymentApi.updateFair(editingFairId, payload, token)
        setMessage('招聘会已更新，前台会按启用状态展示。')
      } else {
        await adminEmploymentApi.createFair(payload, token)
        setMessage('招聘会已创建，前台会按启用状态展示。')
      }
      resetFairForm()
      await loadAll()
    } catch (e) {
      setError(e.message || '保存招聘会失败')
    } finally {
      setActingKey('')
    }
  }

  async function saveJob(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setActingKey('save-job')
    try {
      if (editingJobId) {
        await adminEmploymentApi.updateJob(editingJobId, jobForm, token)
        setMessage('岗位已更新，前台会按启用状态展示。')
      } else {
        await adminEmploymentApi.createJob(jobForm, token)
        setMessage('岗位已创建，前台会按启用状态展示。')
      }
      resetJobForm()
      await loadAll()
    } catch (e) {
      setError(e.message || '保存岗位失败')
    } finally {
      setActingKey('')
    }
  }

  async function triggerNotification(relatedType, relatedId) {
    setError('')
    setMessage('')
    setActingKey(`notify-${relatedType}-${relatedId}`)
    try {
      const result = await adminEmploymentApi.triggerNotification({ relatedType, relatedId }, token)
      const skipped = result.skippedDuplicateCount || 0
      setMessage(`站内提醒已触发，生成 ${result.createdCount || 0} 条匹配提醒${skipped ? `，跳过 ${skipped} 条重复提醒` : ''}。`)
    } catch (e) {
      setError(e.message || '触发提醒失败')
    } finally {
      setActingKey('')
    }
  }

  async function deleteFair(id) {
    if (!window.confirm('确认删除该招聘会？如只是暂时下架，建议改为停用。')) return
    setError('')
    setMessage('')
    setActingKey(`delete-fair-${id}`)
    try {
      await adminEmploymentApi.deleteFair(id, token)
      setMessage('招聘会已删除。')
      if (editingFairId === id) resetFairForm()
      await loadAll()
    } catch (e) {
      setError(e.message || '删除招聘会失败')
    } finally {
      setActingKey('')
    }
  }

  async function deleteJob(id) {
    if (!window.confirm('确认删除该岗位？如已有投递记录，建议改为停用以保留历史关联。')) return
    setError('')
    setMessage('')
    setActingKey(`delete-job-${id}`)
    try {
      const result = await adminEmploymentApi.deleteJob(id, token)
      setMessage(result?.deactivated ? '岗位已有投递记录引用，已改为停用以保留历史关联。' : '岗位已删除。')
      if (editingJobId === id) resetJobForm()
      await loadAll()
    } catch (e) {
      setError(e.message || '删除岗位失败')
    } finally {
      setActingKey('')
    }
  }

  const renderFairFormBlock = () => (
    <>
      <div className="track-head">
        <div>
          <h3>{editingFairId ? '编辑招聘会' : '新增招聘会'}</h3>
          <p className="muted">完善招聘会基础信息、时间节点与展示状态。</p>
        </div>
        <span className="admin-status-chip is-success">{fairs.length} 条已维护</span>
      </div>

      <form onSubmit={saveFair}>
        <div className="admin-form-grid two-columns">
          <label className="field">
            <span>标题</span>
            <input value={fairForm.title} onChange={(event) => updateFair('title', event.target.value)} required />
          </label>
          <label className="field">
            <span>企业</span>
            <input value={fairForm.companyName} onChange={(event) => updateFair('companyName', event.target.value)} required />
          </label>
          <label className="field">
            <span>城市</span>
            <input value={fairForm.city || ''} onChange={(event) => updateFair('city', event.target.value)} />
          </label>
          <label className="field">
            <span>行业</span>
            <input value={fairForm.industry || ''} onChange={(event) => updateFair('industry', event.target.value)} />
          </label>
          <label className="field">
            <span>目标岗位</span>
            <input value={fairForm.targetRoles || ''} onChange={(event) => updateFair('targetRoles', event.target.value)} />
          </label>
          <label className="field">
            <span>地点</span>
            <input value={fairForm.location || ''} onChange={(event) => updateFair('location', event.target.value)} />
          </label>
          <label className="field">
            <span>开始时间</span>
            <input type="datetime-local" value={fairForm.startTime || ''} onChange={(event) => updateFair('startTime', event.target.value)} />
          </label>
          <label className="field">
            <span>结束时间</span>
            <input type="datetime-local" value={fairForm.endTime || ''} onChange={(event) => updateFair('endTime', event.target.value)} />
          </label>
          <label className="field">
            <span>网申截止</span>
            <input type="datetime-local" value={fairForm.applyDeadline || ''} onChange={(event) => updateFair('applyDeadline', event.target.value)} />
          </label>
          <label className="field">
            <span>申请链接</span>
            <input value={fairForm.applyUrl || ''} onChange={(event) => updateFair('applyUrl', event.target.value)} />
          </label>
          <label className="field admin-field-wide">
            <span>展示状态</span>
            <select value={fairForm.active ? 'true' : 'false'} onChange={(event) => updateFair('active', event.target.value === 'true')}>
              <option value="true">启用</option>
              <option value="false">停用</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>说明</span>
          <textarea rows="4" value={fairForm.description || ''} onChange={(event) => updateFair('description', event.target.value)} />
        </label>

        <div className="admin-inline-actions">
          <button className="btn primary" type="submit" disabled={actingKey === 'save-fair'}>
            {actingKey === 'save-fair' ? '保存中...' : '保存招聘会'}
          </button>
          {editingFairId ? (
            <button className="btn ghost" type="button" onClick={resetFairForm}>取消编辑</button>
          ) : null}
        </div>
      </form>
    </>
  )

  const renderJobFormBlock = () => (
    <>
      <div className="track-head">
        <div>
          <h3>{editingJobId ? '编辑岗位' : '新增岗位'}</h3>
          <p className="muted">完善岗位要求、投递入口与前台展示状态。</p>
        </div>
        <span className="admin-status-chip is-success">{jobs.length} 条已维护</span>
      </div>

      <form onSubmit={saveJob}>
        <div className="admin-form-grid two-columns">
          <label className="field">
            <span>岗位名称</span>
            <input value={jobForm.title} onChange={(event) => updateJob('title', event.target.value)} required />
          </label>
          <label className="field">
            <span>企业</span>
            <input value={jobForm.companyName} onChange={(event) => updateJob('companyName', event.target.value)} required />
          </label>
          <label className="field">
            <span>城市</span>
            <input value={jobForm.city || ''} onChange={(event) => updateJob('city', event.target.value)} />
          </label>
          <label className="field">
            <span>行业</span>
            <input value={jobForm.industry || ''} onChange={(event) => updateJob('industry', event.target.value)} />
          </label>
          <label className="field">
            <span>企业类型</span>
            <input value={jobForm.companyType || ''} onChange={(event) => updateJob('companyType', event.target.value)} placeholder="国企 / 民企 / 外企" />
          </label>
          <label className="field">
            <span>岗位类型</span>
            <input value={jobForm.roleType || ''} onChange={(event) => updateJob('roleType', event.target.value)} />
          </label>
          <label className="field">
            <span>薪资范围</span>
            <input value={jobForm.salaryRange || ''} onChange={(event) => updateJob('salaryRange', event.target.value)} />
          </label>
          <label className="field">
            <span>学历要求</span>
            <input value={jobForm.educationRequirement || ''} onChange={(event) => updateJob('educationRequirement', event.target.value)} />
          </label>
          <label className="field">
            <span>专业关键词</span>
            <input value={jobForm.majorKeywords || ''} onChange={(event) => updateJob('majorKeywords', event.target.value)} />
          </label>
          <label className="field">
            <span>技能标签</span>
            <input value={jobForm.skillTags || ''} onChange={(event) => updateJob('skillTags', event.target.value)} />
          </label>
          <label className="field">
            <span>申请链接</span>
            <input value={jobForm.applyUrl || ''} onChange={(event) => updateJob('applyUrl', event.target.value)} />
          </label>
          <label className="field admin-field-wide">
            <span>展示状态</span>
            <select value={jobForm.active ? 'true' : 'false'} onChange={(event) => updateJob('active', event.target.value === 'true')}>
              <option value="true">启用</option>
              <option value="false">停用</option>
            </select>
          </label>
        </div>

        <label className="field">
          <span>岗位描述</span>
          <textarea rows="4" value={jobForm.description || ''} onChange={(event) => updateJob('description', event.target.value)} />
        </label>

        <div className="admin-inline-actions">
          <button className="btn primary" type="submit" disabled={actingKey === 'save-job'}>
            {actingKey === 'save-job' ? '保存中...' : '保存岗位'}
          </button>
          {editingJobId ? (
            <button className="btn ghost" type="button" onClick={resetJobForm}>取消编辑</button>
          ) : null}
        </div>
      </form>
    </>
  )


  const renderResumeReadonlyBlock = () => (
    <>
      <div className="track-head">
        <div>
          <h3>简历附件状态</h3>
          <p className="muted">管理员仅查看当前附件是否存在及安全元数据，不接触对象存储地址。</p>
        </div>
        <span className="admin-status-chip is-neutral">只读</span>
      </div>
      <div className="admin-note-panel">
        <p>该面板不提供上传、下载、替换或删除入口；学生需在前台简历页自行管理附件。</p>
      </div>
      <div className="admin-capability-grid">
        <article className="admin-record-card">
          <strong>隐私边界</strong>
          <p className="muted">仅显示文件名、大小、类型和上传时间，不展示 COS Key、签名 URL 或公开访问地址。</p>
        </article>
        <article className="admin-record-card">
          <strong>当前状态</strong>
          <p className="muted">共 {resumeSummaries.length} 名用户，{uploadedResumeCount} 名已上传当前简历附件。</p>
        </article>
      </div>
    </>
  )

  const renderListControls = (query, updateQuery, totalItems, totalPages, currentPage) => (
    <div className="admin-form-grid two-columns">
      <label className="field">
        <span>关键词</span>
        <input
          value={query.keyword}
          onChange={(event) => updateQuery('keyword', event.target.value)}
          placeholder="按标题、企业、城市、行业筛选"
        />
      </label>
      <label className="field">
        <span>状态</span>
        <select value={query.active} onChange={(event) => updateQuery('active', event.target.value)}>
          <option value="all">全部状态</option>
          <option value="true">仅启用</option>
          <option value="false">仅停用</option>
        </select>
      </label>
      <div className="admin-inline-actions admin-field-wide">
        <span className="admin-status-chip is-neutral">匹配 {totalItems} 条</span>
        <button
          className="btn outline small"
          type="button"
          disabled={currentPage <= 1}
          onClick={() => updateQuery('page', Math.max(1, currentPage - 1))}
        >
          上一页
        </button>
        <span className="admin-status-chip is-neutral">{currentPage} / {totalPages}</span>
        <button
          className="btn outline small"
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => updateQuery('page', Math.min(totalPages, currentPage + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  )

  const renderFairListBlock = () => (
    <>
      <div className="track-head">
        <div>
          <h3>招聘会列表</h3>
          <p className="muted">查看已维护的招聘会记录，并按需编辑、提醒或删除。</p>
        </div>
        <span className="admin-status-chip is-warning">{activeFairCount} 条启用中</span>
      </div>

      {!loading && fairs.length > 0 ? renderListControls(
        fairListQuery, updateFairListQuery, filteredFairs.length, fairTotalPages, currentFairPage,
      ) : null}

      {loading ? (
        <p className="muted">正在加载招聘会...</p>
      ) : fairs.length === 0 ? (
        <p className="muted">暂无招聘会，可先在左侧创建第一条记录。</p>
      ) : filteredFairs.length === 0 ? (
        <p className="muted">当前筛选条件下没有招聘会。</p>
      ) : (
        <div className="admin-employment-list-grid">
          {pagedFairs.map((fair) => (
            <article className="admin-record-card" key={fair.id}>
              <div className="admin-record-main">
                <div className="track-head">
                  <strong>{fair.title}</strong>
                  <span className={`admin-status-chip ${activeStatusClassMap[String(fair.active !== false)] || 'is-neutral'}`}>
                    {fair.active !== false ? '启用中' : '已停用'}
                  </span>
                </div>
                <p className="muted">{fair.companyName || '未设置企业'} · {fair.city || '城市待定'} · {fair.industry || '行业待定'}</p>
                <div className="admin-record-meta">
                  <span>开始：{formatDateTime(fair.startTime)}</span>
                  <span>截止：{formatDateTime(fair.applyDeadline)}</span>
                  <span>{fair.targetRoles || '未设置目标岗位'}</span>
                </div>
              </div>
              <div className="admin-record-side">
                <span className="muted">{fair.location || '地点待补充'}</span>
                <div className="admin-inline-actions">
                  <button className="btn outline small" type="button" onClick={() => startEditFair(fair)}>编辑</button>
                  <button
                    className="btn outline small"
                    type="button"
                    disabled={actingKey === `notify-FAIR-${fair.id}`}
                    onClick={() => triggerNotification('FAIR', fair.id)}
                  >
                    {actingKey === `notify-FAIR-${fair.id}` ? '发送中...' : '触发提醒'}
                  </button>
                  <button
                    className="btn ghost small"
                    type="button"
                    disabled={actingKey === `delete-fair-${fair.id}`}
                    onClick={() => deleteFair(fair.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )

  const renderJobListBlock = () => (
    <>
      <div className="track-head">
        <div>
          <h3>岗位列表</h3>
          <p className="muted">查看岗位条目、批量识别启用状态，并触发匹配提醒。</p>
        </div>
        <span className="admin-status-chip is-warning">{activeJobCount} 条启用中</span>
      </div>

      {!loading && jobs.length > 0 ? renderListControls(
        jobListQuery, updateJobListQuery, filteredJobs.length, jobTotalPages, currentJobPage,
      ) : null}

      {loading ? (
        <p className="muted">正在加载岗位...</p>
      ) : jobs.length === 0 ? (
        <p className="muted">暂无岗位，可先在左侧创建第一条记录。</p>
      ) : filteredJobs.length === 0 ? (
        <p className="muted">当前筛选条件下没有岗位。</p>
      ) : (
        <div className="admin-employment-list-grid">
          {pagedJobs.map((job) => (
            <article className="admin-record-card" key={job.id}>
              <div className="admin-record-main">
                <div className="track-head">
                  <strong>{job.title}</strong>
                  <span className={`admin-status-chip ${activeStatusClassMap[String(job.active !== false)] || 'is-neutral'}`}>
                    {job.active !== false ? '启用中' : '已停用'}
                  </span>
                </div>
                <p className="muted">{job.companyName || '未设置企业'} · {job.city || '城市待定'} · {job.companyType || '企业类型待定'} · {job.roleType || '岗位类型待定'}</p>
                <div className="admin-record-meta">
                  <span>{job.salaryRange || '薪资待补充'}</span>
                  <span>{job.educationRequirement || '学历要求待补充'}</span>
                  <span>{job.majorKeywords || job.skillTags || '未设置专业/技能标签'}</span>
                </div>
              </div>
              <div className="admin-record-side">
                <span className="muted">{job.industry || '行业待补充'}</span>
                <div className="admin-inline-actions">
                  <button className="btn outline small" type="button" onClick={() => startEditJob(job)}>编辑</button>
                  <button
                    className="btn outline small"
                    type="button"
                    disabled={actingKey === `notify-JOB-${job.id}`}
                    onClick={() => triggerNotification('JOB', job.id)}
                  >
                    {actingKey === `notify-JOB-${job.id}` ? '发送中...' : '触发提醒'}
                  </button>
                  <button
                    className="btn ghost small"
                    type="button"
                    disabled={actingKey === `delete-job-${job.id}`}
                    onClick={() => deleteJob(job.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )


  const renderResumeListControls = () => (
    <div className="admin-form-grid two-columns">
      <label className="field">
        <span>关键词</span>
        <input
          value={resumeListQuery.keyword}
          onChange={(event) => updateResumeListQuery('keyword', event.target.value)}
          placeholder="按姓名、邮箱、学号、学校、专业或文件名筛选"
        />
      </label>
      <label className="field">
        <span>附件状态</span>
        <select value={resumeListQuery.fileStatus} onChange={(event) => updateResumeListQuery('fileStatus', event.target.value)}>
          <option value="all">全部状态</option>
          <option value="uploaded">已上传</option>
          <option value="missing">未上传</option>
        </select>
      </label>
      <div className="admin-inline-actions admin-field-wide">
        <span className="admin-status-chip is-neutral">匹配 {filteredResumeSummaries.length} 条</span>
        <button
          className="btn outline small"
          type="button"
          disabled={currentResumePage <= 1}
          onClick={() => updateResumeListQuery('page', Math.max(1, currentResumePage - 1))}
        >
          上一页
        </button>
        <span className="admin-status-chip is-neutral">{currentResumePage} / {resumeTotalPages}</span>
        <button
          className="btn outline small"
          type="button"
          disabled={currentResumePage >= resumeTotalPages}
          onClick={() => updateResumeListQuery('page', Math.min(resumeTotalPages, currentResumePage + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  )

  const renderResumeListBlock = () => (
    <>
      <div className="track-head">
        <div>
          <h3>用户简历附件状态</h3>
          <p className="muted">只读展示上传状态与文件元数据，不提供管理员文件操作。</p>
        </div>
        <span className="admin-status-chip is-warning">{uploadedResumeCount} 份已上传</span>
      </div>

      {!loading && resumeSummaries.length > 0 ? renderResumeListControls() : null}

      {loading ? (
        <p className="muted">正在加载简历附件状态...</p>
      ) : resumeSummaries.length === 0 ? (
        <p className="muted">暂无可查看的用户简历状态。</p>
      ) : filteredResumeSummaries.length === 0 ? (
        <p className="muted">当前筛选条件下没有简历附件状态。</p>
      ) : (
        <div className="admin-employment-list-grid resume-summary-grid">
          {pagedResumeSummaries.map((item) => {
            const resumeFile = item.resumeFile || resumeFileDefaults
            return (
              <article className="admin-record-card" key={item.userId || item.email || item.username}>
                <div className="admin-record-main">
                  <div className="track-head">
                    <strong>{item.username || item.email || `用户 ${item.userId}`}</strong>
                    <span className={`admin-status-chip ${resumeFile.hasFile ? 'is-success' : 'is-neutral'}`}>
                      {resumeFile.hasFile ? '已上传' : '未上传'}
                    </span>
                  </div>
                  <p className="muted">{item.email || '邮箱未设置'} · {item.studentId || '学号未设置'}</p>
                  <div className="admin-record-meta">
                    <span>{item.school || '学校未设置'}</span>
                    <span>{item.major || '专业未设置'}</span>
                  </div>
                  {resumeFile.hasFile ? (
                    <div className="resume-status-panel">
                      <strong>{resumeFile.fileName || '未命名附件'}</strong>
                      <span>{formatFileSize(resumeFile.fileSize)} · {resumeFile.fileType || '类型待定'}</span>
                      <span>上传：{formatDateTime(resumeFile.uploadedAt)}</span>
                    </div>
                  ) : (
                    <p className="room-sub">该用户尚未上传当前简历附件。</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <Link className="page-back" to="/admin">返回后台</Link>
          <div className="section-head">
            <p className="eyebrow">管理后台 · 就业模块</p>
            <h2>招聘会与岗位管理</h2>
            <p className="muted">统一维护就业数据源，并按岗位或招聘会触发匹配的站内提醒。</p>
          </div>

          <div className="admin-page-shell">
            <div className="admin-summary-grid">
              <article className="admin-summary-card">
                <span className="admin-summary-label">招聘会总数</span>
                <strong className="admin-summary-value">{fairs.length}</strong>
                <p className="muted">覆盖正在维护的全部招聘会记录。</p>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">启用招聘会</span>
                <strong className="admin-summary-value">{activeFairCount}</strong>
                <p className="muted">前台当前可展示的招聘会数据。</p>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">岗位总数</span>
                <strong className="admin-summary-value">{jobs.length}</strong>
                <p className="muted">就业岗位源数据与前台保持同步。</p>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">启用岗位</span>
                <strong className="admin-summary-value">{activeJobCount}</strong>
                <p className="muted">面向用户开放投递的岗位条目。</p>
              </article>
              <article className="admin-summary-card">
                <span className="admin-summary-label">已上传简历附件</span>
                <strong className="admin-summary-value">{uploadedResumeCount}</strong>
                <p className="muted">仅统计当前附件状态，不开放管理动作。</p>
              </article>
            </div>

            {error ? (
              <div className="admin-note-panel is-danger">
                <p>{error}</p>
              </div>
            ) : null}
            {message ? (
              <div className="admin-note-panel">
                <p>{message}</p>
              </div>
            ) : null}

            <div className="admin-control-tabs" role="tablist" aria-label="就业管理对象切换">
              {Object.values(panelMeta).map((panel) => (
                <button
                  key={panel.key}
                  id={`employment-tab-${panel.key}`}
                  type="button"
                  role="tab"
                  aria-selected={activePanel === panel.key}
                  aria-controls={`employment-panel-${panel.key}`}
                  className={`admin-control-tab ${activePanel === panel.key ? 'active' : ''}`}
                  onClick={() => setActivePanel(panel.key)}
                >
                  <span className="admin-control-tab-copy">
                    <strong>{panel.label}</strong>
                    <span>{panel.summary}</span>
                  </span>
                  <span className="admin-status-chip is-neutral">总计 {panel.count}</span>
                </button>
              ))}
            </div>

            <section className="admin-surface-card admin-employment-workbench">
              <div className="track-head">
                <div>
                  <h3>{currentPanel.label}</h3>
                  <p className="muted">{currentPanel.description}</p>
                </div>
                <div className="admin-inline-actions">
                  <span className="admin-status-chip is-success">{currentPanel.key === 'resumes' ? '已上传' : '启用'} {currentPanel.activeCount}</span>
                  <span className="admin-status-chip is-neutral">总计 {currentPanel.count}</span>
                  <span className="admin-status-chip is-neutral">{currentPanel.shortLabel}工作台</span>
                </div>
              </div>

              <div
                id={`employment-panel-${currentPanel.key}`}
                className="admin-employment-workspace"
                role="tabpanel"
                aria-labelledby={`employment-tab-${currentPanel.key}`}
              >
                <div className="admin-form-surface admin-employment-form-panel">
                  {activePanel === 'fairs' ? renderFairFormBlock() : activePanel === 'jobs' ? renderJobFormBlock() : renderResumeReadonlyBlock()}
                </div>

                <div className="admin-surface-card admin-employment-list-panel">
                  {activePanel === 'fairs' ? renderFairListBlock() : activePanel === 'jobs' ? renderJobListBlock() : renderResumeListBlock()}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
