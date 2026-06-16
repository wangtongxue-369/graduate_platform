import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsPostsPage from '@/pages/settings/SettingsPostsPage.jsx'

const authState = vi.hoisted(() => ({
  token: 'dev-token',
}))

const userApiMocks = vi.hoisted(() => ({
  myPosts: vi.fn(),
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  userApi: userApiMocks,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings/posts']}>
      <Routes>
        <Route path="/settings/posts" element={<SettingsPostsPage />} />
        <Route path="/settings/posts/:postId/edit" element={<h1>帖子编辑页</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SettingsPostsPage', () => {
  beforeEach(() => {
    authState.token = 'dev-token'
    userApiMocks.myPosts.mockReset()
  })

  it('removes the redundant page lead copy', () => {
    renderPage()

    expect(screen.queryByText('在设置域里统一管理自己的帖子，先筛查状态，再进入独立编辑页。')).not.toBeInTheDocument()
  })

  it('opens the personal post editor when a post row is clicked', async () => {
    renderPage()

    const rowLink = await screen.findByRole('link', { name: /复试资料整理方法/i })

    expect(rowLink).toHaveAttribute('href', '/settings/posts/101/edit')
    fireEvent.click(rowLink)

    expect(await screen.findByRole('heading', { name: '帖子编辑页' })).toBeInTheDocument()
  })

  it('shows a side filter panel and narrows posts by name and direction', async () => {
    authState.token = 'remote-token'
    userApiMocks.myPosts.mockResolvedValue({
      content: [
        { id: 201, title: 'Alpha 考研记录', category: '考研', status: 'PUBLISHED', createdAt: '2026-06-16T10:00:00' },
        { id: 202, title: 'Beta 就业整理', category: '就业', status: 'PUBLISHED', createdAt: '2026-06-15T10:00:00' },
        { id: 203, title: 'Gamma 留学时间线', category: '留学', status: 'PUBLISHED', createdAt: '2026-06-14T10:00:00' },
      ],
    })

    renderPage()

    expect(await screen.findByRole('link', { name: /Alpha 考研记录/i })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: '我的发帖筛选器' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('名称'), {
      target: { value: 'Gamma' },
    })

    expect(screen.getByRole('link', { name: /Gamma 留学时间线/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Alpha 考研记录/i })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('名称'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('方向'), {
      target: { value: '就业' },
    })

    expect(screen.getByRole('link', { name: /Beta 就业整理/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gamma 留学时间线/i })).not.toBeInTheDocument()
  })

  it('paginates the filtered list and resets to the first page after filtering', async () => {
    authState.token = 'remote-token'
    userApiMocks.myPosts.mockResolvedValue({
      content: [
        { id: 301, title: '第一页 A', category: '考研', status: 'PUBLISHED', createdAt: '2026-06-16T10:00:00' },
        { id: 302, title: '第一页 B', category: '考研', status: 'PUBLISHED', createdAt: '2026-06-15T10:00:00' },
        { id: 303, title: '第一页 C', category: '就业', status: 'PUBLISHED', createdAt: '2026-06-14T10:00:00' },
        { id: 304, title: '第一页 D', category: '留学', status: 'PUBLISHED', createdAt: '2026-06-13T10:00:00' },
        { id: 305, title: '第二页 E', category: '就业', status: 'PUBLISHED', createdAt: '2026-06-12T10:00:00' },
        { id: 306, title: '第二页 F', category: '考研', status: 'PUBLISHED', createdAt: '2026-06-11T10:00:00' },
      ],
    })

    renderPage()

    expect(await screen.findByRole('link', { name: /第一页 A/i })).toBeInTheDocument()
    expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /第二页 E/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /第二页 E/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /第一页 A/i })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('名称'), {
      target: { value: '第二页 F' },
    })

    expect(screen.getByText('第 1 / 1 页')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /第二页 F/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /第二页 E/i })).not.toBeInTheDocument()
  })
})
