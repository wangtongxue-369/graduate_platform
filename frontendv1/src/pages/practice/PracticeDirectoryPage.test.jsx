import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PracticeDirectoryPage from './PracticeDirectoryPage.jsx'

describe('PracticeDirectoryPage', () => {
  it('renders a question-bank tree and a clear session entry path', () => {
    render(
      <MemoryRouter>
        <PracticeDirectoryPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '开始练习前先选目录。' })).toBeInTheDocument()
    expect(screen.getAllByText('题库目录').length).toBeGreaterThan(0)
    expect(screen.getAllByText('登录后继续').length).toBeGreaterThan(0)
  })
})
