import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPostEditPage from '@/pages/settings/SettingsPostEditPage.jsx'

const authState = vi.hoisted(() => ({
  token: 'remote-token',
}))

const userApiMocks = vi.hoisted(() => ({
  myPostDetail: vi.fn(),
  updateMyPost: vi.fn(),
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  userApi: userApiMocks,
}))

vi.mock('@/components/editor/PostMarkdownEditor.jsx', () => ({
  default: function PostMarkdownEditorMock({ label, value, onChange }) {
    return (
      <label>
        <span>{label}</span>
        <textarea
          aria-label={label}
          data-testid="post-markdown-editor"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </label>
    )
  },
}))

function renderPage(initialEntry = '/settings/posts/101/edit') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/settings/posts/:postId/edit" element={<SettingsPostEditPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SettingsPostEditPage', () => {
  beforeEach(() => {
    authState.token = 'remote-token'
    userApiMocks.myPostDetail.mockReset()
    userApiMocks.updateMyPost.mockReset()
  })

  it('loads a personal post and saves edits through the backend', async () => {
    userApiMocks.myPostDetail.mockResolvedValue({
      id: 101,
      title: '钱钟书著述格局',
      content: '这是一段足够长的原始正文内容，用来验证个人帖子编辑页的加载行为。',
      categoryCode: 'kaoyan',
      category: '考研',
      tags: '文学,经验',
      visibility: 'public',
      anonymous: false,
      status: 'PUBLISHED',
      updatedAt: '2026-06-12T10:20:00',
    })
    userApiMocks.updateMyPost.mockResolvedValue({
      id: 101,
      status: 'PUBLISHED',
      updatedAt: '2026-06-12T11:00:00',
      category: '经验分享',
    })

    renderPage()

    await screen.findByDisplayValue('钱钟书著述格局')

    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '钱钟书著述格局修订版' },
    })
    fireEvent.change(screen.getByLabelText('分类'), {
      target: { value: 'experience' },
    })
    fireEvent.change(screen.getByLabelText('标签'), {
      target: { value: '文学,修订' },
    })
    fireEvent.change(screen.getByLabelText('Markdown 文档编辑器'), {
      target: { value: '这是一段重新编辑后的正文内容，长度已经超过校验阈值，可以直接保存。' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存并继续编辑' }))

    await waitFor(() => {
      expect(userApiMocks.updateMyPost).toHaveBeenCalledWith('101', {
        title: '钱钟书著述格局修订版',
        content: '这是一段重新编辑后的正文内容，长度已经超过校验阈值，可以直接保存。',
        categoryCode: 'experience',
        tags: '文学,修订',
        visibility: 'public',
        anonymous: false,
      }, 'remote-token')
    })

    expect(await screen.findByText('帖子内容已保存。')).toBeInTheDocument()
    expect(screen.getByText('当前分类').parentElement).toHaveTextContent('经验分享')
  })

  it('renders a single immersive markdown editor without comparison preview controls', async () => {
    userApiMocks.myPostDetail.mockResolvedValue({
      id: 101,
      title: '编辑器体验演示',
      content: '# 复盘标题\n\n这是原始正文。',
      categoryCode: 'kaoyan',
      category: '考研',
      tags: '复盘',
      visibility: 'public',
      anonymous: false,
      status: 'PUBLISHED',
      updatedAt: '2026-06-12T10:20:00',
    })

    renderPage()

    await screen.findByRole('heading', { name: '正文工作台' })

    expect(await screen.findByTestId('post-markdown-editor')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '对照预览' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '沉浸编辑' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Markdown 实时预览')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Markdown 文档编辑器'), {
      target: { value: '# 新的标题\n\n这是一段新的正文内容。' },
    })

    expect(screen.getByLabelText('Markdown 文档编辑器')).toHaveValue('# 新的标题\n\n这是一段新的正文内容。')
  })

  it('updates preview data locally when using the preview token', async () => {
    authState.token = 'dev-token'

    renderPage('/settings/posts/demo-post/edit')

    expect(await screen.findByText('帖子编辑：预览数据')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('标题'), {
      target: { value: '预览帖子已更新标题' },
    })
    fireEvent.change(screen.getByLabelText('Markdown 文档编辑器'), {
      target: { value: '这是一段本地预览正文，长度足够长，用来验证预览模式下的本地保存。' },
    })

    fireEvent.click(screen.getByRole('button', { name: '保存并继续编辑' }))

    expect(userApiMocks.updateMyPost).not.toHaveBeenCalled()
    expect(await screen.findByText('帖子编辑：本地预览已更新')).toBeInTheDocument()
    expect(screen.getByDisplayValue('预览帖子已更新标题')).toBeInTheDocument()
  })
})
