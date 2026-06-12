import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AdminQuestionBankLedgerPage from './AdminQuestionBankLedgerPage.jsx'

describe('AdminQuestionBankLedgerPage', () => {
  it('renders question bank governance as a data table workbench', () => {
    render(
      <MemoryRouter>
        <AdminQuestionBankLedgerPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '题库治理' })).toBeInTheDocument()
    expect(screen.getByText('题库列表')).toBeInTheDocument()
    expect(screen.getByText('批量导入')).toBeInTheDocument()
    expect(screen.getByText('题目快照')).toBeInTheDocument()
  })
})
