import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FrontendV2MarkdownContent from './FrontendV2MarkdownContent.jsx'

vi.mock('./ShikiCodeBlock.jsx', () => ({
  default: function ShikiCodeBlockMock({ code, language }) {
    return <div data-testid="code-block">{language}:{code}</div>
  },
}))

describe('FrontendV2MarkdownContent', () => {
  it('routes fenced code blocks through ShikiCodeBlock', () => {
    render(<FrontendV2MarkdownContent content={'```ts\nconst answer = 42\n```'} />)
    expect(screen.getByTestId('code-block')).toHaveTextContent('ts:const answer = 42')
  })
})
