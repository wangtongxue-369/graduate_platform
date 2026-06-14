import { createHighlighter } from 'shiki'

const SHIKI_LANGUAGES = [
  'bash',
  'css',
  'html',
  'javascript',
  'json',
  'jsx',
  'markdown',
  'text',
  'ts',
  'tsx',
  'typescript',
  'yaml',
]

let highlighterPromise

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: SHIKI_LANGUAGES,
      themes: ['light-plus', 'dark-plus'],
    })
  }

  return highlighterPromise
}

export async function highlightCode({ code, language }) {
  const content = String(code || '')
  const lineCount = content ? content.split('\n').length : 1
  const highlighter = await getHighlighter()
  const html = highlighter.codeToHtml(content, {
    lang: language,
    themes: {
      light: 'light-plus',
      dark: 'dark-plus',
    },
    defaultColor: false,
  })

  return {
    html,
    language,
    lineCount,
    usedFallback: language === 'text',
  }
}

