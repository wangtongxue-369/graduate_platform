import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

function readDocumentTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export default function PostMarkdownEditor({
  className = '',
  label = 'Markdown 文档编辑器',
  value = '',
  onChange,
}) {
  const editorRef = useRef(null)
  const lastMarkdownRef = useRef(value)
  const [editorTheme, setEditorTheme] = useState(readDocumentTheme)

  const plugins = useMemo(() => ([
    headingsPlugin(),
    listsPlugin(),
    linkPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    markdownShortcutPlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
    codeMirrorPlugin({
      codeBlockLanguages: {
        txt: 'Plain text',
        js: 'JavaScript',
        ts: 'TypeScript',
        jsx: 'JSX',
        tsx: 'TSX',
        json: 'JSON',
        bash: 'Bash',
        python: 'Python',
        java: 'Java',
        css: 'CSS',
        html: 'HTML',
        sql: 'SQL',
      },
    }),
    diffSourcePlugin({ viewMode: 'rich-text' }),
    toolbarPlugin({
      toolbarContents: () => (
        <ConditionalContents
          options={[
            {
              when: (editor) => editor?.editorType === 'codeblock',
              contents: () => <ChangeCodeMirrorLanguage />,
            },
            {
              fallback: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  <ListsToggle />
                  <BlockTypeSelect />
                  <InsertCodeBlock />
                  <DiffSourceToggleWrapper>
                    <CodeToggle />
                    <CreateLink />
                  </DiffSourceToggleWrapper>
                </>
              ),
            },
          ]}
        />
      ),
    }),
  ]), [])

  useEffect(() => {
    const nextValue = value || ''
    if (nextValue === lastMarkdownRef.current) return

    lastMarkdownRef.current = nextValue
    editorRef.current?.setMarkdown?.(nextValue)
  }, [value])

  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return undefined

    const root = document.documentElement
    const syncTheme = () => setEditorTheme(readDocumentTheme())

    syncTheme()

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'data-theme')) {
        syncTheme()
      }
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  function handleChange(nextValue) {
    lastMarkdownRef.current = nextValue
    onChange?.(nextValue)
  }

  return (
    <section className={`v2-post-md-editor ${className}`} aria-label={label}>
      <span className="v2-post-md-editor-label">{label}</span>
      <MDXEditor
        ref={editorRef}
        className={`v2-post-md-editor-surface ${editorTheme === 'dark' ? 'dark-theme' : 'light-theme'}`}
        contentEditableClassName="v2-post-md-editor-content v2-post-markdown"
        markdown={value || ''}
        onChange={handleChange}
        placeholder={label}
        plugins={plugins}
      />
    </section>
  )
}
