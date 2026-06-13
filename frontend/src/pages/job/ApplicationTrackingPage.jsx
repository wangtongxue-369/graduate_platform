import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const statuses = [
  'TODO',
  'APPLIED',
  'SCREENING',
  'WRITTEN_TEST',
  'FIRST_INTERVIEW',
  'SECOND_INTERVIEW',
  'HR_INTERVIEW',
  'FINAL_INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'DECLINED',
  'REJECTED',
  'WITHDRAWN',
  'CLOSED',
]

const statusLabels = {
  TODO: '待投递',
  APPLIED: '已投递',
  SCREENING: '简历筛选中',
  VIEWED: '已查看',
  WRITTEN_TEST: '笔试',
  FIRST_INTERVIEW: '一面',
  SECOND_INTERVIEW: '二面',
  HR_INTERVIEW: 'HR 面',
  FINAL_INTERVIEW: '终面',
  INTERVIEW: '面试中',
  OFFER: 'Offer',
  ACCEPTED: '已接受',
  DECLINED: '已拒绝',
  REJECTED: '未通过',
  WITHDRAWN: '已撤回',
  CLOSED: '已关闭',
}

const channelOptions = ['官网', '招聘平台', '内推', '宣讲会', '招聘会', '邮件', '其他']
const interviewRounds = ['笔试', '一面', '二面', 'HR 面', '终面', '补充面试']
const interviewMethods = ['线上', '线下', '电话']

const emptyForm = {
  companyName: '',
  jobTitle: '',
  jobPostingId: '',
  city: '',
  industry: '',
  companyType: '',
  roleType: '',
  salaryRange: '',
  educationRequirement: '',
  majorKeywords: '',
  skillTags: '',
  applyUrl: '',
  applicationChannel: '',
  resumeFileName: '',
  contactName: '',
  contactInfo: '',
  interviewRound: '',
  interviewMethod: '',
  interviewLocation: '',
  expectedSalary: '',
  offerSalary: '',
  status: 'APPLIED',
  appliedAt: '',
  nextStepAt: '',
  lastFollowUpAt: '',
  failureReason: '',
  notes: '',
}

const resumeFileDefaults = { hasFile: false, fileName: '', fileSize: null, fileType: '', uploadedAt: '' }

const datetimeFields = ['appliedAt', 'nextStepAt', 'lastFollowUpAt']

const toApiPayload = form => ({
  ...form,
  jobPostingId: form.jobPostingId ? Number(form.jobPostingId) : null,
  ...Object.fromEntries(datetimeFields.map(field => [field, form[field] || null])),
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

function formFromRecord(record) {
  return {
    ...emptyForm,
    ...Object.fromEntries(Object.keys(emptyForm).map(key => [key, record[key] || ''])),
    jobPostingId: record.jobPostingId || '',
    status: record.status || 'APPLIED',
    appliedAt: record.appliedAt ? record.appliedAt.slice(0, 16) : '',
    nextStepAt: record.nextStepAt ? record.nextStepAt.slice(0, 16) : '',
    lastFollowUpAt: record.lastFollowUpAt ? record.lastFollowUpAt.slice(0, 16) : '',
  }
}

function fieldFromSearch(searchParams, key) {
  return searchParams.get(key) || ''
}

function DetailItem({ label, value }) {
  return (
    <div className="application-detail-item">
      <span>{label}</span>
      <strong>{value || '未设置'}</strong>
    </div>
  )
}

function TextWithSuggestions({ id, value, options, onChange, placeholder }) {
  return (
    <>
      <input list={id} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
      <datalist id={id}>{options.map(option => <option key={option} value={option} />)}</datalist>
    </>
  )
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
      const nextResumeFile = { ...resumeFileDefaults, ...(resumeData?.resumeFile || {}) }
      setRecords(Array.isArray(applicationData) ? applicationData : [])
      setResumeFile(nextResumeFile)
      setForm(prev => prev.resumeFileName ? prev : { ...prev, resumeFileName: nextResumeFile.fileName || '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [canUseRemote, token])

  useEffect(() => {
    if (canUseRemote) {
      loadRecords()
    } else {
      setLoading(false)
    }
  }, [canUseRemote, loadRecords])

  useEffect(() => {
    const jobPostingId = fieldFromSearch(searchParams, 'jobPostingId')
    const companyName = fieldFromSearch(searchParams, 'companyName')
    const jobTitle = fieldFromSearch(searchParams, 'jobTitle')
    if (!jobPostingId && !companyName && !jobTitle) return
    setForm(prev => ({
      ...prev,
      jobPostingId: jobPostingId || prev.jobPostingId,
      companyName: companyName || prev.companyName,
      jobTitle: jobTitle || prev.jobTitle,
      city: fieldFromSearch(searchParams, 'city') || prev.city,
      industry: fieldFromSearch(searchParams, 'industry') || prev.industry,
      companyType: fieldFromSearch(searchParams, 'companyType') || prev.companyType,
      roleType: fieldFromSearch(searchParams, 'roleType') || prev.roleType,
      salaryRange: fieldFromSearch(searchParams, 'salaryRange') || prev.salaryRange,
      educationRequirement: fieldFromSearch(searchParams, 'educationRequirement') || prev.educationRequirement,
      majorKeywords: fieldFromSearch(searchParams, 'majorKeywords') || prev.majorKeywords,
      skillTags: fieldFromSearch(searchParams, 'skillTags') || prev.skillTags,
      applyUrl: fieldFromSearch(searchParams, 'applyUrl') || prev.applyUrl,
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
    if (!form.jobPostingId && (!form.companyName.trim() || !form.jobTitle.trim())) {
      setError('请填写公司和岗位名称，或填写关联岗位 ID。')
      return
    }
    if (!editingId && hasDuplicateRecord() && !window.confirm('已存在相同岗位的投递记录，仍要继续新增吗？')) return
    setSaving(true)
    setError('')
    try {
      if (editingId) await employmentApi.updateApplication(editingId, toApiPayload(form), token)
      else await employmentApi.createApplication(toApiPayload(form), token)
      setForm({ ...emptyForm, resumeFileName: resumeFile.fileName || '' })
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

  function startEdit(record) {
    setEditingId(record.id)
    setForm(formFromRecord(record))
  }

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const cancelEdit = () => {
    setEditingId(null)
    setForm({ ...emptyForm, resumeFileName: resumeFile.fileName || '' })
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">就业方向 - 投递进度</p>
            <h2>投递进度跟踪</h2>
            <p className="muted">记录岗位快照、投递渠道、面试安排和结果反馈，形成完整求职过程档案。</p>
            {error && <div className="error-text">{error}</div>}
          </div>

          <div className="grid-two application-layout">
            <div className="feature-card application-form-card">
              <div className="card-title">{editingId ? '编辑投递记录' : '新增投递记录'}</div>

              <div className="application-form-section">
                <h3>基本信息</h3>
                <div className="form-grid">
                  <label className="field"><span>公司</span><input value={form.companyName} onChange={e => updateField('companyName', e.target.value)} /></label>
                  <label className="field"><span>岗位名称</span><input value={form.jobTitle} onChange={e => updateField('jobTitle', e.target.value)} /></label>
                  <label className="field"><span>关联岗位 ID</span><input value={form.jobPostingId || ''} onChange={e => updateField('jobPostingId', e.target.value)} placeholder="从岗位详情自动带入" /></label>
                  <label className="field"><span>投递渠道</span><TextWithSuggestions id="application-channel-options" value={form.applicationChannel} options={channelOptions} placeholder="官网 / 内推 / BOSS" onChange={value => updateField('applicationChannel', value)} /></label>
                </div>
              </div>

              <div className="application-form-section">
                <h3>岗位快照</h3>
                <div className="form-grid">
                  <label className="field"><span>城市</span><input value={form.city} onChange={e => updateField('city', e.target.value)} /></label>
                  <label className="field"><span>行业</span><input value={form.industry} onChange={e => updateField('industry', e.target.value)} /></label>
                  <label className="field"><span>企业类型</span><input value={form.companyType} onChange={e => updateField('companyType', e.target.value)} /></label>
                  <label className="field"><span>岗位类型</span><input value={form.roleType} onChange={e => updateField('roleType', e.target.value)} /></label>
                  <label className="field"><span>薪资范围</span><input value={form.salaryRange} onChange={e => updateField('salaryRange', e.target.value)} /></label>
                  <label className="field"><span>学历要求</span><input value={form.educationRequirement} onChange={e => updateField('educationRequirement', e.target.value)} /></label>
                  <label className="field span-2"><span>专业关键词</span><input value={form.majorKeywords} onChange={e => updateField('majorKeywords', e.target.value)} /></label>
                  <label className="field span-2"><span>技能标签</span><input value={form.skillTags} onChange={e => updateField('skillTags', e.target.value)} /></label>
                  <label className="field span-2"><span>申请链接</span><input value={form.applyUrl} onChange={e => updateField('applyUrl', e.target.value)} placeholder="https://..." /></label>
                </div>
              </div>

              <div className="application-form-section">
                <h3>进度跟进</h3>
                <div className="form-grid">
                  <label className="field"><span>状态</span><select value={form.status} onChange={e => updateField('status', e.target.value)}>{statuses.map(status => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
                  <label className="field"><span>投递时间</span><input type="datetime-local" value={form.appliedAt} onChange={e => updateField('appliedAt', e.target.value)} /></label>
                  <label className="field"><span>下一步时间</span><input type="datetime-local" value={form.nextStepAt} onChange={e => updateField('nextStepAt', e.target.value)} /></label>
                  <label className="field"><span>最后跟进</span><input type="datetime-local" value={form.lastFollowUpAt} onChange={e => updateField('lastFollowUpAt', e.target.value)} /></label>
                  <label className="field"><span>联系人</span><input value={form.contactName} onChange={e => updateField('contactName', e.target.value)} /></label>
                  <label className="field"><span>联系方式</span><input value={form.contactInfo} onChange={e => updateField('contactInfo', e.target.value)} /></label>
                  <label className="field"><span>面试轮次</span><TextWithSuggestions id="interview-round-options" value={form.interviewRound} options={interviewRounds} placeholder="一面 / 终面" onChange={value => updateField('interviewRound', value)} /></label>
                  <label className="field"><span>面试方式</span><TextWithSuggestions id="interview-method-options" value={form.interviewMethod} options={interviewMethods} placeholder="线上 / 线下" onChange={value => updateField('interviewMethod', value)} /></label>
                  <label className="field span-2"><span>地点/会议链接</span><input value={form.interviewLocation} onChange={e => updateField('interviewLocation', e.target.value)} /></label>
                </div>
              </div>

              <div className="application-form-section">
                <h3>结果与备注</h3>
                <div className="form-grid">
                  <label className="field"><span>使用简历</span><input value={form.resumeFileName} onChange={e => updateField('resumeFileName', e.target.value)} placeholder="默认使用当前附件" /></label>
                  <label className="field"><span>期望薪资</span><input value={form.expectedSalary} onChange={e => updateField('expectedSalary', e.target.value)} /></label>
                  <label className="field"><span>Offer 薪资</span><input value={form.offerSalary} onChange={e => updateField('offerSalary', e.target.value)} /></label>
                  <label className="field"><span>失败/拒绝原因</span><input value={form.failureReason} onChange={e => updateField('failureReason', e.target.value)} /></label>
                  <label className="field span-2"><span>备注</span><textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} /></label>
                </div>
              </div>

              <div className="application-actions">
                <button className="btn primary" type="button" onClick={saveRecord} disabled={saving}>{saving ? '保存中...' : '保存记录'}</button>
                {editingId && <button className="btn ghost" type="button" onClick={cancelEdit}>取消编辑</button>}
              </div>
            </div>

            <div className="feature-card metrics">
              <div className="card-title">投递概览</div>
              <div className="tag-row">
                {statusCounts.length === 0 ? <span className="tag subtle">暂无记录</span> : statusCounts.map(item => <span className="tag subtle" key={item.status}>{statusLabels[item.status]} {item.count}</span>)}
              </div>
              <div className="card-title">当前简历附件</div>
              {resumeFile.hasFile ? (
                <div className="resume-status-panel">
                  <strong>{resumeFile.fileName || '未命名附件'}</strong>
                  <span>{formatFileSize(resumeFile.fileSize)} · {formatDateTime(resumeFile.uploadedAt)}</span>
                  <button className="btn outline small" type="button" onClick={downloadResumeFile}>下载附件</button>
                </div>
              ) : <p className="muted">暂无附件，<Link to="/job/resume">前往简历页上传</Link>。</p>}
              <div className="card-title">下一步</div>
              {upcomingSteps.length === 0 ? <p className="muted">暂无下一步安排。</p> : upcomingSteps.map(item => <p className="room-sub" key={item.id}>{formatDateTime(item.nextStepAt)} · {item.companyName} · {item.jobTitle}</p>)}
            </div>
          </div>

          <div className="track-grid application-track-grid">
            {loading && <div className="track-card"><p className="muted">正在加载投递记录...</p></div>}
            {!loading && records.length === 0 && <div className="track-card"><p className="muted">暂无投递记录。</p></div>}
            {records.map(record => (
              <div className="track-card application-track-card" key={record.id}>
                <div className="track-head">
                  <div>
                    <h3>{record.companyName}</h3>
                    <p className="room-sub">{record.jobTitle}</p>
                  </div>
                  <span className="tag subtle">{statusLabels[record.status] || record.status}</span>
                </div>
                <div className="tag-row">
                  <span className="tag subtle">{record.city || '城市待定'}</span>
                  <span className="tag subtle">{record.salaryRange || '薪资未填'}</span>
                  <span className="tag subtle">{record.applicationChannel || '渠道未填'}</span>
                </div>
                <div className="application-detail-list">
                  <DetailItem label="行业/岗位" value={[record.industry, record.roleType].filter(Boolean).join(' / ')} />
                  <DetailItem label="企业类型" value={record.companyType} />
                  <DetailItem label="投递时间" value={formatDateTime(record.appliedAt)} />
                  <DetailItem label="下一步" value={formatDateTime(record.nextStepAt)} />
                  <DetailItem label="面试安排" value={[record.interviewRound, record.interviewMethod].filter(Boolean).join(' / ')} />
                  <DetailItem label="联系人" value={[record.contactName, record.contactInfo].filter(Boolean).join(' / ')} />
                  <DetailItem label="使用简历" value={record['resumeFileName']} />
                  <DetailItem label="Offer 薪资" value={record.offerSalary} />
                </div>
                {record.interviewLocation ? <p className="room-sub">地点/会议链接：{record.interviewLocation}</p> : null}
                {record.failureReason ? <p className="room-sub">原因：{record.failureReason}</p> : null}
                <p>{record.notes || '暂无备注'}</p>
                <div className="tag-row">
                  {record.applyUrl ? <a className="btn outline small" href={record.applyUrl} target="_blank" rel="noreferrer">打开申请链接</a> : null}
                  <button className="btn outline small" type="button" onClick={() => startEdit(record)}>编辑</button>
                  <button className="btn ghost small" type="button" onClick={() => deleteRecord(record.id)}>删除</button>
                </div>
              </div>
            ))}
          </div>
          <Link className="btn ghost" to="/job">返回就业面板</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
