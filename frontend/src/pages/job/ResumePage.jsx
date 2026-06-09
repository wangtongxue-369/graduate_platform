import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Navbar from '../../components/Navbar.jsx'
import Footer from '../../components/Footer.jsx'
import { employmentApi } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../App.css'

const resumeFileDefaults = { hasFile: false, fileName: '', fileSize: null, fileType: '', uploadedAt: '' }
const emptyResume = {
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

function normalizeResume(data) {
  return {
    ...emptyResume,
    ...(data || {}),
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

  if (!authLoading && !isAuthed) return <Navigate to="/login" replace />

  async function saveResume() {
    if (!canUseRemote) { setError('请使用真实账号登录后再保存简历。'); return }
    setSaving(true); setError(''); setMessage('')
    try {
      const saved = await employmentApi.saveResume(resume, token)
      setResume(normalizeResume(saved))
      setMessage('在线简历已保存，可刷新页面验证持久化结果。')
    } catch (e) { setError(e.message) } finally { setSaving(false) }
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
      setMessage('简历附件已上传，旧附件会在服务端尽力清理。')
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function downloadResumeFile() {
    if (!resume.resumeFile?.hasFile) return
    if (!canUseRemote) { setError('请使用真实账号登录后再下载附件。'); return }
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
    if (!canUseRemote) { setError('请使用真实账号登录后再删除附件。'); return }
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
    <div className="app"><Navbar /><main className="shell"><section className="section">
      <div className="section-head"><p className="eyebrow">就业方向 - 简历</p><h2>在线简历</h2><p className="muted">维护一份可持久保存的在线简历，并可上传一个当前有效的 PDF/DOC/DOCX 附件。</p>{error && <div className="error-text">{error}</div>}{message && <div className="notice-box">{message}</div>}</div>
      {loading ? <div className="feature-card"><p className="muted">正在加载简历...</p></div> : <div className="grid-two">
        <div className="feature-card metrics"><div className="card-title">简历内容</div><div className="form-grid">
          <label className="field"><span>目标岗位</span><input value={resume.targetRole || ''} onChange={e => updateField('targetRole', e.target.value)} placeholder="Java 后端工程师 / 产品经理" /></label>
          <label className="field"><span>期望城市</span><input value={resume.expectedCities || ''} onChange={e => updateField('expectedCities', e.target.value)} placeholder="上海, 苏州" /></label>
          <label className="field"><span>期望行业</span><input value={resume.expectedIndustries || ''} onChange={e => updateField('expectedIndustries', e.target.value)} placeholder="互联网, 金融科技" /></label>
          <label className="field"><span>期望薪资</span><input value={resume.expectedSalary || ''} onChange={e => updateField('expectedSalary', e.target.value)} placeholder="18k-25k" /></label>
          <label className="field"><span>最高学历</span><input value={resume.educationLevel || ''} onChange={e => updateField('educationLevel', e.target.value)} placeholder="本科 / 硕士" /></label>
          <label className="field"><span>专业</span><input value={resume.major || ''} onChange={e => updateField('major', e.target.value)} placeholder="计算机科学与技术" /></label>
          <label className="field"><span>技能关键词</span><textarea value={resume.skillTags || ''} onChange={e => updateField('skillTags', e.target.value)} placeholder="Java、Spring Boot、MySQL、Redis、Docker" /></label>
          <label className="field"><span>项目关键词</span><textarea value={resume.projectKeywords || ''} onChange={e => updateField('projectKeywords', e.target.value)} placeholder="权限系统、数据看板、接口开发、性能优化" /></label>
          <label className="field"><span>实习关键词</span><textarea value={resume.internshipKeywords || ''} onChange={e => updateField('internshipKeywords', e.target.value)} placeholder="后端开发、测试、运营、数据分析" /></label>
          <label className="field"><span>证书/奖项</span><textarea value={resume.certificates || ''} onChange={e => updateField('certificates', e.target.value)} placeholder="CET-6、软考、竞赛、奖学金" /></label>
          <label className="field"><span>作品链接</span><input value={resume.portfolioUrl || ''} onChange={e => updateField('portfolioUrl', e.target.value)} placeholder="GitHub / 个人站点 / 作品集链接" /></label>
          <label className="field"><span>基本信息</span><textarea value={resume.baseInfo || ''} onChange={e => updateField('baseInfo', e.target.value)} placeholder="姓名、联系方式、个人简介" /></label>
          <label className="field"><span>教育经历</span><textarea value={resume.education || ''} onChange={e => updateField('education', e.target.value)} placeholder="学校、专业、核心课程、绩点" /></label>
          <label className="field"><span>项目经历</span><textarea value={resume.projects || ''} onChange={e => updateField('projects', e.target.value)} placeholder="项目背景、技术栈、个人职责、成果产出" /></label>
          <label className="field"><span>实习经历</span><textarea value={resume.internships || ''} onChange={e => updateField('internships', e.target.value)} placeholder="公司、岗位、工作内容、业务影响" /></label>
          <label className="field"><span>技能特长</span><textarea value={resume.skills || ''} onChange={e => updateField('skills', e.target.value)} placeholder="更完整的技能描述、熟练度和使用场景" /></label>
          <label className="field"><span>自我评价</span><textarea value={resume.selfEvaluation || ''} onChange={e => updateField('selfEvaluation', e.target.value)} placeholder="个人优势、职业目标和适合岗位" /></label>
        </div><button className="btn primary" type="button" onClick={saveResume} disabled={saving}>{saving ? '保存中...' : '保存简历'}</button></div>
        <div className="feature-card resume-file-card"><div className="card-title">简历附件</div>{currentFile.hasFile ? <div className="resume-file-current"><span className="tag subtle">当前附件</span><strong>{currentFile.fileName || '未命名简历附件'}</strong><span>{formatFileSize(currentFile.fileSize)} · {currentFile.fileType || '类型待定'} · {formatDateTime(currentFile.uploadedAt)}</span></div> : <p className="muted">暂无附件，可上传一份当前简历文件。</p>}<label className="field"><span>选择附件（PDF/DOC/DOCX，最大 10MB）</span><input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => setSelectedFile(event.target.files?.[0] || null)} /></label>{selectedFile ? <p className="room-sub">已选择：{selectedFile.name} · {formatFileSize(selectedFile.size)}</p> : null}{uploading ? <div className="upload-progress"><div className="upload-progress-head"><span>正在上传</span><strong>{uploadProgress}%</strong></div><div className="upload-progress-track"><span style={{ width: `${uploadProgress}%` }} /></div></div> : null}<div className="resume-file-actions"><button className="btn primary" type="button" onClick={uploadResumeFile} disabled={uploading}>{uploading ? '上传中...' : (currentFile.hasFile ? '替换附件' : '上传附件')}</button><button className="btn outline" type="button" onClick={downloadResumeFile} disabled={!currentFile.hasFile || downloading}>{downloading ? '下载中...' : '下载当前附件'}</button><button className="btn ghost" type="button" onClick={deleteResumeFile} disabled={!currentFile.hasFile || deleting}>{deleting ? '删除中...' : '删除附件'}</button></div></div>
      </div>}
      <Link className="btn ghost" to="/job">返回就业面板</Link>
    </section></main><Footer /></div>
  )
}
