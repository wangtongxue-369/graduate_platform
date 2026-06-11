import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: null, token: '', isAuthed: false, loading: false }),
}))

describe('frontendv1 smoke routing', () => {
  it('renders the guest landing route at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: '先看内容，再决定是否进入身份语境。' })).toBeInTheDocument()
  })
})
