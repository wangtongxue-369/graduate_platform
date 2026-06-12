import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityComposerPage from './CommunityComposerPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const categoriesMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: (...args) => categoriesMock(...args),
    createPost: vi.fn(),
  },
}))

vi.mock('@/components/PageIntro.jsx', () => ({
  default: function PageIntroMock({ title, actions }) {
    return (
      <section>
        <h1>{title}</h1>
        <div>{actions}</div>
      </section>
    )
  },
}))

vi.mock('@/components/SubnavTabs.jsx', () => ({
  default: function SubnavTabsMock() {
    return <nav aria-label="community subnav" />
  },
}))

vi.mock('@/lib/communityPreview.js', () => ({
  createCommunityPreviewCategories: () => [],
  shouldForceCommunityPreview: () => false,
}))

describe('CommunityComposerPage', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    categoriesMock.mockReset()
    categoriesMock.mockResolvedValue([
      { id: 'job', code: 'job', name: 'Job' },
    ])
  })

  it('shows the current summary card and updates tag count', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    const textInputs = container.querySelectorAll('input[type="text"]')
    fireEvent.change(textInputs[1], { target: { value: 'tag-a, tag-b' } })

    expect(screen.getAllByText('Job').length).toBeGreaterThan(0)
    expect(screen.getByText('2 个')).toBeInTheDocument()
  })

  it('shows an early status note for guests before they try to submit', async () => {
    authState.isAuthed = false
    authState.token = null

    const { container } = render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findAllByRole('button')
    expect(container.querySelector('.v2-status-note')).not.toBeNull()
  })
})
