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

export default function EmploymentManagementPage() {
  const { user, token, isAuthed, loading: authLoading } = useAuth()
  const [fairs, setFairs] = useState([])
  const [jobs, setJobs] = useState([])
  const [fairForm, setFairForm] = useState(emptyFair)
  const [jobForm, setJobForm] = useState(emptyJob)
  const [editingFairId, setEditingFairId] = useState(null)
  const [editingJobId, setEditingJobId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [actingKey, setActingKey] = useState('')

  const activeFairCount = fairs.filter((item) => item.active !== false).length
  const activeJobCount = jobs.filter((item) => item.active !== false).length

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [fairData, jobData] = await Promise.all([
        adminEmploymentApi.fairs(token),
        adminEmploymentApi.jobs(token),
      ])
      setFairs(Array.isArray(fairData) ? fairData : [])
      setJobs(Array.isArray(jobData) ? jobData : [])
    } catch (e) {
      setError(e.message || '加载就业管理数据失败')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthed && user?.role === 'admin') {
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

  function startEditFair(fair) {
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
      setMessage(`站内提醒已触发，生成 ${result.createdCount || 0} 条匹配提醒。`)
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
      await adminEmploymentApi.deleteJob(id, token)
      setMessage('岗位已删除。')
      if (editingJobId === id) resetJobForm()
      await loadAll()
    } catch (e) {
      setError(e.message || '删除岗位失败')
    } finally {
      setActingKey('')
    }
  }

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

            <div className="grid-two">
              <form className="admin-form-surface" onSubmit={saveFair}>
                <div className="track-head">
                  <h3>{editingFairId ? '编辑招聘会' : '新增招聘会'}</h3>
                  <span className="admin-status-chip is-success">{fairs.length} 条已维护</span>
                </div>
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

              <form className="admin-form-surface" onSubmit={saveJob}>
                <div className="track-head">
                  <h3>{editingJobId ? '编辑岗位' : '新增岗位'}</h3>
                  <span className="admin-status-chip is-success">{jobs.length} 条已维护</span>
                </div>
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
            </div>

            <div className="grid-two">
              <div className="admin-surface-card">
                <div className="track-head">
                  <h3>招聘会列表</h3>
                  <span className="admin-status-chip is-warning">{activeFairCount} 条启用中</span>
                </div>
                {loading ? (
                  <p className="muted">正在加载招聘会...</p>
                ) : fairs.length === 0 ? (
                  <p className="muted">暂无招聘会。</p>
                ) : (
                  <div className="admin-record-grid">
                    {fairs.map((fair) => (
                      <article className="admin-record-card admin-data-row admin-employment-row" key={fair.id}>
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
              </div>

              <div className="admin-surface-card">
                <div className="track-head">
                  <h3>岗位列表</h3>
                  <span className="admin-status-chip is-warning">{activeJobCount} 条启用中</span>
                </div>
                {loading ? (
                  <p className="muted">正在加载岗位...</p>
                ) : jobs.length === 0 ? (
                  <p className="muted">暂无岗位。</p>
                ) : (
                  <div className="admin-record-grid">
                    {jobs.map((job) => (
                      <article className="admin-record-card admin-data-row admin-employment-row" key={job.id}>
                        <div className="admin-record-main">
                          <div className="track-head">
                            <strong>{job.title}</strong>
                            <span className={`admin-status-chip ${activeStatusClassMap[String(job.active !== false)] || 'is-neutral'}`}>
                              {job.active !== false ? '启用中' : '已停用'}
                            </span>
                          </div>
                          <p className="muted">{job.companyName || '未设置企业'} · {job.city || '城市待定'} · {job.roleType || '岗位类型待定'}</p>
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
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
