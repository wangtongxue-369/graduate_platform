import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(resolve(import.meta.dirname, './App.css'), 'utf8')

function getSection(startMarker, endMarker) {
  const startIndex = appCss.indexOf(startMarker)
  const endIndex = appCss.indexOf(endMarker, startIndex)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Unable to locate CSS section between "${startMarker}" and "${endMarker}"`)
  }

  return appCss.slice(startIndex, endIndex)
}

describe('post editor theme styles', () => {
  it('keeps the post editor and markdown editor on semantic theme tokens', () => {
    const postEditorSection = getSection(
      '/* ========== Post Editor ========== */',
      '@media (prefers-reduced-motion: reduce)',
    )

    expect(postEditorSection).toContain('var(--surface-elevated)')
    expect(postEditorSection).toContain('var(--panel-border)')
    expect(postEditorSection).toContain('var(--primary-soft)')
    expect(postEditorSection).not.toContain('rgba(240, 253, 250')
    expect(postEditorSection).not.toContain('rgba(255, 252, 247')
    expect(postEditorSection).not.toContain('#0f766e')
    expect(postEditorSection).not.toContain('#102725')
  })

  it('avoids legacy hard-coded editor colors in shared markdown surfaces', () => {
    const markdownSection = getSection('.markdown-content {', '.study-hero {')

    expect(markdownSection).toContain('var(--surface-inverse)')
    expect(markdownSection).toContain('var(--primary)')
    expect(markdownSection).toContain('var(--surface-strong)')
    expect(markdownSection).not.toContain('#11201e')
    expect(markdownSection).not.toContain('#ecfeff')
    expect(markdownSection).not.toContain('rgba(15, 118, 110, 0.08)')
    expect(markdownSection).not.toContain('rgba(255, 255, 255, 0.82)')
  })
})
