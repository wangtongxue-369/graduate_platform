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

  it('opens the personal post editor when a post row is clicked', async () => {
    renderPage()

    const rowLink = await screen.findByRole('link', { name: /复试资料整理方法/i })

    expect(rowLink).toHaveAttribute('href', '/settings/posts/101/edit')
    fireEvent.click(rowLink)

    expect(await screen.findByRole('heading', { name: '帖子编辑页' })).toBeInTheDocument()
  })
})
