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

describe('community post theme styles', () => {
  it('styles markdown surfaces with the frontendv2 code window and theme tokens', () => {
    const markdownSection = getSection('.v2-post-markdown {', '.v2-comment-thread {')

    expect(markdownSection).toContain('.v2-post-markdown .v2-shiki-codeblock')
    expect(markdownSection).toContain('.v2-post-markdown .v2-shiki-codeblock__toolbar')
    expect(markdownSection).toContain('.v2-post-markdown .v2-shiki-codeblock__tab')
    expect(markdownSection).toContain('.v2-post-markdown .v2-shiki-codeblock__copy')
    expect(markdownSection).toContain('.v2-post-markdown .v2-shiki-codeblock__body .shiki')
    expect(markdownSection).toContain('.v2-post-markdown .markdown-table')
    expect(markdownSection).toContain('.v2-post-markdown .markdown-image')
    expect(markdownSection).toContain('var(--v2-paper-soft)')
    expect(markdownSection).toContain('var(--v2-line)')
    expect(markdownSection).toContain('var(--v2-ink)')
    expect(markdownSection).toContain('var(--v2-highlight)')
    expect(markdownSection).toContain('html[data-theme="dark"]')
  })

  it('gives the post detail shell its own readable surface treatment', () => {
    const detailSection = getSection('.v2-post-header {', '.v2-comment-thread {')

    expect(detailSection).toContain('.v2-post-detail-card')
    expect(detailSection).toContain('linear-gradient(')
    expect(detailSection).toContain('var(--v2-paper)')
    expect(detailSection).toContain('var(--v2-line-strong)')
  })
})
