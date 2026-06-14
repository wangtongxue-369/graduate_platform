const SUPPORTED_LANGUAGES = new Set([
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
])

const LANGUAGE_ALIASES = {
  cjs: 'javascript',
  htm: 'html',
  html5: 'html',
  js: 'javascript',
  json5: 'json',
  jsx: 'jsx',
  md: 'markdown',
  mjs: 'javascript',
  plain: 'text',
  plaintext: 'text',
  shell: 'bash',
  sh: 'bash',
  text: 'text',
  ts: 'ts',
  typescript: 'typescript',
  txt: 'text',
  yml: 'yaml',
}

function toSourceText(value) {
  return String(value || '').trim().toLowerCase()
}

export function normalizeCodeLanguage(input) {
  const normalized = toSourceText(input)
  if (!normalized) return ''
  return LANGUAGE_ALIASES[normalized] || normalized
}

export function detectCodeLanguage(code) {
  const value = String(code || '')
  const trimmed = value.trim()

  if (!trimmed) return 'text'

  if (
    (/^[\[{]/.test(trimmed) && /"\s*[\w-]+"\s*:/.test(trimmed)) ||
    (/^\[/.test(trimmed) && /{\s*"\s*[\w-]+"\s*:/.test(trimmed))
  ) {
    return 'json'
  }

  if (
    /^#!.*\b(bash|sh|zsh)\b/m.test(value) ||
    /(^|\n)\s*(npm|pnpm|yarn|bun|echo|cd|ls|cat|export|set -e)\b/.test(value)
  ) {
    return 'bash'
  }

  if (/<[a-z][^>]*>[\s\S]*<\/[a-z]+>|<!doctype html>/i.test(trimmed)) {
    return 'html'
  }

  if (
    /^\s*[\w-]+\s*:\s*.+$/m.test(value) &&
    !/[;{}()]/.test(value) &&
    !/\b(function|const|let|class)\b/.test(value)
  ) {
    return 'yaml'
  }

  if (
    /\b(interface|type|enum)\b/.test(value) ||
    /:\s*(string|number|boolean|unknown|never|any)(\[])?\b/.test(value) ||
    /\bimplements\b/.test(value)
  ) {
    return 'typescript'
  }

  if (/<[A-Z][A-Za-z0-9]*(\s|>)/.test(value) || /return\s*\(\s*</.test(value)) {
    return 'jsx'
  }

  if (/\b(const|let|var|function|import|export)\b/.test(value) || /=>/.test(value)) {
    return 'javascript'
  }

  return 'text'
}

export function resolveCodeLanguage(declaredLanguage, code) {
  const declared = normalizeCodeLanguage(declaredLanguage)
  if (SUPPORTED_LANGUAGES.has(declared)) {
    return {
      language: declared,
      source: 'declared',
    }
  }

  const detected = normalizeCodeLanguage(detectCodeLanguage(code))
  if (SUPPORTED_LANGUAGES.has(detected) && detected !== 'text') {
    return {
      language: detected,
      source: 'detected',
    }
  }

  return {
    language: 'text',
    source: 'fallback',
  }
}

export function shouldShowLineNumbers(code, threshold = 6) {
  return String(code || '').split('\n').length >= threshold
}

