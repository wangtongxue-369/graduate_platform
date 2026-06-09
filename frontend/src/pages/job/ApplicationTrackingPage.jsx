import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

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
const toApiPayload = form => ({
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
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [resumeFile, setResumeFile] = useState(resumeFileDefaults)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const statusCounts = statuses
    .map(status => ({ status, count: records.filter(record => record.status === status).length }))
    .filter(item => item.count > 0)
  const upcomingSteps = records
    .filter(record => record.nextStepAt)
    .sort((left, right) => String(left.nextStepAt).localeCompare(String(right.nextStepAt)))
    .slice(0, 3)

  const loadRecords = useCallback(async () => {
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
  }, [canUseRemote, token])

  useEffect(() => {
    if (canUseRemote) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadRecords()
    } else {
      setLoading(false)
    }
  }, [canUseRemote, loadRecords])
  useEffect(() => {
    const jobPostingId = searchParams.get('jobPostingId')
    const companyName = searchParams.get('companyName')
    const jobTitle = searchParams.get('jobTitle')
    if (!jobPostingId && !companyName && !jobTitle) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(prev => ({
      ...prev,
      jobPostingId: jobPostingId || prev.jobPostingId,
      companyName: companyName || prev.companyName,
      jobTitle: jobTitle || prev.jobTitle,
      status: 'TODO',
    }))
  }, [searchParams])
  if (!authLoading && !isAuthed) return <Navigate to="/login" replace />

  function hasDuplicateRecord() {
    const formPostingId = String(form.jobPostingId || '')
    const formCompanyName = normalizeText(form.companyName)
    const formJobTitle = normalizeText(form.jobTitle)
    return records.some((record) => {
      if (record.id === editingId) return false
      if (formPostingId && String(record.jobPostingId || '') === formPostingId) return true
      return formCompanyName && formJobTitle
        && normalizeText(record.companyName) === formCompanyName
        && normalizeText(record.jobTitle) === formJobTitle
    })
  }

  async function saveRecord() {
    if (!canUseRemote) { setError('请使用真实账号登录后再保存投递记录。'); return }
    if (!editingId && hasDuplicateRecord() && !window.confirm('已存在相同岗位的投递记录，仍要继续新增吗？')) return
    setSaving(true)
    setError('')
    try {
      if (editingId) await employmentApi.updateApplication(editingId, toApiPayload(form), token)
      else await employmentApi.createApplication(toApiPayload(form), token)
      setForm(emptyForm)
      setEditingId(null)
      await loadRecords()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }
  async function downloadResumeFile() {
    if (!resumeFile.hasFile) return
    if (!canUseRemote) { setError('请使用真实账号登录后再下载附件。'); return }
    setError('')
    try {
      await employmentApi.downloadResumeFile(token)
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteRecord(id) {
    if (!canUseRemote) { setError('请使用真实账号登录后再删除投递记录。'); return }
    if (!window.confirm('确认删除这条投递记录？删除后无法在页面恢复。')) return
    setError('')
    try {
      await employmentApi.deleteApplication(id, token)
      await loadRecords()
    } catch (e) {
      setError(e.message)
    }
  }
  function startEdit(record) { setEditingId(record.id); setForm({ companyName: record.companyName || '', jobTitle: record.jobTitle || '', jobPostingId: record.jobPostingId || '', status: record.status || 'APPLIED', appliedAt: record.appliedAt ? record.appliedAt.slice(0, 16) : '', nextStepAt: record.nextStepAt ? record.nextStepAt.slice(0, 16) : '', notes: record.notes || '' }) }
  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <div className="app"><Navbar /><main className="shell"><section className="section">
      <div className="section-head"><p className="eyebrow">就业方向 - 投递进度</p><h2>投递进度跟踪</h2><p className="muted">记录平台外投递，维护状态流转，并跟踪下一步安排。</p>{error && <div className="error-text">{error}</div>}</div>
      <div className="grid-two"><div className="feature-card"><div className="card-title">{editingId ? '编辑投递记录' : '新增投递记录'}</div><div className="form-grid"><label className="field"><span>公司</span><input value={form.companyName} onChange={e => updateField('companyName', e.target.value)} /></label><label className="field"><span>岗位名称</span><input value={form.jobTitle} onChange={e => updateField('jobTitle', e.target.value)} /></label><label className="field"><span>关联岗位 ID</span><input value={form.jobPostingId || ''} onChange={e => updateField('jobPostingId', e.target.value)} placeholder="从岗位详情自动带入" /></label><label className="field"><span>状态</span><select value={form.status} onChange={e => updateField('status', e.target.value)}>{statuses.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label className="field"><span>投递时间</span><input type="datetime-local" value={form.appliedAt} onChange={e => updateField('appliedAt', e.target.value)} /></label><label className="field"><span>下一步时间</span><input type="datetime-local" value={form.nextStepAt} onChange={e => updateField('nextStepAt', e.target.value)} /></label><label className="field"><span>备注</span><textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} /></label></div><button className="btn primary" type="button" onClick={saveRecord} disabled={saving}>{saving ? '保存中...' : '保存记录'}</button>{editingId && <button className="btn ghost" type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>取消编辑</button>}</div>
      <div className="feature-card metrics"><div className="card-title">投递概览</div><div className="tag-row">{statusCounts.length === 0 ? <span className="tag subtle">暂无记录</span> : statusCounts.map(item => <span className="tag subtle" key={item.status}>{statusLabels[item.status]} {item.count}</span>)}</div><div className="card-title">当前简历附件</div>{resumeFile.hasFile ? <div className="resume-status-panel"><strong>{resumeFile.fileName || '未命名附件'}</strong><span>{formatFileSize(resumeFile.fileSize)} · {resumeFile.fileType || '类型待定'} · {formatDateTime(resumeFile.uploadedAt)}</span><button className="btn outline small" type="button" onClick={downloadResumeFile}>下载附件</button></div> : <p className="muted">暂无附件，<Link to="/job/resume">前往简历页上传</Link>。</p>}<div className="card-title">下一步</div>{upcomingSteps.length === 0 ? <p className="muted">暂无下一步安排。</p> : upcomingSteps.map(item => <p className="room-sub" key={item.id}>{formatDateTime(item.nextStepAt)} · {item.companyName} · {item.jobTitle}</p>)}</div></div>
      <div className="track-grid">{loading && <div className="track-card"><p className="muted">正在加载投递记录...</p></div>}{!loading && records.length === 0 && <div className="track-card"><p className="muted">暂无投递记录。</p></div>}{records.map(record => <div className="track-card" key={record.id}><div className="track-head"><h3>{record.companyName}</h3><span className="tag subtle">{statusLabels[record.status] || record.status}</span></div><p className="muted">{record.jobTitle} - 投递时间：{formatDateTime(record.appliedAt)}</p><p className="room-sub">下一步：{formatDateTime(record.nextStepAt)}</p><p>{record.notes || '暂无备注'}</p><button className="btn outline small" type="button" onClick={() => startEdit(record)}>编辑</button><button className="btn ghost small" type="button" onClick={() => deleteRecord(record.id)}>删除</button></div>)}</div>
      <Link className="btn ghost" to="/job">返回就业面板</Link>
    </section></main><Footer /></div>
  )
}
