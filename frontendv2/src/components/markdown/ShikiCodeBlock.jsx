import { useEffect, useId, useRef, useState } from 'react'
import { resolveCodeLanguage, shouldShowLineNumbers } from './codeLanguage.js'
import { highlightCode } from './shikiRuntime.js'

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

async function copyCode(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export default function ShikiCodeBlock({ code, language }) {
  const panelId = useId()
  const resetTimerRef = useRef(null)
  const [rendered, setRendered] = useState({
    html: '',
    language: 'text',
    lineCount: 1,
    usedFallback: false,
  })
  const [copied, setCopied] = useState(false)
  const showLineNumbers = shouldShowLineNumbers(code)

  useEffect(() => () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let active = true
    const resolved = resolveCodeLanguage(language, code)

    async function loadHighlight() {
      try {
        const next = await highlightCode({
          code,
          language: resolved.language,
        })

        if (active) {
          setRendered(next)
        }
      } catch {
        if (active) {
          const content = escapeHtml(code)
          setRendered({
            html: `<pre class="shiki shiki--fallback"><code>${content}</code></pre>`,
            language: resolved.language,
            lineCount: String(code || '').split('\n').length,
            usedFallback: true,
          })
        }
      }
    }

    loadHighlight()

    return () => {
      active = false
    }
  }, [code, language])

  async function handleCopy() {
    try {
      await copyCode(code)
      setCopied(true)
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current)
      }
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false)
      }, 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className={`v2-shiki-codeblock${rendered.usedFallback ? ' is-fallback' : ''}`}
      data-testid="shiki-code-block"
      data-line-numbers={showLineNumbers ? 'true' : 'false'}
      aria-labelledby={`${panelId}-language`}
    >
      <div className="v2-shiki-codeblock__toolbar">
        <span className="v2-shiki-codeblock__tab" id={`${panelId}-language`}>
          {rendered.language || 'text'}
        </span>
        <button
          type="button"
          className="v2-shiki-codeblock__copy"
          aria-label="Copy code"
          onClick={handleCopy}
        >
          <span aria-hidden="true">{copied ? 'check' : 'copy'}</span>
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <div
        className="v2-shiki-codeblock__body"
        dangerouslySetInnerHTML={{ __html: rendered.html }}
      />
    </section>
  )
}
