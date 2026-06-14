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

describe('post markdown editor theme styles', () => {
  it('includes dark theme overrides for the markdown editor shell and internals', () => {
    const editorSection = getSection('.v2-post-workbench-editor {', '.v2-post-workbench-preview {')

    expect(editorSection).toContain('html[data-theme="dark"] .v2-post-md-editor-surface')
    expect(editorSection).toContain('html[data-theme="dark"] .v2-post-md-editor-surface .mdxeditor-toolbar')
    expect(editorSection).toContain('html[data-theme="dark"] .v2-post-md-editor-surface .cm-editor')
    expect(editorSection).toContain('var(--v2-paper)')
    expect(editorSection).toContain('var(--v2-paper-soft)')
    expect(editorSection).toContain('var(--v2-line)')
    expect(editorSection).toContain('var(--v2-ink)')
  })

  it('includes dark theme overrides for block type and language select controls', () => {
    const editorSection = getSection('.v2-post-workbench-editor {', '.v2-post-workbench-preview {')

    expect(editorSection).toContain('[class*="_selectTrigger_"]')
    expect(editorSection).toContain('[class*="_toolbarNodeKindSelectContainer_"]')
    expect(editorSection).toContain('[class*="_toolbarCodeBlockLanguageSelectContent_"]')
    expect(editorSection).toContain('[class*="_selectItem_"][data-highlighted]')
    expect(editorSection).toContain('[class*="_codeMirrorToolbar_"]')
    expect(editorSection).toContain('html[data-theme="dark"] .v2-post-md-editor-surface')
  })
})
