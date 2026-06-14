import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminCommunityReviewsPage } from './AdminCommunityPages.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    token: 'dev-token',
    isAuthed: true,
    user: { id: 1, role: 'admin', name: 'Admin Tester' },
  }),
}))

vi.mock('@legacy/components/MarkdownContent.jsx', () => ({
  default: function LegacyMarkdownContentMock({ content }) {
    return <div data-testid="legacy-markdown">{content}</div>
  },
}))

vi.mock('@/components/markdown/FrontendV2MarkdownContent.jsx', () => ({
  default: function FrontendV2MarkdownContentMock({ content }) {
    return <div data-testid="shiki-code-block">{content}</div>
  },
}))

describe('AdminCommunityReviewsPage markdown integration', () => {
  it('renders the frontendv2 markdown renderer on the admin review surface', async () => {
    render(
      <MemoryRouter>
        <AdminCommunityReviewsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('shiki-code-block')).toBeInTheDocument()
  })
})
