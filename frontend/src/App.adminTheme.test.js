import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(resolve(import.meta.dirname, './App.css'), 'utf8')
const categoryManagementPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/CategoryManagementPage.jsx'), 'utf8')
const employmentManagementPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/EmploymentManagementPage.jsx'), 'utf8')
const adminPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/AdminPage.jsx'), 'utf8')
const reviewPageSource = readFileSync(resolve(import.meta.dirname, './pages/admin/ReviewPage.jsx'), 'utf8')
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

  it('keeps remaining admin management screens on shared admin utility classes', () => {
    expect(categoryManagementPageSource).toContain('admin-surface-card')
    expect(categoryManagementPageSource).toContain('admin-status-chip')
    expect(categoryManagementPageSource).toContain('admin-inline-actions')
    expect(categoryManagementPageSource).not.toContain('danger-tag')

    expect(employmentManagementPageSource).toContain('admin-surface-card')
    expect(employmentManagementPageSource).toContain('admin-status-chip')
    expect(employmentManagementPageSource).toContain('admin-inline-actions')
    expect(employmentManagementPageSource).toContain('admin-data-row')
  })

  it('avoids legacy admin info tags on the remaining backend surfaces', () => {
    expect(adminPageSource).not.toContain('tag subtle')
    expect(reviewPageSource).not.toContain('tag subtle')
    expect(materialReviewPageSource).not.toContain('tag subtle')
    expect(adminKaoyanDataPageSource).not.toContain('tag subtle')
    expect(kaogongDataPageSource).not.toContain('tag subtle')
  })
})
