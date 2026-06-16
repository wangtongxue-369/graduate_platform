import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityComposerPage from './CommunityComposerPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const categoriesMock = vi.fn()
const notificationsMock = vi.fn()

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: (...args) => categoriesMock(...args),
    createPost: vi.fn(),
    notifications: (...args) => notificationsMock(...args),
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
  createCommunityPreviewPosts: () => [],
  shouldForceCommunityPreview: () => false,
}))

describe('CommunityComposerPage', () => {
  beforeEach(() => {
    authState.isAuthed = true
    authState.token = 'real-token'
    categoriesMock.mockReset()
    notificationsMock.mockReset()
    categoriesMock.mockResolvedValue([
      { id: 'job', code: 'job', name: 'Job' },
    ])
    notificationsMock.mockResolvedValue({
      content: [],
      unreadCount: 0,
      totalElements: 0,
      totalPages: 1,
      number: 0,
      size: 1,
    })
  })

  it('adds tag slots and keeps tag values separate', async () => {
    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Roadmap Draft' } })
    fireEvent.change(screen.getByLabelText('标签 1'), { target: { value: 'tag-a' } })
    fireEvent.click(screen.getByRole('button', { name: '新增标签输入框' }))
    fireEvent.change(screen.getByLabelText('标签 2'), { target: { value: 'tag-b' } })

    expect(screen.getByDisplayValue('Roadmap Draft')).toBeInTheDocument()
    expect(screen.getByDisplayValue('tag-a')).toBeInTheDocument()
    expect(screen.getByDisplayValue('tag-b')).toBeInTheDocument()
  })

  it('shows an early status note for guests before they try to submit', async () => {
    authState.isAuthed = false
    authState.token = null

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('游客当前可以先查看发布结构，登录后再提交到后端。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交审核' })).toBeInTheDocument()
  })

  it('limits each tag input to 10 characters', async () => {
    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('标签 1'), { target: { value: '123456789012345' } })

    expect(screen.getByLabelText('标签 1')).toHaveValue('1234567890')
  })
})
