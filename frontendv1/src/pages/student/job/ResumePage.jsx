import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import ReturnBar from '@/components/ReturnBar.jsx'
import { createPreviewResume } from '@/lib/employmentPreview.js'

const acceptedResumeExtensions = ['.pdf', '.doc', '.docx']
const maxResumeFileSize = 10 * 1024 * 1024
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

function isAllowedResumeFile(file) {
  const lowerName = file?.name?.toLowerCase() || ''
  return acceptedResumeExtensions.some((extension) => lowerName.endsWith(extension))
}

export default function ResumePage() {
  const { token, isAuthed, loading: authLoading } = useAuth()
  const canUseRemote = Boolean(isAuthed && token && token !== 'dev-token')
  const isPreviewMode = Boolean(isAuthed && token === 'dev-token')
  const [resume, setResume] = useState(emptyResume)
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isPreviewMode) {
      setResume(normalizeResume(createPreviewResume()))
      setLoading(false)
      setError('')
      return
    }

    if (!canUseRemote) {
      setLoading(false)
      return
    }

    setLoading(true)
    employmentApi.resume(token)
      .then((data) => setResume(normalizeResume(data)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [canUseRemote, isPreviewMode, token])

  if (!authLoading && !isAuthed) return <Navigate replace to="/login" />

  const currentFile = resume.resumeFile || resumeFileDefaults
  const updateField = (key, value) => setResume((prev) => ({ ...prev, [key]: value }))

  async function saveResume() {
    if (isPreviewMode) {
      setError('')
      setMessage('已在预览中暂存在线简历字段；正式保存仍需真实账号与后端服务。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再保存简历。')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const saved = await employmentApi.saveResume(resume, token)
      setResume(normalizeResume(saved))
      setMessage('在线简历已保存，可以回工作站继续下一步。')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function uploadResumeFile() {
    setError('')
    setMessage('')

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

    if (isPreviewMode) {
      setResume((prev) => normalizeResume({
        ...prev,
        resumeFile: {
          hasFile: true,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
        },
      }))
      setSelectedFile(null)
      setUploadProgress(100)
      setMessage('已在预览中更新附件展示；真实上传需连接后端。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再上传附件。')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const saved = await employmentApi.uploadResumeFile(selectedFile, token, setUploadProgress)
      setResume(normalizeResume(saved))
      setSelectedFile(null)
      setUploadProgress(100)
      setMessage('简历附件已更新；附件不参与自动解析。')
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function downloadResumeFile() {
    if (!currentFile.hasFile) return

    if (isPreviewMode) {
      setError('')
      setMessage('预览模式不生成真实下载；请使用正式账号连接后端后再下载附件。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再下载附件。')
      return
    }

    setDownloading(true)
    setError('')

    try {
      await employmentApi.downloadResumeFile(token)
    } catch (e) {
      setError(e.message)
    } finally {
      setDownloading(false)
    }
  }

  async function deleteResumeFile() {
    if (!currentFile.hasFile) return

    if (isPreviewMode) {
      setResume((prev) => normalizeResume({ ...prev, resumeFile: resumeFileDefaults }))
      setSelectedFile(null)
      setError('')
      setMessage('已在预览中移除附件展示；正式删除仍需连接后端。')
      return
    }

    if (!canUseRemote) {
      setError('请使用真实账号登录后再删除附件。')
      return
    }
    if (!window.confirm('确认删除当前简历附件？在线文本简历会保留。')) return

    setDeleting(true)
    setError('')
    setMessage('')

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

  return (
    <section className="v1-task-page">
      <ReturnBar to="/station/job" label="返回就业工作站" hint="完成附件操作后先回简历页，再从简历页返回工作站。" />
      <header className="v1-task-head">
        <p className="v1-eyebrow">job / resume</p>
        <h1>在线简历</h1>
        <p>先维护在线字段，再上传附件。附件不参与自动解析，只用于保存与下载。</p>
      </header>
      <div className="v1-callout">提示：简历附件不参与自动解析，推荐排序只读取在线简历字段。</div>
      {isPreviewMode ? <div className="v1-message">当前为开发预览：表单和附件操作只在本页临时演示，正式保存与下载需连接后端。</div> : null}

      {loading ? (
        <div className="v1-file-panel">正在加载简历...</div>
      ) : (
        <div className="v1-task-split">
          <div className="v1-form-stack">
            <label className="v1-field">
              <span>目标岗位</span>
              <input value={resume.targetRole} onChange={(e) => updateField('targetRole', e.target.value)} />
            </label>
            <div className="v1-form-grid">
              <label className="v1-field">
                <span>期望城市</span>
                <input value={resume.expectedCities} onChange={(e) => updateField('expectedCities', e.target.value)} />
              </label>
              <label className="v1-field">
                <span>期望行业</span>
                <input value={resume.expectedIndustries} onChange={(e) => updateField('expectedIndustries', e.target.value)} />
              </label>
            </div>
            <div className="v1-form-grid">
              <label className="v1-field">
                <span>期望薪资</span>
                <input value={resume.expectedSalary} onChange={(e) => updateField('expectedSalary', e.target.value)} />
              </label>
              <label className="v1-field">
                <span>学历 / 专业</span>
                <input
                  value={`${resume.educationLevel}${resume.educationLevel && resume.major ? ' / ' : ''}${resume.major}`}
                  onChange={(e) => {
                    const [educationLevel = '', major = ''] = e.target.value.split('/').map((item) => item.trim())
                    updateField('educationLevel', educationLevel)
                    updateField('major', major)
                  }}
                />
              </label>
            </div>
            <label className="v1-field">
              <span>技能关键词</span>
              <textarea rows="3" value={resume.skillTags} onChange={(e) => updateField('skillTags', e.target.value)} />
            </label>
            <label className="v1-field">
              <span>项目关键词</span>
              <textarea rows="3" value={resume.projectKeywords} onChange={(e) => updateField('projectKeywords', e.target.value)} />
            </label>
            <label className="v1-field">
              <span>项目经历</span>
              <textarea rows="6" value={resume.projects} onChange={(e) => updateField('projects', e.target.value)} />
            </label>
            <label className="v1-field">
              <span>实习经历</span>
              <textarea rows="5" value={resume.internships} onChange={(e) => updateField('internships', e.target.value)} />
            </label>
            <label className="v1-field">
              <span>技能补充 / 自我评价</span>
              <textarea rows="5" value={resume.selfEvaluation} onChange={(e) => updateField('selfEvaluation', e.target.value)} />
            </label>
            <button className="v1-btn v1-btn--primary" type="button" onClick={saveResume} disabled={saving}>
              {saving ? '保存中...' : '保存在线简历'}
            </button>
          </div>

          <aside className="v1-file-panel">
            <strong>简历附件</strong>
            <span>{currentFile.hasFile ? `${currentFile.fileName} · ${formatFileSize(currentFile.fileSize)}` : '当前文件：未上传'}</span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            {selectedFile ? <span>已选择：{selectedFile.name} · {formatFileSize(selectedFile.size)}</span> : null}
            {uploading ? (
              <div className="v1-upload-progress">
                <div className="v1-upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            ) : null}
            <div className="v1-action-row">
              <button className="v1-btn v1-btn--primary" type="button" onClick={uploadResumeFile} disabled={uploading}>
                {uploading ? '上传中...' : (currentFile.hasFile ? '替换附件' : '上传附件')}
              </button>
              <button className="v1-btn" type="button" onClick={downloadResumeFile} disabled={!currentFile.hasFile || downloading}>
                {downloading ? '下载中...' : '下载当前附件'}
              </button>
              <button className="v1-btn" type="button" onClick={deleteResumeFile} disabled={!currentFile.hasFile || deleting}>
                {deleting ? '删除中...' : '删除附件'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {message ? <div className="v1-message">{message}</div> : null}
      {error ? <div className="v1-error">{error}</div> : null}
    </section>
  )
}
