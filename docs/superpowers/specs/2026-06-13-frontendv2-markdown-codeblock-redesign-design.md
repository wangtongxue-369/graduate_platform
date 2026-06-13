# frontendv2 Markdown Code Block Redesign Design

Date: 2026-06-13
Status: Draft for review
Scope: `frontendv2` pages that render Markdown content through the shared legacy `MarkdownContent` renderer

## Summary

`frontendv2` currently reuses the legacy Markdown renderer for community posts and other Markdown surfaces, but fenced code blocks still feel like generic content cards instead of readable code workspaces. The current rendering has three problems:

1. Code blocks do not have token-level syntax highlighting, so readability is weak.
2. The control chrome feels heavy in the wrong places and too plain in the places that matter.
3. The code block container does not feel like a distinct editor-style window, especially when compared with the surrounding prose.

This redesign introduces a shared `ShikiCodeBlock` layer for all `frontendv2` Markdown surfaces. The goal is to make code blocks feel closer to a lightweight VS Code reading surface while still respecting the site theme.

## Goals

1. Upgrade all `frontendv2` Markdown code blocks to use Shiki syntax highlighting.
2. Reuse one shared rendering layer across every `frontendv2` page that depends on the current Markdown renderer.
3. Follow page theme changes with dual light and dark highlighting output.
4. Improve readability first, then interaction quality, then structural window feel.
5. Preserve safe fallbacks so Markdown content never breaks if highlighting fails.

## Non-goals

1. Replacing the full Markdown parser.
2. Expanding this redesign into `frontend` or `frontendv1` in the same change.
3. Changing stored post content format.
4. Moving highlighting to the backend or save-time pre-rendering.

## Current State

`frontendv2` uses `@legacy/components/MarkdownContent.jsx` to render Markdown bodies. The parser already handles fenced code blocks and currently renders them as:

- `div.markdown-code-block`
- `div.markdown-code-head`
- `div.markdown-code-label`
- `button.markdown-copy-btn`
- `pre > code`

`frontendv2` recently added local visual styling for these classes in `src/index.css`, but that styling is still based on plain text output. This means the reading experience is limited by the structure and content of the legacy renderer rather than only by CSS.

## Product Decisions Confirmed

The following behavior has been explicitly confirmed during design review:

1. Scope: apply the redesign to all `frontendv2` pages that share this Markdown renderer.
2. Highlighting engine: use Shiki.
3. Bundle strategy: ship a constrained language set rather than every Shiki language.
4. Theme behavior: follow the page theme rather than forcing a permanent dark code block.
5. Long code blocks: show line numbers only for longer blocks.
6. Long lines: keep horizontal scrolling rather than auto-wrapping.
7. Visual tone: stay close to VS Code Light+ and Dark+.
8. Unknown languages: try automatic language detection, then fall back safely.
9. Toolbar: use a light toolbar.
10. Copy affordance: icon plus text, with momentary copied feedback.
11. Copy button visibility: reveal on hover and keyboard focus.
12. Language label: render as a small tab.
13. Container feel: make the code block feel like a distinct window.
14. Window chrome strength: use restrained chrome rather than a heavy faux desktop frame.

## Architecture

### Shared responsibility split

The implementation will keep the existing Markdown parser in place and only replace the fenced code block rendering path.

Planned boundaries:

1. `MarkdownContent`
Responsible for parsing Markdown into blocks and delegating code blocks to a dedicated renderer.

2. `ShikiCodeBlock`
Responsible for code block presentation, toolbar rendering, copy feedback, line-number decisions, and final HTML output.

3. `shikiRuntime`
Responsible for one-time Shiki initialization, theme setup, supported language registration, caching, and language detection handoff.

4. `codeLanguage`
Responsible for language normalization, alias mapping, and detection fallback ordering.

This keeps parsing, highlighting, and UI behavior separated enough that later visual work does not have to reach into runtime setup code.

### Why this shape

This follows the recommended middle path for the current codebase:

1. Keep the legacy parser so scope stays focused.
2. Introduce one global shared rendering layer for code blocks.
3. Avoid an overly local patch that traps all new logic inside one large component.

## Data Flow

The code block rendering flow will be:

1. `MarkdownContent` parses fenced code blocks into `{ type: 'code', language, content }`.
2. Instead of rendering plain `<pre><code>`, `MarkdownContent` passes the block to `ShikiCodeBlock`.
3. `ShikiCodeBlock` resolves the final language through a helper pipeline:
   - use explicitly declared language first
   - normalize aliases
   - if missing or unsupported, attempt detection
   - if detection is weak or unsupported, fall back to `text`
4. `shikiRuntime` returns highlighted HTML for the resolved language using dual themes.
5. `ShikiCodeBlock` renders:
   - a restrained top chrome
   - a small tab-like language label on the left
   - a hover or focus-visible copy button on the right
   - a code viewport that can scroll horizontally
   - optional line numbers for long blocks

## Language Strategy

### Initial supported set

The first release will bundle a practical core set:

- `js`
- `ts`
- `jsx`
- `tsx`
- `json`
- `bash`
- `shell`
- `yaml`
- `yml`
- `md`
- `markdown`
- `html`
- `css`

### Alias handling

The language helper should normalize common aliases before handing them to Shiki. Examples:

- `sh` -> `bash`
- `shell` -> `bash`
- `yml` -> `yaml`
- `md` -> `markdown`

### Detection behavior

Shiki does not provide official built-in language auto-detection. To preserve the agreed product behavior, the implementation will add a small detection layer ahead of Shiki. Detection should be conservative.

Rules:

1. If the author declares a supported language, trust it.
2. If the author omits a language, run lightweight detection.
3. If detection does not produce a supported result with enough confidence, use `text`.
4. Do not guess aggressively enough to produce obviously wrong highlighting.

## Theme Strategy

Code blocks will use Shiki dual-theme output and track the page theme.

Behavior:

1. Light pages use a Light+-like code block palette.
2. Dark pages use a Dark+-like code block palette.
3. Theme switches should not require re-parsing Markdown bodies.
4. Container chrome and structural CSS still come from `frontendv2` theme tokens so the code block belongs to the site rather than feeling imported from another product.

## Visual Design

### Container

The code block should feel like a distinct but restrained editor window:

1. Clear border and surface separation from prose.
2. Tighter, more deliberate window radius than the current generic content card.
3. Enough shadow and surface depth to signal a separate reading plane.
4. Spacing before and after the block should support prose rhythm rather than collapsing into the paragraph stack.

### Toolbar

The top chrome should be thin and quiet.

Left side:

1. Tab-like language label.
2. Low-noise styling that feels like a small editor tab, not a marketing badge.

Right side:

1. Copy button with icon plus text.
2. Hidden by default on pointer devices.
3. Becomes visible on hover and on keyboard focus within the block.
4. On success, switches from the default copy label to the copied label briefly, then resets.

### Code viewport

1. Horizontal scrolling by default for long lines.
2. No forced line wrapping.
3. Line numbers shown only for longer blocks.
4. Font stack stays mono-focused and closer to editor reading than body typography.
5. Token contrast should stay close to VS Code defaults.

## Readability Rules

Because readability is the first redesign stage, implementation should prioritize:

1. Distinct token coloring for comments, keywords, strings, numbers, function names, and punctuation.
2. Comfortable mono font sizing and line height.
3. Enough contrast between background and token colors in both themes.
4. Reduced visual noise in the toolbar so the code itself remains the main focal point.

## Interaction Rules

### Copy behavior

1. Primary path uses the Clipboard API.
2. Existing fallback behavior remains available when Clipboard API is not available.
3. Copy failure should not affect rendering.
4. The button must retain an accessible name in every state.

### Visibility behavior

1. On pointer devices, the copy action stays subtle until hover.
2. For keyboard users, the button must become visible on focus within the code block.
3. The focus ring must be visible and use the existing theme focus language.

## Error Handling and Fallbacks

The redesign must never break prose rendering.

Fallback rules:

1. If Shiki initialization fails, render a plain code block with existing structural classes.
2. If a language is unsupported, use `text`.
3. If detection fails, use `text`.
4. If highlight generation fails for one block, degrade only that block.
5. If copy fails, show no success state and keep the code visible.

## Performance Strategy

Because Shiki browser bundles can become large, the implementation should keep the first version disciplined:

1. Use a constrained language set.
2. Use one shared runtime instance.
3. Cache highlighter setup so multiple Markdown surfaces do not pay initialization repeatedly.
4. Avoid full-app re-render work on theme switches where possible.

If performance still becomes a problem after the first pass, lazy highlighting can be explored later, but it is not part of this design.

## Testing Strategy

### Unit tests

Add logic coverage for:

1. Alias normalization.
2. Language resolution ordering.
3. Unknown language fallback to `text`.
4. Long-block line-number threshold behavior.
5. Runtime failure fallback behavior.

### Component tests

Add coverage for:

1. Language tab rendering.
2. Copy button visibility on hover or focus scenarios.
3. Success feedback switching from the default copy label to the copied label.
4. Fallback rendering when highlighting fails.
5. Presence or absence of line numbers based on block length.

### Page regression tests

Verify at least:

1. A community detail page.
2. At least one other `frontendv2` Markdown surface that shares the same renderer.

This confirms the redesign is truly global to `frontendv2` and not a single-page patch.

## Acceptance Criteria

The work is complete when all of the following are true:

1. All `frontendv2` Markdown surfaces that rely on the shared renderer use Shiki-based code block highlighting.
2. Light theme and dark theme both render code blocks in a VS Code-like palette that follows page theme changes.
3. The initial language bundle covers the agreed common set.
4. Missing or unsupported languages attempt detection and then safely fall back to `text`.
5. Long code blocks show line numbers; shorter ones do not.
6. Long lines scroll horizontally instead of wrapping.
7. The toolbar uses a left tab-like language label and a right copy button with icon plus text.
8. The copy button appears on hover and keyboard focus, and briefly shows the copied state after success.
9. If highlighting fails, prose still renders and the code block degrades safely.
10. Relevant unit, component, and regression tests pass.
11. Browser verification confirms the new code block works in both light and dark themes.

## Risks

1. Browser-side Shiki setup may add noticeable weight if the language set expands too far.
2. Automatic language detection may produce false positives if allowed to be too aggressive.
3. CSS for hover-only controls can accidentally hide actions from keyboard users if focus states are not tested.
4. Shared renderer changes can unintentionally affect admin or settings pages unless regression coverage is broad enough.

## Rollout Notes

This design intentionally stops at the shared renderer and reading experience. It does not change post storage, backend content processing, or the personal post editor. Those can stay on their current paths while `frontendv2` reading surfaces are upgraded first.
