import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(resolve(import.meta.dirname, './App.css'), 'utf8')
const categoryManagementPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/CategoryManagementPage.jsx'), 'utf8')
const employmentManagementPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/EmploymentManagementPage.jsx'), 'utf8')
const adminPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/AdminPage.jsx'), 'utf8')
const reviewPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/ReviewPage.jsx'), 'utf8')
const userManagementPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/UserManagementPage.jsx'), 'utf8')
const reportPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/ReportPage.jsx'), 'utf8')
const materialReviewPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/AdminMaterialReviewPage.jsx'), 'utf8')
const adminKaoyanDataPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/AdminKaoyanDataPage.jsx'), 'utf8')
const kaogongDataPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/KaogongDataPage.jsx'), 'utf8')

function getSection(startMarker, endMarker) {
  const startIndex = appCss.indexOf(startMarker)
  const endIndex = appCss.indexOf(endMarker, startIndex)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Unable to locate CSS section between "${startMarker}" and "${endMarker}"`)
  }

  return appCss.slice(startIndex, endIndex)
}

describe('admin theme styles', () => {
  it('keeps shared admin surfaces on semantic theme tokens', () => {
    const sharedAdminSection = getSection('.admin-table {', '.wrong-list {')

    expect(sharedAdminSection).toContain('var(--surface-strong)')
    expect(sharedAdminSection).toContain('var(--line)')
    expect(sharedAdminSection).toContain('var(--primary)')
    expect(sharedAdminSection).not.toContain('background: #fff')
    expect(sharedAdminSection).not.toContain('color: #fff')
    expect(sharedAdminSection).not.toContain('rgba(15, 118, 110, 0.04)')
  })

  it('defines dedicated admin utility classes for status and action surfaces', () => {
    const adminUtilitiesSection = getSection('.wrong-item {', '/* ========== Material Module ========== */')

    expect(adminUtilitiesSection).toContain('.admin-status-chip')
    expect(adminUtilitiesSection).toContain('.admin-status-chip.is-success')
    expect(adminUtilitiesSection).toContain('.admin-status-chip.is-warning')
    expect(adminUtilitiesSection).toContain('.admin-inline-actions')
    expect(adminUtilitiesSection).toContain('.admin-surface-card')
    expect(adminUtilitiesSection).toContain('var(--success-soft)')
    expect(adminUtilitiesSection).toContain('var(--danger-soft)')
    expect(adminUtilitiesSection).not.toContain('background: #fef2f2')
  })

  it('defines admin console primitives on semantic tokens only', () => {
    const adminUtilitiesSection = getSection('.admin-surface-card {', '.data-table {')

    expect(adminUtilitiesSection).toContain('.admin-page-shell')
    expect(adminUtilitiesSection).toContain('.admin-summary-grid')
    expect(adminUtilitiesSection).toContain('.admin-filter-bar')
    expect(adminUtilitiesSection).toContain('.admin-filter-pill')
    expect(adminUtilitiesSection).toContain('.admin-record-card')
    expect(adminUtilitiesSection).toContain('var(--admin-surface)')
    expect(adminUtilitiesSection).toContain('var(--admin-toolbar-surface)')
    expect(adminUtilitiesSection).toContain('var(--admin-filter-active)')
    expect(adminUtilitiesSection).not.toContain('background: #fff')
    expect(adminUtilitiesSection).not.toContain('background: rgba(15, 118, 110, 0.08)')
  })

  it('keeps remaining admin management screens on shared admin utility classes', () => {
    expect(categoryManagementPageSource).toContain('admin-surface-card')
    expect(categoryManagementPageSource).toContain('admin-status-chip')
    expect(categoryManagementPageSource).toContain('admin-inline-actions')
    expect(categoryManagementPageSource).not.toContain('danger-tag')

    expect(employmentManagementPageSource).toContain('admin-surface-card')
    expect(employmentManagementPageSource).toContain('admin-status-chip')
    expect(employmentManagementPageSource).toContain('admin-inline-actions')
    expect(employmentManagementPageSource).toContain('admin-control-tab')
  })

  it('keeps grid-based admin data pages off the legacy row-layout class stack', () => {
    expect(employmentManagementPageSource).not.toContain('admin-record-card admin-data-row')
    expect(adminKaoyanDataPageSource).not.toContain('admin-record-card admin-data-row')
    expect(kaogongDataPageSource).not.toContain('admin-record-card admin-data-row')
  })

  it('gives employment management a tabbed single-object workbench layout', () => {
    expect(employmentManagementPageSource).toContain("const [activePanel, setActivePanel] = useState('fairs')")
    expect(employmentManagementPageSource).toContain('admin-control-tabs')
    expect(employmentManagementPageSource).toContain('admin-control-tab')
    expect(employmentManagementPageSource).toContain('admin-employment-workbench')
    expect(employmentManagementPageSource).toContain('admin-employment-workspace')
    expect(employmentManagementPageSource).toContain('admin-employment-form-panel')
    expect(employmentManagementPageSource).toContain('admin-employment-list-panel')
    expect(employmentManagementPageSource).not.toContain('admin-employment-editor-grid')
    expect(employmentManagementPageSource).not.toContain('admin-employment-lists')
  })

  it('defines employment workbench layout primitives in shared admin CSS', () => {
    const adminUtilitiesSection = getSection('.admin-surface-card {', '.data-table {')

    expect(adminUtilitiesSection).toContain('.admin-control-tabs')
    expect(adminUtilitiesSection).toContain('.admin-control-tab')
    expect(adminUtilitiesSection).toContain('.admin-employment-workbench')
    expect(adminUtilitiesSection).toContain('.admin-employment-workspace')
    expect(adminUtilitiesSection).toContain('.admin-employment-form-panel')
    expect(adminUtilitiesSection).toContain('.admin-employment-list-panel')
    expect(adminUtilitiesSection).not.toContain('.admin-employment-editor-grid')
    expect(adminUtilitiesSection).not.toContain('.admin-employment-lists')
  })

  it('avoids legacy admin info tags on the remaining backend surfaces', () => {
    expect(adminPageSource).not.toContain('tag subtle')
    expect(reviewPageSource).not.toContain('tag subtle')
    expect(materialReviewPageSource).not.toContain('tag subtle')
    expect(adminKaoyanDataPageSource).not.toContain('tag subtle')
    expect(kaogongDataPageSource).not.toContain('tag subtle')
  })

  it('keeps the main admin pages off legacy frontend filter and card patterns', () => {
    expect(adminPageSource).toContain('admin-summary-grid')
    expect(adminPageSource).toContain('admin-capability-grid')
    expect(adminPageSource).not.toContain('feature-card soft')
    expect(adminPageSource).not.toContain('track-card')

    expect(reviewPageSource).toContain('admin-filter-bar')
    expect(reviewPageSource).toContain('admin-record-card')
    expect(reviewPageSource).not.toContain('tag tag-btn')
    expect(reviewPageSource).not.toContain('track-card')

    expect(userManagementPageSource).toContain('admin-filter-bar')
    expect(userManagementPageSource).toContain('admin-summary-grid')
    expect(userManagementPageSource).toContain('admin-record-card')
    expect(userManagementPageSource).not.toContain('tag tag-btn')

    expect(reportPageSource).toContain('admin-filter-bar')
    expect(reportPageSource).toContain('admin-record-card')
    expect(reportPageSource).not.toContain('tag tag-btn')

    expect(adminKaoyanDataPageSource).toContain('admin-toolbar-card')
    expect(adminKaoyanDataPageSource).toContain('admin-form-surface')
    expect(adminKaoyanDataPageSource).not.toContain('feature-card calendar-filter-panel')

    expect(kaogongDataPageSource).toContain('admin-toolbar-card')
    expect(kaogongDataPageSource).toContain('admin-form-surface')
    expect(kaogongDataPageSource).not.toContain('feature-card calendar-filter-panel')
  })
})
