import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import PracticeBankPage from './PracticeBankPage.jsx'

describe('PracticeBankPage', () => {
  it('renders a bank workbench and a separate result destination', () => {
    render(
      <MemoryRouter initialEntries={['/practice/1']}>
        <Routes>
          <Route path="/practice/:id" element={<PracticeBankPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '考研英语阅读训练' })).toBeInTheDocument()
    expect(screen.getByText('练习会话入口')).toBeInTheDocument()
    expect(screen.getByText('结果去向')).toBeInTheDocument()
  })
})
