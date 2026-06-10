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

    expect(screen.getByRole('heading', { name: '先看清路，再决定要不要进入。' })).toBeInTheDocument()
    expect(screen.getByText('社区')).toBeInTheDocument()
    expect(screen.getByText('题库')).toBeInTheDocument()
    expect(screen.getByText('登录后继续')).toBeInTheDocument()
  })
})
