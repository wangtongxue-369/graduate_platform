import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AdminEmploymentWorkbenchPage from './AdminEmploymentWorkbenchPage.jsx'

describe('AdminEmploymentWorkbenchPage', () => {
  it('renders employment management as an operations workbench', () => {
    render(
      <MemoryRouter>
        <AdminEmploymentWorkbenchPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '就业运营台' })).toBeInTheDocument()
    expect(screen.getByText('招聘会管理')).toBeInTheDocument()
    expect(screen.getByText('岗位管理')).toBeInTheDocument()
    expect(screen.getByText('简历概览')).toBeInTheDocument()
    expect(screen.getByText('通知触发')).toBeInTheDocument()
  })
})
