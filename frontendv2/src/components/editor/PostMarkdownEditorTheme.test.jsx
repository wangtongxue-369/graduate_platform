import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PostMarkdownEditor from './PostMarkdownEditor.jsx'

const editorState = vi.hoisted(() => ({
  lastProps: null,
}))

vi.mock('@mdxeditor/editor', async () => {
  const React = await import('react')

  const MockMDXEditor = React.forwardRef(function MockMDXEditor(props, ref) {
    editorState.lastProps = props
    React.useImperativeHandle(ref, () => ({
      setMarkdown: vi.fn(),
    }))

    return <div data-testid="post-markdown-editor-theme-probe" />
  })

  return {
    MDXEditor: MockMDXEditor,
    headingsPlugin: vi.fn(() => ({ type: 'headings' })),
    listsPlugin: vi.fn(() => ({ type: 'lists' })),
    linkPlugin: vi.fn(() => ({ type: 'link' })),
    quotePlugin: vi.fn(() => ({ type: 'quote' })),
    thematicBreakPlugin: vi.fn(() => ({ type: 'break' })),
    markdownShortcutPlugin: vi.fn(() => ({ type: 'shortcuts' })),
    diffSourcePlugin: vi.fn(() => ({ type: 'diff' })),
    toolbarPlugin: vi.fn(() => ({ type: 'toolbar' })),
    codeBlockPlugin: vi.fn(() => ({ type: 'codeblock' })),
    codeMirrorPlugin: vi.fn(() => ({ type: 'codemirror' })),
    BlockTypeSelect: () => null,
    BoldItalicUnderlineToggles: () => null,
    ChangeCodeMirrorLanguage: () => null,
    CodeToggle: () => null,
    ConditionalContents: () => null,
    CreateLink: () => null,
    DiffSourceToggleWrapper: ({ children }) => children,
    InsertCodeBlock: () => null,
    ListsToggle: () => null,
    UndoRedo: () => null,
  }
})

describe('PostMarkdownEditor theme bridge', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    editorState.lastProps = null
  })

  it('passes the active document theme down to the mdx editor surface', () => {
    document.documentElement.dataset.theme = 'dark'

    render(
      <PostMarkdownEditor
        value="# themed editor"
        onChange={() => {}}
      />,
    )

    expect(editorState.lastProps.className).toContain('dark-theme')
    expect(editorState.lastProps.className).not.toContain('light-theme')
  })
})
