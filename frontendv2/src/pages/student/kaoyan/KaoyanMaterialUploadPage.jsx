import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import PageIntro from '@/components/PageIntro.jsx'
import {
  createEmptyUploadForm,
  materialTypeOptions,
  materialYearOptions,
} from '@/pages/student/kaoyan/kaoyanPageData.js'
import { canUseRemoteToken } from '@/lib/stationData.js'

const MAX_FILES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function KaoyanMaterialUploadPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const [form, setForm] = useState(createEmptyUploadForm())
  const [files, setFiles] = useState([])
  const [notice, setNotice] = useState(canUseRemote ? '' : '当前是预览账号，暂不提交真实上传。')
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleFileChange(event) {
    const nextFiles = Array.from(event.target.files || [])
    if (!nextFiles.length) return

    if (files.length + nextFiles.length > MAX_FILES) {
      setNotice(`最多上传 ${MAX_FILES} 个文件`)
      event.target.value = ''
      return
    }

    const oversizedFile = nextFiles.find((item) => item.size > MAX_FILE_SIZE)
    if (oversizedFile) {
      setNotice(`文件 ${oversizedFile.name} 超过 10MB 限制`)
      event.target.value = ''
      return
    }

    setFiles((current) => [...current, ...nextFiles])
    setNotice(canUseRemote ? '' : '当前是预览账号，暂不提交真实上传。')
    event.target.value = ''
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canUseRemote || !token) return

    if (!form.title.trim()) {
      setNotice('请先填写资料标题。')
      return
    }

    setSaving(true)
    setProgress(10)
    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      if (form.description.trim()) formData.append('description', form.description.trim())
      if (form.school.trim()) formData.append('school', form.school.trim())
      if (form.major.trim()) formData.append('major', form.major.trim())
      if (form.subject.trim()) formData.append('subject', form.subject.trim())
      if (form.year) formData.append('year', form.year)
      if (form.materialType) formData.append('materialType', form.materialType)
      files.forEach((file) => formData.append('files', file))

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/kaoyan/materials`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (uploadEvent) => {
        if (uploadEvent.lengthComputable) {
          setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 90))
        }
      }

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText || '{}')
          if (xhr.status < 200 || xhr.status >= 300 || !data.success) {
            reject(new Error(data.message || '资料上传失败'))
            return
          }
          resolve(data.data)
        }
        xhr.onerror = () => reject(new Error('网络错误'))
        xhr.send(formData)
      })

      setProgress(100)
      navigate('/station/kaoyan/materials/mine')
    } catch (error) {
      setNotice(error.message || '资料上传失败')
      setSaving(false)
      return
    }

    setSaving(false)
  }

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="考研资料"
          pathItems={[
            { label: '考研主站', to: '/station/kaoyan' },
            { label: '资料中枢', to: '/station/kaoyan/materials' },
            { label: '上传资料' },
          ]}
          title="上传资料"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-article-card">
          <form className="v2-filter-form" onSubmit={handleSubmit}>
            <label className="v2-field">
              <span>资料标题</span>
              <input
                maxLength={50}
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value.slice(0, 50))}
              />
              <small className="v2-note-text">{`${form.title.length}/50`}</small>
            </label>

            <label className="v2-field">
              <span>资料介绍</span>
              <textarea
                maxLength={500}
                rows={4}
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value.slice(0, 500))}
              />
              <small className="v2-note-text">{`${form.description.length}/500`}</small>
            </label>

            <section className="v2-card-grid">
              <label className="v2-field">
                <span>院校</span>
                <input
                  type="text"
                  value={form.school}
                  onChange={(event) => updateForm('school', event.target.value)}
                />
              </label>
              <label className="v2-field">
                <span>专业</span>
                <input
                  type="text"
                  value={form.major}
                  onChange={(event) => updateForm('major', event.target.value)}
                />
              </label>
              <label className="v2-field">
                <span>科目</span>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) => updateForm('subject', event.target.value)}
                />
              </label>
              <label className="v2-field">
                <span>年份</span>
                <select value={form.year} onChange={(event) => updateForm('year', event.target.value)}>
                  <option value="">请选择</option>
                  {materialYearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </label>
            </section>

            <label className="v2-field">
              <span>资料类型</span>
              <select value={form.materialType} onChange={(event) => updateForm('materialType', event.target.value)}>
                <option value="">请选择</option>
                {materialTypeOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>

            <label className="v2-field">
              <span>选择附件</span>
              <input
                aria-label="选择附件"
                multiple
                type="file"
                onChange={handleFileChange}
              />
              <small className="v2-note-text">{`最多 ${MAX_FILES} 个文件，单个文件不超过 10MB。`}</small>
            </label>

            <div className="v2-inline-actions">
              <button className="v2-segment-button is-active" disabled={saving || !canUseRemote} type="submit">
                {saving ? '上传中…' : '提交审核'}
              </button>
              <button className="v2-segment-button" type="button" onClick={() => navigate('/station/kaoyan/materials')}>
                返回资料中枢
              </button>
            </div>
            {saving ? <div className="v2-status-note">{`上传进度 ${progress}%`}</div> : null}
          </form>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">附件清单</p>
          <div className="v2-check-list">
            {files.map((file, index) => (
              <div className="v2-check-row" key={`${file.name}-${file.size}`}>
                <strong>{file.name}</strong>
                <span>{formatFileSize(file.size)}</span>
                <button className="v2-secondary-link" type="button" onClick={() => removeFile(index)}>
                  移除
                </button>
              </div>
            ))}
            {!files.length ? <p>当前还没有选择附件。</p> : null}
          </div>
        </section>
      </aside>
    </>
  )
}
