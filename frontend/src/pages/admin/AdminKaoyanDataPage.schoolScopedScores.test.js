import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  resolve(import.meta.dirname, './AdminKaoyanDataPage.jsx'),
  'utf8',
)

describe('AdminKaoyanDataPage school-scoped score management', () => {
  it('no longer has a 分数线 top-level tab', () => {
    // The 分数线 tab should be removed — score lines are now managed
    // per-school via the school card's "维护分数线" button.
    expect(source).not.toMatch(/key:\s*'scores'/)
  })

  it('school row actions include a 维护分数线 button', () => {
    // The rowActions helper must accept an optional onManageScores
    // callback and render a button that triggers it.
    expect(source).toMatch(/function rowActions\([^)]*onManageScores/)
    expect(source).toMatch(/维护分数线/)
  })

  it('declares scoresModal state to drive the per-school score modal', () => {
    expect(source).toMatch(/setScoresModalSchool.*useState\(null\)/)
  })

  it('renders a second modal (scoresModalSchool) layered above the form modal', () => {
    // Two distinct modal-overlay blocks should exist in the JSX: one for
    // the form modal (always present) and one gated on scoresModalSchool.
    const modalOverlays = source.match(/className="modal-overlay"/g) || []
    expect(modalOverlays.length).toBeGreaterThanOrEqual(2)
    expect(source).toMatch(/scoresModalSchool\s*&&\s*\(\s*<div className="modal-overlay"/)
  })

  it('the score form no longer renders a school select dropdown', () => {
    // The "院校" select dropdown has been removed from renderScoreForm.
    // The school is now implicit from scoresModalSchool and shown as a
    // static label in the modal header instead.
    expect(source).not.toMatch(/<span>院校<\/span>/)
  })

  it('openScoresModal passes the school to loadScoresForModal so the first fetch is not skipped', () => {
    // React state updates are async — setScoresModalSchool(school) does NOT
    // make the next synchronous read of scoresModalSchool see the new value.
    // If openScoresModal calls loadScoresForModal() without forwarding the
    // school parameter, the function's closure still has scoresModalSchool
    // === null and the early-return `if (!scoresModalSchool) return` fires,
    // leaving the modal open with an empty list.
    const openBlock = source.match(/function openScoresModal\([^)]*\)\s*\{([\s\S]*?)\n\s{2}\}/)
    expect(openBlock, 'openScoresModal function must exist').not.toBeNull()
    expect(openBlock[1]).toMatch(/loadScoresForModal\(\s*0\s*,\s*school\s*\)/)
  })

  it('form modal is rendered AFTER the scores modal so it stacks on top when editing', () => {
    // Clicking 编辑 inside the scores modal opens both modals at once.
    // Both share the same .modal-overlay z-index, so paint order = DOM
    // order. The form modal must come AFTER scoresModalSchool in the source
    // so it paints on top — otherwise the user can't reach the form fields.
    const scoresPos = source.indexOf('scoresModalSchool &&')
    const formPos = source.indexOf('showFormModal &&')
    expect(scoresPos, 'scores modal block must exist').toBeGreaterThan(0)
    expect(formPos, 'form modal block must exist').toBeGreaterThan(0)
    expect(formPos).toBeGreaterThan(scoresPos)
  })
})