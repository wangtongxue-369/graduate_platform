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
    expect(apiSource).toContain('/api/job/resume/export?format=')
    expect(apiSource).toContain('exportResume(format, token)')
    expect(apiSource).toContain("request('/api/job/resume/file', { method: 'DELETE', token })")
    expect(apiSource).toContain("request('/api/admin/employment/resumes', { token })")
    expect(apiSource).not.toContain('resumeCosKey')
  })

  it('renders student upload, replacement, download, and delete controls with client hints', () => {
    expect(resumePageSource).toContain('acceptedResumeExtensions')
    expect(resumePageSource).toContain('maxResumeFileSize')
    expect(resumePageSource).toContain('uploadResumeFile(selectedFile')
    expect(resumePageSource).toContain('downloadResumeFile(token)')
    expect(resumePageSource).toContain('deleteResumeFile(token)')
    expect(resumePageSource).toContain('PDF/DOC/DOCX')
  })

  it('keeps save and export actions next to the edit/preview switcher', () => {
    expect(resumePageSource).toContain('resume-toolbar')
    expect(resumePageSource).toContain('resume-mode-tabs')
    expect(resumePageSource).toContain('resume-action-bar')
    expect(resumePageSource).toContain("setViewMode('preview')")
    expect(resumePageSource).not.toContain(`<button className="btn outline" type="button" onClick={() => setViewMode('preview')} disabled={loading}>`)
  })

  it('adds online preview and Word/PDF export actions for structured resumes', () => {
    expect(resumePageSource).toContain('ResumePreview')
    expect(resumePageSource).toContain("exportResume('docx')")
    expect(resumePageSource).toContain("exportResume('pdf')")
    expect(resumePageSource).toContain('导出 Word')
    expect(resumePageSource).toContain('导出 PDF')
  })

  it('shows current attachment status separately from application records', () => {
    expect(applicationTrackingSource).toContain('Promise.all')
    expect(applicationTrackingSource).toContain('employmentApi.applications(token)')
    expect(applicationTrackingSource).toContain('employmentApi.resume(token)')
    expect(applicationTrackingSource).toContain('resumeFileDefaults')
    expect(applicationTrackingSource).not.toContain('record.resumeFile')
  })

  it('keeps the admin resume status view read-only', () => {
    expect(employmentManagementSource).toContain('adminEmploymentApi.resumes(token)')
    expect(employmentManagementSource).toContain('resumeFileDefaults')
    expect(employmentManagementSource).toContain('resumeSummaries')
    expect(employmentManagementSource).not.toContain('downloadResumeFile(')
    expect(employmentManagementSource).not.toContain('deleteResumeFile(')
    expect(employmentManagementSource).not.toContain('uploadResumeFile(')
  })

  it('defines attachment and online preview styles without public URL/key affordances', () => {
    expect(appCss).toContain('.resume-file-card')
    expect(appCss).toContain('.resume-preview-sheet')
    expect(appCss).toContain('.resume-toolbar')
    expect(appCss).toContain('.resume-export-options')
    expect(appCss).toContain('var(--surface-strong)')
    expect(`${resumePageSource}\n${applicationTrackingSource}\n${employmentManagementSource}`).not.toContain('publicUrl')
  })
})
