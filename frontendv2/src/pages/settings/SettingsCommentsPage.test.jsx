import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsCommentsPage from '@/pages/settings/SettingsCommentsPage.jsx'

const authState = vi.hoisted(() => ({
  token: 'dev-token',
}))

const userApiMocks = vi.hoisted(() => ({
  myComments: vi.fn(),
}))

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

vi.mock('@legacy/lib/api.js', () => ({
  userApi: userApiMocks,
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings/comments']}>
      <Routes>
        <Route path="/settings/comments" element={<SettingsCommentsPage />} />
        <Route path="/community/:postId" element={<h1>原帖详情页</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SettingsCommentsPage', () => {
  beforeEach(() => {
    authState.token = 'dev-token'
    userApiMocks.myComments.mockReset()
  })

  it('removes the redundant page lead copy', () => {
    renderPage()

    expect(screen.queryByText('强调评论内容与原帖回链。')).not.toBeInTheDocument()
  })

  it('shows a side filter panel and only filters after the manual action', async () => {
    authState.token = 'remote-token'
    userApiMocks.myComments.mockResolvedValue({
      content: [
        { id: 201, postId: 11, postTitle: 'Test01', content: '没毛病' },
        { id: 202, postId: 12, postTitle: 'Java复习', content: '这段需要再补一张图' },
        { id: 203, postId: 13, postTitle: '留学时间线', content: '文书节奏要再往前提' },
      ],
    })

    renderPage()

    expect(await screen.findByText('Test01')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: '我的评论筛选器' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('所在贴名字'), {
      target: { value: 'Java' },
    })

    expect(screen.getByText('Test01')).toBeInTheDocument()
    expect(screen.getByText('Java复习')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '手动筛选' }))

    expect(screen.getByText('Java复习')).toBeInTheDocument()
    expect(screen.queryByText('Test01')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('所在贴名字'), {
      target: { value: '' },
    })
    fireEvent.change(screen.getByLabelText('评论内容'), {
      target: { value: '文书' },
    })

    expect(screen.getByText('Java复习')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '手动筛选' }))

    expect(screen.getByText('留学时间线')).toBeInTheDocument()
    expect(screen.queryByText('Java复习')).not.toBeInTheDocument()
  })

  it('paginates the filtered list and returns to the first page after applying a new filter', async () => {
    authState.token = 'remote-token'
    userApiMocks.myComments.mockResolvedValue({
      content: [
        { id: 301, postId: 21, postTitle: '第一页 A', content: '考研笔记 1' },
        { id: 302, postId: 22, postTitle: '第一页 B', content: '考研笔记 2' },
        { id: 303, postId: 23, postTitle: '第一页 C', content: '就业笔记 3' },
        { id: 304, postId: 24, postTitle: '第一页 D', content: '留学笔记 4' },
        { id: 305, postId: 25, postTitle: '第二页 E', content: '就业笔记 5' },
        { id: 306, postId: 26, postTitle: '第二页 F', content: '定向内容 6' },
      ],
    })

    renderPage()

    expect(await screen.findByText('第一页 A')).toBeInTheDocument()
    expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument()
    expect(screen.queryByText('第二页 E')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一页' }))

    expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument()
    expect(screen.getByText('第二页 E')).toBeInTheDocument()
    expect(screen.queryByText('第一页 A')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('评论内容'), {
      target: { value: '定向内容' },
    })
    fireEvent.click(screen.getByRole('button', { name: '手动筛选' }))

    expect(screen.getByText('第 1 / 1 页')).toBeInTheDocument()
    expect(screen.getByText('第二页 F')).toBeInTheDocument()
    expect(screen.queryByText('第二页 E')).not.toBeInTheDocument()
  })
})
