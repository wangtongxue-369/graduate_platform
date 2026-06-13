import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const resumeFileDefaults = { hasFile: false, fileName: '', fileSize: null, fileType: '', uploadedAt: '' }
const emptyResume = {
  templateType: 'default',
  targetRole: '',
  expectedCities: '',
  expectedIndustries: '',
  expectedSalary: '',
  educationLevel: '',
  major: '',
  skillTags: '',
  projectKeywords: '',
  internshipKeywords: '',
  certificates: '',
  portfolioUrl: '',
  baseInfo: '',
  education: '',
  projects: '',
  internships: '',
  skills: '',
  selfEvaluation: '',
  resumeFile: resumeFileDefaults,
}
const maxResumeFileSize = 10 * 1024 * 1024
const acceptedResumeExtensions = ['.pdf', '.doc', '.docx']

const sectionFields = [
  { key: 'baseInfo', label: '基本信息', placeholder: '姓名、手机号、邮箱、学校等基础信息' },
  { key: 'education', label: '教育经历', placeholder: '学校、专业、时间、核心课程、绩点或排名' },
  { key: 'projects', label: '项目经历', placeholder: '项目背景、技术栈、个人职责、成果数据' },
  { key: 'internships', label: '实习经历', placeholder: '公司、岗位、工作内容、业务影响' },
  { key: 'skills', label: '技能特长', placeholder: '技术栈、工具、熟练度和使用场景' },
  { key: 'selfEvaluation', label: '自我评价', placeholder: '个人优势、职业目标和岗位匹配点' },
]

function normalizeResume(data) {
  return {
    ...emptyResume,
    ...(data || {}),
    templateType: data?.templateType || 'default',
    resumeFile: { ...resumeFileDefaults, ...(data?.resumeFile || {}) },
  }
}

function formatFileSize(size) {
  if (!size || Number.isNaN(Number(size))) return '0 B'
  const bytes = Number(size)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDateTime(value) {
  if (!value) return '未上传'
  return value.replace('T', ' ').slice(0, 16)
}

function isAllowedResumeFile(file) {
  const lowerName = file?.name?.toLowerCase() || ''
  return acceptedResumeExtensions.some((extension) => lowerName.endsWith(extension))
}

function splitLines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function ResumePreview({ resume }) {
  const headline = [
    resume.targetRole,
    resume.expectedCities,
    resume.expectedSalary,
  ].filter(Boolean).join(' / ')
  const intentionRows = [
    ['目标岗位', resume.targetRole],
    ['期望城市', resume.expectedCities],
    ['期望行业', resume.expectedIndustries],
    ['期望薪资', resume.expectedSalary],
    ['最高学历', resume.educationLevel],
    ['专业方向', resume.major],
  ].filter(([, value]) => value)
  const sections = [
    ...sectionFields.map((field) => ({ title: field.label, content: resume[field.key] })),
    { title: '技能关键词', content: resume.skillTags },
    { title: '项目关键词', content: resume.projectKeywords },
    { title: '实习关键词', content: resume.internshipKeywords },
    { title: '证书/奖项', content: resume.certificates },
    { title: '作品链接', content: resume.portfolioUrl },
  ].filter((item) => splitLines(item.content).length > 0)

  return (
    <article className={`resume-preview-sheet resume-preview-sheet--${resume.templateType || 'default'}`}>
      <header className="resume-preview-head">
        <h3>{splitLines(resume.baseInfo)[0] || '在线简历'}</h3>
        {headline ? <p>{headline}</p> : <p>保存求职目标后，这里会形成简历摘要。</p>}
      </header>

      {intentionRows.length > 0 ? (
        <section className="resume-preview-section">
          <h4>求职意向</h4>
          <div className="resume-preview-facts">
            {intentionRows.map(([label, value]) => (
              <span key={label}><strong>{label}</strong>{value}</span>
            ))}
          </div>
        </section>
      ) : null}

      {sections.length > 0 ? sections.map((section) => (
        <section className="resume-preview-section" key={section.title}>
          <h4>{section.title}</h4>
          {splitLines(section.content).map((line) => <p key={line}>{line}</p>)}
        </section>
      )) : (
        <section className="resume-preview-section">
          <h4>待完善</h4>
          <p>在左侧补充教育、项目、实习和技能后，可在这里直接浏览排版效果。</p>
        </section>
      )}
    </article>
  )
}

export default function ResumePage() {
  const { token, isAuthed, loading: authLoading } = useAuth()
  const canUseRemote = Boolean(isAuthed && token && token !== 'dev-token')
  const [resume, setResume] = useState(emptyResume)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState('')
  const [viewMode, setViewMode] = useState('edit')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!canUseRemote) {
      setLoading(false)
      return
    }
    employmentApi.resume(token)
      .then(data => setResume(normalizeResume(data)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [canUseRemote, token])

  const completionCount = useMemo(() => {
    return Object.entries(resume)
      .filter(([key, value]) => key !== 'resumeFile' && String(value || '').trim())
      .length
  }, [resume])

  if (!authLoading && !isAuthed) return <Navigate to="/login" replace />

  async function saveResume() {
    if (!canUseRemote) {
      setError('请使用真实账号登录后再保存简历。')
      return null
    }
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const saved = await employmentApi.saveResume(resume, token)
      const normalized = normalizeResume(saved)
      setResume(normalized)
      setMessage('在线简历已保存。')
      return normalized
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setSaving(false)
    }
  }

  async function exportResume(format) {
    if (!canUseRemote) {
      setError('请使用真实账号登录后再导出简历。')
      return
    }
    setExportMenuOpen(false)
    setExporting(format)
    setError('')
    setMessage('')
    try {
      const saved = await employmentApi.saveResume(resume, token)
      setResume(normalizeResume(saved))
      await employmentApi.exportResume(format, token)
      setMessage(format === 'pdf' ? 'PDF 简历已导出。' : 'Word 简历已导出。')
    } catch (e) {
      setError(e.message)
    } finally {
      setExporting('')
    }
  }

  async function uploadResumeFile() {
    setError('')
    setMessage('')
    if (!canUseRemote) {
      setError('请使用真实账号登录后再上传附件。')
      return
    }
    if (!selectedFile) {
      setError('请先选择 PDF、DOC 或 DOCX 简历附件。')
      return
    }
    if (!isAllowedResumeFile(selectedFile)) {
      setError('仅支持 PDF、DOC、DOCX 格式的简历附件。')
      return
    }
    if (selectedFile.size > maxResumeFileSize) {
      setError('简历附件不能超过 10MB。')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    try {
      const saved = await employmentApi.uploadResumeFile(selectedFile, token, setUploadProgress)
      setResume(normalizeResume(saved))
      setSelectedFile(null)
      setUploadProgress(100)
      setMessage('简历附件已上传；在线导出会使用页面字段，不会覆盖附件。')
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function downloadResumeFile() {
    if (!resume.resumeFile?.hasFile) return
    if (!canUseRemote) {
      setError('请使用真实账号登录后再下载附件。')
      return
    }
    setError('')
    setDownloading(true)
    try {
      await employmentApi.downloadResumeFile(token)
    } catch (e) {
      setError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  async function deleteResumeFile() {
    if (!resume.resumeFile?.hasFile) return
    if (!canUseRemote) {
      setError('请使用真实账号登录后再删除附件。')
      return
    }
    if (!window.confirm('确认删除当前简历附件？在线文本简历会保留。')) return
    setError('')
    setMessage('')
    setDeleting(true)
    try {
      const saved = await employmentApi.deleteResumeFile(token)
      setResume(normalizeResume(saved))
      setSelectedFile(null)
      setMessage('简历附件已删除，在线文本简历已保留。')
    } catch (e) {
      setError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const updateField = (key, value) => setResume(prev => ({ ...prev, [key]: value }))
  const currentFile = resume.resumeFile || resumeFileDefaults

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section">
          <div className="section-head resume-page-head">
            <div>
              <p className="eyebrow">就业方向 - 简历</p>
              <h2>在线简历</h2>
              <p className="muted">维护结构化简历字段，支持页面预览，并可导出 Word 或 PDF。</p>
            </div>
          </div>

          {error && <div className="error-text">{error}</div>}
          {message && <div className="notice-box">{message}</div>}

          {loading ? (
            <div className="feature-card"><p className="muted">正在加载简历...</p></div>
          ) : (
            <div className="resume-workspace">
              <div className="resume-editor-column">
                <div className="resume-toolbar">
                  <div className="resume-mode-tabs" role="tablist" aria-label="简历视图">
                    <button className={viewMode === 'edit' ? 'is-active' : ''} type="button" onClick={() => setViewMode('edit')}>编辑</button>
                    <button className={viewMode === 'preview' ? 'is-active' : ''} type="button" onClick={() => setViewMode('preview')}>预览</button>
                  </div>
                  <div className="resume-action-bar">
                    <button className="btn primary" type="button" onClick={saveResume} disabled={saving || loading}>
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <div className="resume-export-menu">
                      <button
                        className="btn outline"
                        type="button"
                        onClick={() => setExportMenuOpen((open) => !open)}
                        disabled={loading || Boolean(exporting)}
                      >
                        {exporting ? '导出中...' : '导出'}
                      </button>
                      {exportMenuOpen ? (
                        <div className="resume-export-options">
                          <button type="button" onClick={() => exportResume('docx')}>导出 Word</button>
                          <button type="button" onClick={() => exportResume('pdf')}>导出 PDF</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {viewMode === 'edit' ? (
                  <div className="feature-card metrics">
                    <div className="card-title">简历内容</div>
                    <div className="form-grid">
                      <label className="field">
                        <span>简历模板</span>
                        <select value={resume.templateType || 'default'} onChange={e => updateField('templateType', e.target.value)}>
                          <option value="default">标准模板</option>
                          <option value="compact">紧凑模板</option>
                        </select>
                      </label>
                      <label className="field"><span>目标岗位</span><input value={resume.targetRole || ''} onChange={e => updateField('targetRole', e.target.value)} placeholder="Java 后端工程师 / 产品经理" /></label>
                      <label className="field"><span>期望城市</span><input value={resume.expectedCities || ''} onChange={e => updateField('expectedCities', e.target.value)} placeholder="上海, 苏州" /></label>
                      <label className="field"><span>期望行业</span><input value={resume.expectedIndustries || ''} onChange={e => updateField('expectedIndustries', e.target.value)} placeholder="互联网, 金融科技" /></label>
                      <label className="field"><span>期望薪资</span><input value={resume.expectedSalary || ''} onChange={e => updateField('expectedSalary', e.target.value)} placeholder="18k-25k" /></label>
                      <label className="field"><span>最高学历</span><input value={resume.educationLevel || ''} onChange={e => updateField('educationLevel', e.target.value)} placeholder="本科 / 硕士" /></label>
                      <label className="field"><span>专业</span><input value={resume.major || ''} onChange={e => updateField('major', e.target.value)} placeholder="计算机科学与技术" /></label>
                      <label className="field"><span>技能关键词</span><textarea value={resume.skillTags || ''} onChange={e => updateField('skillTags', e.target.value)} placeholder="Java, Spring Boot, MySQL, Redis, Docker" /></label>
                      <label className="field"><span>项目关键词</span><textarea value={resume.projectKeywords || ''} onChange={e => updateField('projectKeywords', e.target.value)} placeholder="权限系统、数据看板、接口开发、性能优化" /></label>
                      <label className="field"><span>实习关键词</span><textarea value={resume.internshipKeywords || ''} onChange={e => updateField('internshipKeywords', e.target.value)} placeholder="后端开发、测试、运营、数据分析" /></label>
                      <label className="field"><span>证书/奖项</span><textarea value={resume.certificates || ''} onChange={e => updateField('certificates', e.target.value)} placeholder="CET-6、软考、竞赛、奖学金" /></label>
                      <label className="field"><span>作品链接</span><input value={resume.portfolioUrl || ''} onChange={e => updateField('portfolioUrl', e.target.value)} placeholder="GitHub / 个人站点 / 作品集链接" /></label>
                      {sectionFields.map((field) => (
                        <label className="field" key={field.key}>
                          <span>{field.label}</span>
                          <textarea value={resume[field.key] || ''} onChange={e => updateField(field.key, e.target.value)} placeholder={field.placeholder} />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="resume-preview-frame">
                    <ResumePreview resume={resume} />
                  </div>
                )}
              </div>

              <aside className="resume-side-column">
                <div className="feature-card resume-status-card">
                  <div className="card-title">当前状态</div>
                  <div className="resume-stat-row"><span>已填写字段</span><strong>{completionCount}</strong></div>
                  <div className="resume-stat-row"><span>当前模板</span><strong>{resume.templateType === 'compact' ? '紧凑' : '标准'}</strong></div>
                  <div className="resume-stat-row"><span>预览模式</span><strong>{viewMode === 'preview' ? '已打开' : '编辑中'}</strong></div>
                </div>

                <div className="feature-card resume-file-card">
                  <div className="card-title">简历附件</div>
                  {currentFile.hasFile ? (
                    <div className="resume-file-current">
                      <span className="tag subtle">当前附件</span>
                      <strong>{currentFile.fileName || '未命名简历附件'}</strong>
                      <span>{formatFileSize(currentFile.fileSize)} · {formatDateTime(currentFile.uploadedAt)}</span>
                    </div>
                  ) : (
                    <p className="muted">暂无附件，可上传一份当前简历文件。在线导出不依赖附件。</p>
                  )}
                  <label className="field">
                    <span>选择附件（PDF/DOC/DOCX，最大 10MB）</span>
                    <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setSelectedFile(event.target.files?.[0] || null)} />
                  </label>
                  {selectedFile ? <p className="room-sub">已选择：{selectedFile.name} · {formatFileSize(selectedFile.size)}</p> : null}
                  {uploading ? (
                    <div className="upload-progress">
                      <div className="upload-progress-head"><span>正在上传</span><strong>{uploadProgress}%</strong></div>
                      <div className="upload-progress-track"><span style={{ width: `${uploadProgress}%` }} /></div>
                    </div>
                  ) : null}
                  <div className="resume-file-actions">
                    <button className="btn primary" type="button" onClick={uploadResumeFile} disabled={uploading}>{uploading ? '上传中...' : (currentFile.hasFile ? '替换附件' : '上传附件')}</button>
                    <button className="btn outline" type="button" onClick={downloadResumeFile} disabled={!currentFile.hasFile || downloading}>{downloading ? '下载中...' : '下载当前附件'}</button>
                    <button className="btn ghost" type="button" onClick={deleteResumeFile} disabled={!currentFile.hasFile || deleting}>{deleting ? '删除中...' : '删除附件'}</button>
                  </div>
                </div>
              </aside>
            </div>
          )}
          <Link className="btn ghost" to="/job">返回就业面板</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
