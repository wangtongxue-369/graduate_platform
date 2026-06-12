import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AdminCommunityWorkbenchPage from './AdminCommunityWorkbenchPage.jsx'

describe('AdminCommunityWorkbenchPage', () => {
  it('renders community governance as an audit-family workbench', () => {
    render(
      <MemoryRouter>
        <AdminCommunityWorkbenchPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '社区治理' })).toBeInTheDocument()
    expect(screen.getByText('帖子待审')).toBeInTheDocument()
    expect(screen.getByText('帖子举报')).toBeInTheDocument()
    expect(screen.getByText('评论举报')).toBeInTheDocument()
    expect(screen.getByText('分类管理')).toBeInTheDocument()
    expect(screen.getByText('用户状态管理')).toBeInTheDocument()
  })
})
