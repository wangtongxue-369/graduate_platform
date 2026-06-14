import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const indexCss = readFileSync(resolve(import.meta.dirname, './index.css'), 'utf8')
const appCss = readFileSync(resolve(import.meta.dirname, './App.css'), 'utf8')
const studyRoomPageSource = readFileSync(
  resolve(import.meta.dirname, './pages/kaoyan/StudyRoomPage.jsx'),
  'utf8',
)

function getChatSection(startMarker, endMarker) {
  const startIndex = appCss.indexOf(startMarker)
  const endIndex = appCss.indexOf(endMarker, startIndex)
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Unable to locate CSS section between "${startMarker}" and "${endMarker}"`)
  }
  return appCss.slice(startIndex, endIndex)
}

describe('study room discussion area dark mode adaptation', () => {
  it('declares a full set of --chat-* tokens in :root (light defaults)', () => {
    // Each --chat-* token used by App.css must have a value under :root,
    // otherwise it falls through to its dark variant and looks wrong in
    // light mode.
    const lightRoot = indexCss.match(/:root\s*\{[\s\S]*?\n\}/)
    expect(lightRoot, 'light :root block must exist').not.toBeNull()
    const lightBody = lightRoot[0]
    const requiredTokens = [
      '--chat-bg',
      '--chat-pattern',
      '--chat-scroll-thumb',
      '--chat-bubble-bg',
      '--chat-bubble-border',
      '--chat-bubble-mine-bg',
      '--chat-bubble-mine-border',
      '--chat-bubble-mine-text',
      '--chat-composer-bg',
      '--chat-composer-border',
      '--chat-textarea-border',
      '--chat-textarea-focus',
      '--chat-textarea-focus-ring',
      '--chat-textarea-disabled-bg',
      '--chat-textarea-disabled-color',
      '--chat-icon-button-border',
      '--chat-icon-button-color',
      '--chat-icon-button-hover-bg',
    ]
    for (const token of requiredTokens) {
      expect(lightBody, `light :root must define ${token}`).toMatch(new RegExp(`${token}\\s*:`))
    }
  })

  it('overrides every --chat-* token in the dark theme', () => {
    // Each token must be re-declared under :root[data-theme='dark'] so the
    // discussion area swaps to dark-mode-appropriate colors when the user
    // toggles the theme.
    const darkRoot = indexCss.match(/:root\[data-theme='dark'\]\s*\{[\s\S]*?\n\}/)
    expect(darkRoot, 'dark :root block must exist').not.toBeNull()
    const darkBody = darkRoot[0]
    const requiredTokens = [
      '--chat-bg',
      '--chat-pattern',
      '--chat-scroll-thumb',
      '--chat-bubble-bg',
      '--chat-bubble-border',
      '--chat-bubble-mine-bg',
      '--chat-bubble-mine-border',
      '--chat-bubble-mine-text',
      '--chat-composer-bg',
      '--chat-composer-border',
      '--chat-textarea-border',
      '--chat-textarea-focus',
      '--chat-textarea-focus-ring',
      '--chat-textarea-disabled-bg',
      '--chat-textarea-disabled-color',
      '--chat-icon-button-border',
      '--chat-icon-button-color',
      '--chat-icon-button-hover-bg',
    ]
    for (const token of requiredTokens) {
      expect(darkBody, `dark :root must override ${token}`).toMatch(new RegExp(`${token}\\s*:`))
    }
  })

  it('replaces the old hardcoded colors in the chat message list', () => {
    // The message list used to bake `#eef7f5` and `rgba(15, 118, 110, 0.035)`
    // into its background and scrollbar, which looked wrong in dark mode.
    const section = getChatSection('.chat-message-list {', '.chat-bubble-row {')
    expect(section).toContain('var(--chat-bg)')
    expect(section).toContain('var(--chat-pattern)')
    expect(section).toContain('var(--chat-scroll-thumb)')
    expect(section).not.toMatch(/#eef7f5\b/)
    expect(section).not.toMatch(/rgba\(15,\s*118,\s*110,\s*0\.035\)/)
    expect(section).not.toMatch(/rgba\(15,\s*118,\s*110,\s*0\.36\)/)
  })

  it('replaces the old hardcoded bubble border and mine-bubble colors', () => {
    // The bubble (#d9e7e4 border, #95ec69/#132018 mine style) used to lock
    // in light-mode colors. The mine bubble now flips to a mint palette
    // tied to var(--primary) when dark mode is active.
    const section = getChatSection('.chat-bubble {', '.chat-bubble p {')
    expect(section).toContain('var(--chat-bubble-border)')
    expect(section).toContain('var(--chat-bubble-bg)')
    expect(section).toContain('var(--chat-bubble-mine-bg)')
    expect(section).toContain('var(--chat-bubble-mine-border)')
    expect(section).toContain('var(--chat-bubble-mine-text)')
    expect(section).not.toMatch(/#d9e7e4\b/)
    expect(section).not.toMatch(/#95ec69\b/)
    expect(section).not.toMatch(/#98d8cd\b/)
    expect(section).not.toMatch(/#132018\b/)
  })

  it('replaces the old hardcoded composer and textarea colors', () => {
    // The composer (border-top #d7e6e3 / bg rgba(247,250,249,...)) and
    // textarea (#d8e5e2 border / #95d6cc focus / #94a3b8 disabled) all had
    // to be remapped to theme tokens.
    const section = getChatSection('.chat-composer {', '.chat-file-input {')
    expect(section).toContain('var(--chat-composer-bg)')
    expect(section).toContain('var(--chat-composer-border)')
    expect(section).toContain('var(--chat-textarea-border)')
    expect(section).toContain('var(--chat-textarea-focus)')
    expect(section).toContain('var(--chat-textarea-focus-ring)')
    expect(section).toContain('var(--chat-textarea-disabled-bg)')
    expect(section).toContain('var(--chat-textarea-disabled-color)')
    expect(section).not.toMatch(/#d7e6e3\b/)
    expect(section).not.toMatch(/#d8e5e2\b/)
    expect(section).not.toMatch(/#95d6cc\b/)
    expect(section).not.toMatch(/#f1f5f9\b/)
    expect(section).not.toMatch(/#94a3b8\b/)
  })

  it('replaces the old hardcoded icon-button colors', () => {
    // The chat icon button (used in 1v1 messaging composer) had hardcoded
    // #b8d5d0 border and #0f766e hover. Now driven by --chat-icon-button-*.
    const section = getChatSection('.chat-icon-button {', '.chat-plus-icon {')
    expect(section).toContain('var(--chat-icon-button-border)')
    expect(section).toContain('var(--chat-icon-button-color)')
    expect(section).toContain('var(--chat-icon-button-hover-bg)')
    expect(section).toContain('var(--primary)')
    expect(section).not.toMatch(/#b8d5d0\b/)
    expect(section).not.toMatch(/#5f7772\b/)
    expect(section).not.toMatch(/#eef7f5\b/)
  })

  it('keeps the discussion area markup unchanged', () => {
    // Sanity check: the JSX for the discussion area still uses the same
    // chat-* class names so the new CSS rules apply.
    expect(studyRoomPageSource).toContain('chat-message-list')
    expect(studyRoomPageSource).toContain('chat-bubble-row')
    expect(studyRoomPageSource).toContain('chat-bubble"')
    expect(studyRoomPageSource).toContain('chat-bubble-head')
    expect(studyRoomPageSource).toContain('chat-composer')
  })
})
