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
    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Roadmap Draft' } })
    fireEvent.change(screen.getByLabelText('标签'), { target: { value: 'tag-a, tag-b' } })
    fireEvent.change(screen.getByLabelText('上传附件'), {
      target: {
        files: [new File(['outline'], 'roadmap.txt', { type: 'text/plain' })],
      },
    })

    expect(screen.getByText('提交前确认')).toBeInTheDocument()
    expect(screen.getByText('Roadmap Draft')).toBeInTheDocument()
    expect(screen.getByText('2 个')).toBeInTheDocument()
    expect(screen.getByText('1 个')).toBeInTheDocument()
  })

  it('shows an early status note for guests before they try to submit', async () => {
    authState.isAuthed = false
    authState.token = null

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('当前身份')).toBeInTheDocument()
    expect(screen.getByText('游客浏览，登录后才能真正提交。')).toBeInTheDocument()
  })
})
