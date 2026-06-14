import { describe, expect, it } from 'vitest'
import {
  detectCodeLanguage,
  normalizeCodeLanguage,
  resolveCodeLanguage,
} from './codeLanguage.js'

describe('normalizeCodeLanguage', () => {
  it('maps common aliases to bundled language ids', () => {
    expect(normalizeCodeLanguage('TS')).toBe('ts')
    expect(normalizeCodeLanguage('shell')).toBe('bash')
    expect(normalizeCodeLanguage('yml')).toBe('yaml')
    expect(normalizeCodeLanguage('md')).toBe('markdown')
  })
})

describe('detectCodeLanguage', () => {
  it('detects json conservatively', () => {
    expect(detectCodeLanguage('{\n  "ok": true\n}\n')).toBe('json')
  })

  it('detects bash from shebang and shell syntax', () => {
    expect(detectCodeLanguage('#!/usr/bin/env bash\nnpm run build\n')).toBe('bash')
  })
})

describe('resolveCodeLanguage', () => {
  it('prefers a declared supported language over detection', () => {
    expect(resolveCodeLanguage('tsx', 'console.log(1)')).toEqual({
      language: 'tsx',
      source: 'declared',
    })
  })

  it('falls back to text when detection is weak', () => {
    expect(resolveCodeLanguage('', 'just a sentence')).toEqual({
      language: 'text',
      source: 'fallback',
    })
  })
})
