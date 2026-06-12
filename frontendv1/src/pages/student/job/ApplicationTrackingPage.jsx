import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import { createPreviewApplications, createPreviewResume } from '@/lib/employmentPreview.js'

const statuses = ['TODO', 'APPLIED', 'VIEWED', 'WRITTEN_TEST', 'INTERVIEW', 'OFFER', 'REJECTED', 'CLOSED']
const statusLabels = {
  TODO: '待处理',
  APPLIED: '已投递',
  VIEWED: '已查看',
  WRITTEN_TEST: '笔试中',
  INTERVIEW: '面试中',
  OFFER: '已录用',
  REJECTED: '未通过',
  CLOSED: '已关闭',
}
const emptyForm = { companyName: '', jobTitle: '', jobPostingId: '', status: 'APPLIED', appliedAt: '', nextStepAt: '', notes: '' }
const resumeFileDefaults = { hasFile: false, fileName: '', fileSize: null, fileType: '', uploadedAt: '' }

const toApiPayload = (form) => ({
  ...form,
  jobPostingId: form.jobPostingId ? Number(form.jobPostingId) : null,
  appliedAt: form.appliedAt || null,
  nextStepAt: form.nextStepAt || null,
})

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
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

export default function ApplicationTrackingPage() {
  const { token, isAuthed, loading: authLoading } = useAuth()
  const canUseRemote = Boolean(isAuthed && token && token !== 'dev-token')
  const isPreviewMode = Boolean(isAuthed && token === 'dev-token')
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [resumeFile, setResumeFile] = useState(resumeFileDefaults)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadRecords = useCallback(async () => {
    if (isPreviewMode) {
      const previewResume = createPreviewResume()
      setRecords(createPreviewApplications())
      setResumeFile({ ...resumeFileDefaults, ...(previewResume.resumeFile || {}) })
      setLoading(false)
      setError('')
      return
    }

    if (!canUseRemote) {
      setRecords([])
      setResumeFile(resumeFileDefaults)
      setLoading(false)
      setError('请使用真实账号登录后查看投递记录。')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [applicationData, resumeData] = await Promise.all([
        employmentApi.applications(token),
        employmentApi.resume(token),
      ])
      setRecords(Array.isArray(applicationData) ? applicationData : [])
      setResumeFile({ ...resumeFileDefaults, ...(resumeData?.resumeFile || {}) })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [canUseRemote, isPreviewMode, token])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const jobPostingId = searchParams.get('jobPostingId')
    const companyName = searchParams.get('companyName')
    const jobTitle = searchParams.get('jobTitle')

    if (!jobPostingId && !companyName && !jobTitle) return

    setForm((prev) => ({
      ...prev,
      jobPostingId: jobPostingId || prev.jobPostingId,
      companyName: companyName || prev.companyName,
      jobTitle: jobTitle || prev.jobTitle,
      status: 'TODO',
    }))
  }, [searchParams])

  if (!authLoading && !isAuthed) return <Navigate replace to="/login" />

  const statusCounts = statuses
    .map((status) => ({ status, count: records.filter((record) => record.status === status).length }))
    .filter((item) => item.count > 0)

  function hasDuplicateRecord() {
    const formPostingId = String(form.jobPostingId || '')
    const formCompanyName = normalizeText(form.companyName)
    const formJobTitle = normalizeText(form.jobTitle)

    return records.some((record) => {
      if (record.id === editingId) return false
      if (formPostingId && String(record.jobPostingId || '') === formPostingId) return true
      return formCompanyName
        && formJobTitle
        && normalizeText(record.companyName) === formCompanyName
        && normalizeText(record.jobTitle) === formJobTitle
    })
  }

  function buildLocalRecord(id) {
    return {
      id,
      companyName: form.companyName.trim(),
      jobTitle: form.jobTitle.trim(),
      jobPostingId: form.jobPostingId ? Number(form.jobPostingId) : null,
      status: form.status || 'APPLIED',
      appliedAt: form.appliedAt || null,
      nextStepAt: form.nextStepAt || null,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  async function saveRecord() {
    if (!form.companyName.trim() || !form.jobTitle.trim()) {
      setError('公司和岗位不能为空。')
      return
    }

    if (isPreviewMode) {
      if (!editingId && hasDuplicateRecord()) {
        setError('预览记录里已经有同一岗位，请直接编辑现有记录。')
        return
      }

      setError('')
      const nextId = editingId || Date.now()
      const nextRecord = buildLocalRecord(nextId)
      setRecords((prev) => (
        editingId
          ? prev.map((record) => (record.id === editingId ? { ...record, ...nextRecord, createdAt: record.createdAt } : record))
          : [nextRecord, ...prev]
      ))
      setEditingId(null)
      setForm(emptyForm)
      setMessage(editingId ? '已在预览中更新这条投递记录；正式写入仍需真实账号和后端。' : '已在预览中新增一条投递记录；正式写入仍需真实账号和后端。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再保存投递记录。')
      return
    }
    if (!editingId && hasDuplicateRecord() && !window.confirm('已存在相同岗位的投递记录，仍要继续新增吗？')) return

    setSaving(true)
    setError('')

    try {
      if (editingId) await employmentApi.updateApplication(editingId, toApiPayload(form), token)
      else await employmentApi.createApplication(toApiPayload(form), token)
      setForm(emptyForm)
      setEditingId(null)
      setMessage(editingId ? '投递记录已更新。' : '投递记录已新增。')
      await loadRecords()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(id) {
    if (isPreviewMode) {
      setRecords((prev) => prev.filter((record) => record.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
      setError('')
      setMessage('已在预览中移除这条记录。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再删除投递记录。')
      return
    }
    if (!window.confirm('确认删除这条投递记录？删除后无法在页面恢复。')) return

    setError('')

    try {
      await employmentApi.deleteApplication(id, token)
      setMessage('投递记录已删除。')
      await loadRecords()
    } catch (e) {
      setError(e.message)
    }
  }

  async function downloadResumeFile() {
    if (!resumeFile.hasFile) return

    if (isPreviewMode) {
      setError('')
      setMessage('预览模式不提供真实附件下载；请连接后端后再下载。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再下载附件。')
      return
    }

    setError('')

    try {
      await employmentApi.downloadResumeFile(token)
    } catch (e) {
      setError(e.message)
    }
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm({
      companyName: record.companyName || '',
      jobTitle: record.jobTitle || '',
      jobPostingId: record.jobPostingId || '',
      status: record.status || 'APPLIED',
      appliedAt: record.appliedAt ? record.appliedAt.slice(0, 16) : '',
      nextStepAt: record.nextStepAt ? record.nextStepAt.slice(0, 16) : '',
      notes: record.notes || '',
    })
  }

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const emptyStateText = isPreviewMode ? '当前还没有演示记录，可直接在左侧新增一条。' : '暂无投递记录。'

  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '就业站', to: '/station/job' }, { label: '投递轨道' }]} hint="从详情页加入跟踪后，回到这里维护状态和下一步事项。" />
      <header className="v1-task-head">
        <p className="v1-eyebrow">job / application tracking</p>
        <h1>投递跟踪</h1>
        <p>这里保存投递进度、下一步事项和简历附件状态；不保存单次投递使用过的附件快照。</p>
      </header>
      <div className="v1-callout">提示：从岗位详情加入跟踪会预填公司与岗位；你仍需手动维护状态和下一步事项。</div>
      {isPreviewMode ? <PreviewBanner>当前为开发预览：你可以直接演示新增、编辑和删除记录，正式写入仍需真实账号与后端。</PreviewBanner> : null}

      <div className="v1-task-split">
        <div className="v1-form-stack">
          <label className="v1-field">
            <span>公司</span>
            <input value={form.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
          </label>
          <label className="v1-field">
            <span>岗位</span>
            <input value={form.jobTitle} onChange={(e) => updateField('jobTitle', e.target.value)} />
          </label>
          <label className="v1-field">
            <span>关联岗位 ID</span>
            <input value={form.jobPostingId} onChange={(e) => updateField('jobPostingId', e.target.value)} />
          </label>
          <div className="v1-form-grid">
            <label className="v1-field">
              <span>状态</span>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
            <label className="v1-field">
              <span>投递时间</span>
              <input type="datetime-local" value={form.appliedAt} onChange={(e) => updateField('appliedAt', e.target.value)} />
            </label>
          </div>
          <label className="v1-field">
            <span>下一步时间</span>
            <input type="datetime-local" value={form.nextStepAt} onChange={(e) => updateField('nextStepAt', e.target.value)} />
          </label>
          <label className="v1-field">
            <span>备注</span>
            <textarea rows="4" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
          </label>
          <div className="v1-action-row">
            <button className="v1-btn v1-btn--primary" type="button" onClick={saveRecord} disabled={saving}>
              {saving ? '保存中...' : (editingId ? '更新记录' : '新增记录')}
            </button>
            {editingId ? <button className="v1-btn" type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>取消编辑</button> : null}
          </div>
        </div>

        <aside className="v1-file-panel">
          <strong>当前简历附件</strong>
          {resumeFile.hasFile ? <span>{resumeFile.fileName} · {formatFileSize(resumeFile.fileSize)}</span> : <span>未上传</span>}
          <div className="v1-action-row">
            <button className="v1-btn" type="button" onClick={downloadResumeFile} disabled={!resumeFile.hasFile}>下载附件</button>
            <Link className="v1-btn" to="/job/resume">前往简历页</Link>
          </div>
          <div className="v1-tag-row">
            {statusCounts.length === 0 ? <span className="v1-tag">暂无记录</span> : statusCounts.map((item) => (
              <span className="v1-tag" key={item.status}>{statusLabels[item.status]} {item.count}</span>
            ))}
          </div>
        </aside>
      </div>

      <div className="v1-card-stack">
        {loading ? <div className="v1-list-card">正在加载投递记录...</div> : null}
        {!loading && records.length === 0 ? <div className="v1-list-card">{emptyStateText}</div> : null}
        {records.map((record) => (
          <article className="v1-list-card" key={record.id}>
            <strong>{record.companyName} · {record.jobTitle}</strong>
            <span>状态：{statusLabels[record.status] || record.status}</span>
            <span>下一步：{formatDateTime(record.nextStepAt)}</span>
            <p>{record.notes || '暂无备注'}</p>
            <div className="v1-action-row">
              <button className="v1-btn" type="button" onClick={() => startEdit(record)}>编辑</button>
              <button className="v1-btn" type="button" onClick={() => deleteRecord(record.id)}>删除</button>
            </div>
          </article>
        ))}
      </div>

      {message ? <div className="v1-message">{message}</div> : null}
      {error ? <div className="v1-error">{error}</div> : null}
    </section>
  )
}
