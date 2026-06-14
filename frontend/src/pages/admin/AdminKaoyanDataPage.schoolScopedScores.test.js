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
})