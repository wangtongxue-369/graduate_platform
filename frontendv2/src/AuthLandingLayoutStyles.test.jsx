import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const indexCss = readFileSync(resolve(import.meta.dirname, './index.css'), 'utf8')

function getSection(startMarker, endMarker) {
  const startIndex = indexCss.indexOf(startMarker)
  const endIndex = indexCss.indexOf(endMarker, startIndex)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Unable to locate CSS section between "${startMarker}" and "${endMarker}"`)
  }

  return indexCss.slice(startIndex, endIndex)
}

describe('auth landing layout styles', () => {
  it('keeps the desktop auth shell constrained to one viewport and adds a short-screen compaction rule', () => {
    const authShellSection = getSection('.v2-auth-shell {', '.v2-boot-screen {')
    const shortViewportSection = getSection('@media (max-height: 720px) and (min-width: 981px) {', '@media (max-width: 720px) {')

    expect(authShellSection).toContain('height: 100vh;')
    expect(authShellSection).toContain('overflow: hidden;')
    expect(authShellSection).toContain('padding: clamp(16px, 3vh, 32px) 16px;')
    expect(authShellSection).toContain('.v2-auth-shell__inner {')
    expect(authShellSection).toContain('height: min(100%, 920px);')
    expect(shortViewportSection).toContain('.v2-auth-intro-grid {')
    expect(shortViewportSection).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
    expect(shortViewportSection).toContain('.v2-auth-shell__intro {')
    expect(shortViewportSection).toContain('gap: 12px;')
    expect(shortViewportSection).toContain('.v2-auth-intro-card h1 {')
    expect(shortViewportSection).toContain('font-size: clamp(2.3rem, 3.1vw, 3.45rem);')
    expect(shortViewportSection).toContain('.v2-auth-form--register .v2-auth-grid {')
    expect(shortViewportSection).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
    expect(shortViewportSection).toContain('.v2-auth-form--register .v2-auth-field span,')
    expect(shortViewportSection).toContain('.v2-auth-form--register .v2-auth-checkbox {')
  })
})
