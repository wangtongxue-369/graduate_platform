import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommunityComposerPage from './CommunityComposerPage.jsx'

const authState = {
  isAuthed: true,
  token: 'real-token',
}

const categoriesMock = vi.fn()
const notificationsMock = vi.fn()
const createPostMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  communityApi: {
    categories: (...args) => categoriesMock(...args),
    createPost: (...args) => createPostMock(...args),
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
    createPostMock.mockReset()
    navigateMock.mockReset()
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

  it('shows submit validation errors in a dialog instead of an inline error strip', async () => {
    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(document.querySelector('.v2-status-error')).toBeNull()
  })

  it('shows the selected markdown file so the user can confirm it is attached', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    const markdownInput = container.querySelector('input[accept=".md,.markdown"]')
    expect(markdownInput).not.toBeNull()
    fireEvent.change(markdownInput, {
      target: {
        files: [new File(['# Title'], 'roadmap.md', { type: 'text/markdown' })],
      },
    })

    expect(await screen.findByText('已选择：roadmap.md（7 B）')).toBeInTheDocument()
  })

  it('blocks empty markdown files before submit and shows a clearer error', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Roadmap Draft' } })
    const markdownInput = container.querySelector('input[accept=".md,.markdown"]')
    expect(markdownInput).not.toBeNull()
    fireEvent.change(markdownInput, {
      target: {
        files: [new File([''], 'empty.md', { type: 'text/markdown' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    expect(await screen.findByText('你选择的 Markdown 文件是空文件，请确认内容后重新上传。')).toBeInTheDocument()
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('blocks unsupported attachments before submit and explains the allowed requirements', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    const titleInput = container.querySelector('input[type="text"]')
    const textareas = container.querySelectorAll('textarea')
    const attachmentInput = container.querySelector('input[type="file"][multiple]')
    const submitButton = container.querySelector('.v2-primary-link')
    expect(titleInput).not.toBeNull()
    expect(textareas.length).toBeGreaterThan(0)
    expect(attachmentInput).not.toBeNull()
    expect(submitButton).not.toBeNull()

    fireEvent.change(titleInput, { target: { value: 'Attachment Rules' } })
    fireEvent.change(textareas[0], { target: { value: 'Attachment content body' } })
    fireEvent.change(attachmentInput, {
      target: {
        files: [new File(['binary'], 'script.exe', { type: 'application/octet-stream' })],
      },
    })
    fireEvent.click(submitButton)

    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain('script.exe')
    expect(dialog.textContent).toContain('20MB')
    expect(dialog.textContent).toContain('pdf')
    expect(dialog.textContent).toContain('7z')
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('shows a dialog for guests when they try to submit', async () => {
    authState.isAuthed = false
    authState.token = null

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Guest Draft' } })
    fireEvent.change(screen.getByLabelText('正文内容'), { target: { value: 'Guest content body' } })
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    expect(await screen.findByText('当前还不能提交帖子')).toBeInTheDocument()
    expect(screen.getByText('游客状态只能先浏览和整理内容，登录后才能把帖子真正提交到社区。')).toBeInTheDocument()
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('shows a dialog for demo accounts when they try to submit', async () => {
    authState.isAuthed = true
    authState.token = 'dev-token'

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Demo Draft' } })
    fireEvent.change(screen.getByLabelText('正文内容'), { target: { value: 'Demo content body' } })
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    expect(await screen.findByText('当前账号处于演示模式')).toBeInTheDocument()
    expect(screen.getByText('演示账号只展示发帖流程，不会真的向后端创建帖子。请切换到真实账号后再提交。')).toBeInTheDocument()
    expect(createPostMock).not.toHaveBeenCalled()
  })

  it('shows a success dialog before navigating after publish', async () => {
    createPostMock.mockResolvedValue({ id: 42 })

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Publish Draft' } })
    fireEvent.change(screen.getByLabelText('正文内容'), { target: { value: 'Publish content body' } })
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    expect(await screen.findByText('帖子已提交审核')).toBeInTheDocument()
    expect(screen.getByText('你的帖子已经提交到社区审核流，审核通过后就会出现在社区目录里。')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '查看帖子' }))
    expect(navigateMock).toHaveBeenCalledWith('/community/42')
  })

  it('shows a success dialog before navigating after saving a draft', async () => {
    createPostMock.mockResolvedValue({ id: 77 })

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Draft Save' } })
    fireEvent.change(screen.getByLabelText('正文内容'), { target: { value: 'Draft content body' } })
    fireEvent.click(screen.getByRole('button', { name: '保存草稿' }))

    expect(await screen.findByText('草稿已保存')).toBeInTheDocument()
    expect(screen.getByText('这篇帖子已经保存到你的个人帖子里，你可以稍后继续编辑。')).toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }))
    expect(navigateMock).toHaveBeenCalledWith('/settings/posts/77/edit')
  })

  it('shows backend business errors in the dialog', async () => {
    const rawErrorMessage = '含附件帖子至少上传一个附件'
    const attachHint = '至少 1 个附件'
    createPostMock.mockRejectedValue(new Error(rawErrorMessage))

    const { container } = render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    const titleInput = container.querySelector('input[type="text"]')
    const textareas = container.querySelectorAll('textarea')
    const submitButton = container.querySelector('.v2-primary-link')
    expect(titleInput).not.toBeNull()
    expect(textareas.length).toBeGreaterThan(0)
    expect(submitButton).not.toBeNull()

    fireEvent.change(titleInput, { target: { value: 'Attachment Post' } })
    fireEvent.change(textareas[0], { target: { value: 'Attachment content body' } })
    fireEvent.click(submitButton)

    const dialog = await screen.findByRole('dialog')
    expect(dialog.textContent).toContain(rawErrorMessage)
    expect(dialog.textContent).toContain(attachHint)
    expect(dialog.textContent).toContain('20MB')
    expect(dialog.textContent).toContain('pdf')
    expect(dialog.textContent).toContain('7z')
  })

  it('maps generic network failures to a clearer dialog message', async () => {
    createPostMock.mockRejectedValue(new Error('Failed to fetch'))

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Network Post' } })
    fireEvent.change(screen.getByLabelText('正文内容'), { target: { value: 'Network content body' } })
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    expect(await screen.findByText('网络连接暂时不可用')).toBeInTheDocument()
    expect(screen.getByText('当前没有成功连上服务，请检查网络或稍后重试。')).toBeInTheDocument()
  })

  it('disables submit actions while the request is in flight', async () => {
    let resolveRequest
    createPostMock.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve
    }))

    render(
      <MemoryRouter initialEntries={['/community/new']}>
        <CommunityComposerPage />
      </MemoryRouter>,
    )

    await screen.findByRole('combobox')
    fireEvent.change(screen.getByLabelText('帖子标题'), { target: { value: 'Pending Post' } })
    fireEvent.change(screen.getByLabelText('正文内容'), { target: { value: 'Pending content body' } })
    fireEvent.click(screen.getByRole('button', { name: '提交审核' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '提交中...' })).toBeDisabled()
      expect(screen.getByRole('button', { name: '保存草稿' })).toBeDisabled()
    })

    resolveRequest({ id: 1 })
  })
})
