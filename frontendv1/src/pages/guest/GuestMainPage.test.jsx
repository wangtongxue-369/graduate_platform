import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import GuestMainPage from './GuestMainPage.jsx'

describe('GuestMainPage', () => {
  it('shows public modules and explicit login gating copy', () => {
    render(
      <MemoryRouter>
        <GuestMainPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '先看内容，再决定是否进入身份语境。' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '游客门厅阶段' })).toBeInTheDocument()
    expect(screen.getAllByText('社区目录').length).toBeGreaterThan(0)
    expect(screen.getAllByText('题库目录').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '登录后继续' })).toBeInTheDocument()
  })
})
