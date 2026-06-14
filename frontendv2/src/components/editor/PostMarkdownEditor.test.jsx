import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PostMarkdownEditor from './PostMarkdownEditor.jsx'

const editorState = vi.hoisted(() => ({
  lastProps: null,
  setMarkdown: vi.fn(),
  codeBlockPlugin: vi.fn(() => ({ type: 'codeblock' })),
  codeMirrorPlugin: vi.fn(() => ({ type: 'codemirror' })),
}))

vi.mock('@mdxeditor/editor', async () => {
  const React = await import('react')

  const MockMDXEditor = React.forwardRef(function MockMDXEditor(props, ref) {
    editorState.lastProps = props
    React.useImperativeHandle(ref, () => ({
      setMarkdown: editorState.setMarkdown,
    }))

    return (
      <button
        type="button"
        data-testid="post-markdown-editor"
        aria-label={props.placeholder}
        onClick={() => props.onChange?.('# updated from editor', false)}
      >
        {props.markdown}
      </button>
    )
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
    codeBlockPlugin: editorState.codeBlockPlugin,
    codeMirrorPlugin: editorState.codeMirrorPlugin,
    BlockTypeSelect: () => <span>BlockTypeSelect</span>,
    BoldItalicUnderlineToggles: () => <span>BoldItalicUnderlineToggles</span>,
    ChangeCodeMirrorLanguage: () => <span>ChangeCodeMirrorLanguage</span>,
    CodeToggle: () => <span>CodeToggle</span>,
    ConditionalContents: ({ options }) => {
      const fallback = options.find((option) => 'fallback' in option)
      return <div>{fallback?.fallback?.() || null}</div>
    },
    CreateLink: () => <span>CreateLink</span>,
    DiffSourceToggleWrapper: ({ children }) => <div>{children}</div>,
    InsertCodeBlock: () => <span>InsertCodeBlock</span>,
    ListsToggle: () => <span>ListsToggle</span>,
    UndoRedo: () => <span>UndoRedo</span>,
  }
})

describe('PostMarkdownEditor', () => {
  beforeEach(() => {
    editorState.lastProps = null
    editorState.setMarkdown.mockReset()
    editorState.codeBlockPlugin.mockClear()
    editorState.codeMirrorPlugin.mockClear()
  })

  it('forwards markdown changes from the editor surface', () => {
    const handleChange = vi.fn()

    render(
      <PostMarkdownEditor
        label="Markdown 文档编辑器"
        value="# 初始内容"
        onChange={handleChange}
      />,
    )

    fireEvent.click(screen.getByTestId('post-markdown-editor'))

    expect(handleChange).toHaveBeenCalledWith('# updated from editor')
  })

  it('pushes external markdown updates back into the editor instance', async () => {
    const { rerender } = render(
      <PostMarkdownEditor
        label="Markdown 文档编辑器"
        value="# 第一版"
        onChange={() => {}}
      />,
    )

    rerender(
      <PostMarkdownEditor
        label="Markdown 文档编辑器"
        value="# 第二版"
        onChange={() => {}}
      />,
    )

    await waitFor(() => {
      expect(editorState.setMarkdown).toHaveBeenCalledWith('# 第二版')
    })
  })

  it('enables code block plugins so fenced code can be parsed in rich text mode', () => {
    render(
      <PostMarkdownEditor
        label="Markdown 文档编辑器"
        value={'```js\nconsole.log(1)\n```'}
        onChange={() => {}}
      />,
    )

    expect(editorState.codeBlockPlugin).toHaveBeenCalled()
    expect(editorState.codeMirrorPlugin).toHaveBeenCalled()
  })
})
