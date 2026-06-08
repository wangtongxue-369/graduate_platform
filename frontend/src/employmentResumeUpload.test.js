import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const apiSource = readFileSync(resolve(import.meta.dirname, './lib/api.js'), 'utf8')
const resumePageSource = readFileSync(resolve(import.meta.dirname, './pages/job/ResumePage.jsx'), 'utf8')
const applicationTrackingSource = readFileSync(resolve(import.meta.dirname, './pages/job/ApplicationTrackingPage.jsx'), 'utf8')
const employmentManagementSource = readFileSync(resolve(import.meta.dirname, './pages/admin/EmploymentManagementPage.jsx'), 'utf8')
const appCss = readFileSync(resolve(import.meta.dirname, './App.css'), 'utf8')

describe('employment resume attachment frontend contract', () => {
  it('keeps resume attachment API behind authenticated backend endpoints', () => {
    expect(apiSource).toContain('uploadResumeFile(file, token, onProgress)')
    expect(apiSource).toContain('new XMLHttpRequest()')
    expect(apiSource).toContain("xhr.open('POST', `${API_BASE}/api/job/resume/file`)")
    expect(apiSource).toContain('/api/job/resume/file/download')
    expect(apiSource).toContain("request('/api/job/resume/file', { method: 'DELETE', token })")
    expect(apiSource).toContain("request('/api/admin/employment/resumes', { token })")
    expect(apiSource).not.toContain('resumeCosKey')
  })

  it('renders student upload, replacement, download, and delete controls with client hints', () => {
    expect(resumePageSource).toContain('简历附件')
    expect(resumePageSource).toContain('acceptedResumeExtensions')
    expect(resumePageSource).toContain('maxResumeFileSize')
    expect(resumePageSource).toContain('uploadResumeFile(selectedFile')
    expect(resumePageSource).toContain('downloadResumeFile(token)')
    expect(resumePageSource).toContain('deleteResumeFile(token)')
    expect(resumePageSource).toContain('替换附件')
    expect(resumePageSource).toContain('PDF/DOC/DOCX')
  })

  it('shows current attachment status separately from application records', () => {
    expect(applicationTrackingSource).toContain('Promise.all')
    expect(applicationTrackingSource).toContain('employmentApi.applications(token)')
    expect(applicationTrackingSource).toContain('employmentApi.resume(token)')
    expect(applicationTrackingSource).toContain('当前简历附件')
    expect(applicationTrackingSource).not.toContain('record.resumeFile')
  })

  it('keeps the admin resume status view read-only', () => {
    expect(employmentManagementSource).toContain('adminEmploymentApi.resumes(token)')
    expect(employmentManagementSource).toContain('简历附件状态')
    expect(employmentManagementSource).toContain('只读')
    expect(employmentManagementSource).toContain('不提供上传、下载、替换或删除入口')
    expect(employmentManagementSource).not.toContain('downloadResumeFile(')
    expect(employmentManagementSource).not.toContain('deleteResumeFile(')
    expect(employmentManagementSource).not.toContain('uploadResumeFile(')
  })

  it('defines attachment status styles without public URL/key affordances', () => {
    expect(appCss).toContain('.resume-file-card')
    expect(appCss).toContain('.resume-status-panel')
    expect(appCss).toContain('var(--surface-strong)')
    expect(`${resumePageSource}\n${applicationTrackingSource}\n${employmentManagementSource}`).not.toContain('publicUrl')
  })
})
