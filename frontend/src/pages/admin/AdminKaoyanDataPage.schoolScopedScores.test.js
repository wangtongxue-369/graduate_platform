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

  it('no longer renders the redundant admin-tabs button row', () => {
    // With only one tab left (院校信息), the row of tab buttons is
    // redundant visual chrome and has been removed.
    expect(source).not.toMatch(/className="admin-tabs"/)
  })

  it('school rows no longer expose enable/disable UI (status chip + 停用 button)', () => {
    // The 启用/停用 toggle was removed from 院校信息 cards. The status chip
    // ("启用中"/"已停用") and the 停用 button must not appear on the school
    // row, so rowActions must gate them on `onDelete` (which the school
    // caller does not pass).
    const rowActionsBlock = source.match(/function rowActions\([\s\S]*?\n\}/)
    expect(rowActionsBlock, 'rowActions function must exist').not.toBeNull()
    const body = rowActionsBlock[0]
    // The status chip text must be inside an onDelete gate.
    expect(body).toMatch(/onDelete\s*\?\s*\([\s\S]*?已停用[\s\S]*?\)\s*:\s*null/)
    // The 停用 button must be inside an onDelete gate.
    expect(body).toMatch(/onDelete\s*\?\s*\([\s\S]*?>停用<\/button>[\s\S]*?\)\s*:\s*null/)
  })

  it('renderSchoolRow signature no longer takes onDelete', () => {
    // After dropping the enable/disable UI for schools, the row helper must
    // not accept an onDelete parameter — only onEdit and onManageScores.
    expect(source).toMatch(/function renderSchoolRow\(row,\s*onEdit,\s*onManageScores\)/)
  })

  it('school-row JSX render call no longer passes deleteRecord', () => {
    // The caller in the main component used to pass `deleteRecord` as the
    // 3rd arg. After the cleanup, only editRecord + openScoresModal remain.
    const mapCall = source.match(/rows\.map\(\(row\)\s*=>\s*renderSchoolRow\([\s\S]*?\)\)/)
    expect(mapCall, 'rows.map renderSchoolRow call must exist').not.toBeNull()
    expect(mapCall[0]).not.toMatch(/deleteRecord/)
  })

  it('deleteRecord function has been removed', () => {
    // Once the school enable/disable UI is gone, the deleteRecord handler
    // that called deleteKaoyanSchool is dead code and must be removed.
    expect(source).not.toMatch(/function\s+deleteRecord\b/)
  })

  it('activeStatusClassMap has been removed', () => {
    // The status-chip color map was only used for the school enable/disable
    // status chip. With that chip gone from school rows, the map is dead.
    expect(source).not.toMatch(/activeStatusClassMap/)
  })

  it('score form no longer renders the 国家线 checkbox', () => {
    // The 国家线 toggle was removed from the score-line edit form. The
    // field stays in `emptyScore` and the public read view (ScoreQueryPage)
    // still renders "国家线"/"院线" — but admins can no longer toggle it
    // here. Existing `isNationalLine: true` records survive edits because
    // editScoreInModal initializes scoreForm via `...row` spread.
    expect(source).not.toMatch(/<span>国家线<\/span>/)
    expect(source).not.toMatch(/update\('isNationalLine'/)
  })

  it('no longer shows the change-confirmation message panel', () => {
    // The 筛选框 下方 used to render a panel showing every action's outcome
    // ("分数线已保存（重庆大学）", "院校信息已保存", "正在编辑：xxx", etc.).
    // That UI has been removed — the message state, all setMessage calls,
    // and the admin-note-panel JSX are gone.
    expect(source).not.toMatch(/className="admin-note-panel"/)
    expect(source).not.toMatch(/\bsetMessage\b/)
    expect(source).not.toMatch(/\buseState\('\)[\s\S]{0,200}setMessage/)
    expect(source).not.toMatch(/分数线已保存/)
    expect(source).not.toMatch(/院校信息已保存/)
    expect(source).not.toMatch(/正在编辑：/)
  })
})