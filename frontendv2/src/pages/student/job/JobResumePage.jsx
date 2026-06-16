import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { employmentApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import EmploymentConfirmModal from '@/components/job/EmploymentConfirmModal.jsx'
import JobResumeAttachmentCard from '@/components/job/JobResumeAttachmentCard.jsx'
import JobResumeEditor from '@/components/job/JobResumeEditor.jsx'
import JobResumePreviewCard from '@/components/job/JobResumePreviewCard.jsx'
import JobSummaryStrip from '@/components/job/JobSummaryStrip.jsx'
import { normalizeResume } from '@/lib/job/employmentNormalizers.js'
import {
  canUseRemoteToken,
  fallbackDataNotice,
  previewDataNotice,
  remoteDataNotice,
  shouldShowStatusNotice,
} from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

function defaultResumeDraft() {
  return {
    targetRole: '',
    expectedCities: '',
    expectedIndustries: '',
    expectedSalary: '',
    highestEducation: '',
    major: '',
    phone: '',
    email: '',
    skillTags: '',
    projectKeywords: '',
    internshipKeywords: '',
    certificates: '',
    portfolioUrl: '',
    baseInfo: '',
    educationExperience: '',
    projectExperience: '',
    internshipExperience: '',
    skillsDescription: '',
    selfEvaluation: '',
  }
}

function createResumeDraft(resume) {
  return {
    targetRole: resume.targetRole || '',
    expectedCities: resume.expectedCities || '',
    expectedIndustries: resume.expectedIndustries || '',
    expectedSalary: resume.expectedSalary || '',
    highestEducation: resume.highestEducation || '',
    major: resume.major || '',
    phone: resume.phone || '',
    email: resume.email || '',
    skillTags: resume.skillTags || '',
    projectKeywords: resume.projectKeywords || '',
    internshipKeywords: resume.internshipKeywords || '',
    certificates: resume.certificates || '',
    portfolioUrl: resume.portfolioUrl || '',
    baseInfo: resume.baseInfo || '',
    educationExperience: resume.educationExperience || '',
    projectExperience: resume.projectExperience || '',
    internshipExperience: resume.internshipExperience || '',
    skillsDescription: resume.skillsDescription || '',
    selfEvaluation: resume.selfEvaluation || '',
  }
}

export default function JobResumePage() {
  const { token } = useAuth()
  const canUseRemote = canUseRemoteToken(token)
  const uploadInputRef = useRef(null)
  const [mode, setMode] = useState('edit')
  const [resume, setResume] = useState(normalizeResume({}))
  const [draft, setDraft] = useState(defaultResumeDraft())
  const [notice, setNotice] = useState(previewDataNotice('简历中心'))
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadResume() {
      if (!canUseRemote) {
        const fallback = normalizeResume({})
        setResume(fallback)
        setDraft(createResumeDraft(fallback))
        setNotice(previewDataNotice('简历中心'))
        return
      }

      try {
        const data = await withRequestTimeout(
          employmentApi.resume(token),
          8000,
          '简历数据读取超时，请检查后端服务。',
        )
        if (!active) return
        const normalized = normalizeResume(data)
        setResume(normalized)
        setDraft(createResumeDraft(normalized))
        setNotice(remoteDataNotice('简历中心'))
      } catch (error) {
        if (!active) return
        const fallback = normalizeResume({})
        setResume(fallback)
        setDraft(createResumeDraft(fallback))
        setNotice(fallbackDataNotice('简历中心', error))
      }
    }

    loadResume()
    return () => {
      active = false
    }
  }, [canUseRemote, token])

  async function handleSave(event) {
    event?.preventDefault()

    if (!canUseRemote) {
      setNotice('请使用真实账号登录后再保存简历。')
      return
    }

    setSaving(true)
    setNotice('正在保存在线简历...')
    try {
      const saved = await employmentApi.saveResume(draft, token)
      const normalized = normalizeResume(saved)
      setResume(normalized)
      setDraft(createResumeDraft(normalized))
      setNotice('在线简历已保存。')
    } catch (error) {
      setNotice(`保存失败：${error?.message || '请检查后端服务或登录状态。'}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleExport(format) {
    if (!canUseRemote) {
      setNotice('请使用真实账号登录后再导出简历。')
      return
    }

    setNotice('正在保存并导出简历...')
    try {
      await employmentApi.saveResume(draft, token)
      await employmentApi.exportResume(format, token)
      setNotice(format === 'pdf' ? 'PDF 简历已导出。' : 'Word 简历已导出。')
    } catch (error) {
      setNotice(`导出失败：${error?.message || '请检查后端服务或登录状态。'}`)
    }
  }

  async function handleDownloadAttachment() {
    if (!canUseRemote) {
      setNotice('请使用真实账号登录后再下载附件。')
      return
    }

    try {
      await employmentApi.downloadResumeFile(token)
    } catch (error) {
      setNotice(`下载失败：${error?.message || '请检查后端服务或登录状态。'}`)
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!canUseRemote) {
      setNotice('请使用真实账号登录后再上传附件。')
      return
    }

    setNotice('正在上传附件简历...')
    try {
      const uploaded = await employmentApi.uploadResumeFile(file, token)
      const uploadedResumeFile = uploaded?.resumeFile || uploaded || {
        hasFile: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      }
      const normalized = normalizeResume(
        uploaded?.resumeFile
          ? uploaded
          : { ...resume, resumeFile: uploadedResumeFile },
      )
      setResume(normalized)
      setDraft(createResumeDraft(normalized))
      setNotice('附件简历已上传。')
      event.target.value = ''
    } catch (error) {
      setNotice(`上传失败：${error?.message || '请检查文件格式、大小或登录状态。'}`)
    }
  }

  async function confirmDeleteAttachment() {
    if (!canUseRemote) {
      setNotice('请使用真实账号登录后再删除附件。')
      setConfirmDeleteOpen(false)
      return
    }

    try {
      await employmentApi.deleteResumeFile(token)
      setResume((current) => normalizeResume({ ...current, resumeFile: undefined }))
      setNotice('附件简历已删除。')
    } catch (error) {
      setNotice(`删除失败：${error?.message || '请检查后端服务或登录状态。'}`)
    } finally {
      setConfirmDeleteOpen(false)
    }
  }

  const summaryItems = [
    { label: '目标岗位', value: resume.targetRole || '待补充' },
    { label: '意向城市', value: resume.expectedCities || '待补充' },
    { label: '目标行业', value: resume.expectedIndustries || '待补充' },
    { label: '附件状态', value: resume.resumeFile.hasFile ? '已上传' : '未上传' },
  ]

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="简历中心"
          kickerAsTitle
          pathItems={[
            { label: '就业主站', to: '/station/job' },
          ]}
        />

        {shouldShowStatusNotice(notice) ? <div className="v2-status-note">{notice}</div> : null}

        <JobSummaryStrip items={summaryItems} />

        <div className="v2-segment-group" role="tablist" aria-label="简历视图切换">
          {[
            { key: 'edit', label: '编辑' },
            { key: 'preview', label: '预览' },
          ].map((item) => (
            <button
              key={item.key}
              className={`v2-segment-button ${mode === item.key ? 'is-active' : ''}`}
              type="button"
              onClick={() => setMode(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === 'edit' ? (
          <JobResumeEditor draft={draft} onChange={setDraft} onSubmit={handleSave} saving={saving} />
        ) : (
          <JobResumePreviewCard resume={normalizeResume({ ...resume, ...draft, resumeFile: resume.resumeFile })} />
        )}
      </div>

      <aside className="v2-side-column">
        <input
          ref={uploadInputRef}
          hidden
          type="file"
          onChange={handleUpload}
        />
        <JobResumeAttachmentCard
          resumeFile={resume.resumeFile}
          onUploadClick={() => uploadInputRef.current?.click()}
          onDownload={handleDownloadAttachment}
          onDelete={() => setConfirmDeleteOpen(true)}
          onExportWord={() => handleExport('docx')}
          onExportPdf={() => handleExport('pdf')}
        />
      </aside>

      <EmploymentConfirmModal
        open={confirmDeleteOpen}
        title="删除当前附件简历？"
        body="删除后只会保留在线简历字段，后续仍可重新上传文件版简历。"
        confirmLabel="删除附件"
        onConfirm={confirmDeleteAttachment}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </>
  )
}
