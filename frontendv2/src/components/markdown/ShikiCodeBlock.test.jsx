import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShikiCodeBlock from './ShikiCodeBlock.jsx'

const highlightCodeMock = vi.fn()

vi.mock('./shikiRuntime.js', () => ({
  highlightCode: (...args) => highlightCodeMock(...args),
}))

describe('ShikiCodeBlock', () => {
  beforeEach(() => {
    highlightCodeMock.mockReset()
    highlightCodeMock.mockResolvedValue({
      html: '<pre class="shiki"><code><span class="line"><span style="color:#C586C0">const</span></span></code></pre>',
      language: 'ts',
      lineCount: 8,
      usedFallback: false,
    })

    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('shows copied feedback after clicking copy', async () => {
    render(<ShikiCodeBlock code={'const value = 1'} language="ts" />)
    const button = await screen.findByRole('button', { name: /copy code/i })
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveTextContent('已复制'))
  })

  it('adds line numbers only when the block is long enough', async () => {
    render(<ShikiCodeBlock code={'a\nb\nc\nd\ne\nf\ng'} language="text" />)
    expect(await screen.findByTestId('shiki-code-block')).toHaveAttribute('data-line-numbers', 'true')
  })
})
