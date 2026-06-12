import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  resolve(import.meta.dirname, './AdminKaoyanDataPage.jsx'),
  'utf8',
)

describe('AdminKaoyanDataPage edit flow uses a modal', () => {
  it('clicking 编辑 opens a modal rather than hijacking the inline form', () => {
    // The edit handler must set modal visibility in the same code path it
    // populates the form. Otherwise the user is forced to scroll up to edit.
    const editRecordBlock = source.match(/function editRecord\([^)]*\)\s*\{([\s\S]*?)\n\s{2}\}/)
    expect(editRecordBlock, 'editRecord function must exist').not.toBeNull()
    expect(editRecordBlock[1]).toMatch(/setShowFormModal\(true\)/)
  })

  it('no longer renders the old inline admin-form-surface block', () => {
    // The inline edit form should be removed — clicking 编辑 must not repurpose
    // a shared form above the list.
    expect(source).not.toMatch(/admin-form-surface/)
  })

  it('declares a showFormModal state hook', () => {
    expect(source).toMatch(/useState\(false\)[\s\S]{0,200}setShowFormModal/)
  })

  it('renders a modal-overlay + modal-box for the edit/create form', () => {
    // Modal must use the project's existing modal pattern (matches StudyPlanPage
    // / MessagesPage), so it inherits the global dark-mode + sizing fixes.
    expect(source).toMatch(/className="modal-overlay"/)
    expect(source).toMatch(/className="modal-box"/)
    expect(source).toMatch(/className="modal-header"/)
    expect(source).toMatch(/className="modal-actions"/)
  })
})