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

describe('stack sidebar scrollbar theme styles', () => {
  it('styles side-column scrollbars through theme tokens', () => {
    const sidebarSection = getSection('.v2-stack-frame > .v2-side-column {', '@media (max-width: 1380px) {')

    expect(sidebarSection).toContain('scrollbar-color: var(--v2-editor-scrollbar-thumb) var(--v2-editor-scrollbar-track);')
    expect(sidebarSection).toContain('.v2-stack-frame > .v2-side-column::-webkit-scrollbar-track {')
    expect(sidebarSection).toContain('background: var(--v2-editor-scrollbar-track);')
    expect(sidebarSection).toContain('.v2-stack-frame > .v2-side-column::-webkit-scrollbar-thumb {')
    expect(sidebarSection).toContain('background: var(--v2-editor-scrollbar-thumb);')
    expect(sidebarSection).toContain('.v2-stack-frame > .v2-side-column::-webkit-scrollbar-thumb:hover {')
    expect(sidebarSection).toContain('background: var(--v2-editor-scrollbar-thumb-hover);')
  })
})
