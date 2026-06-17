import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RegisterForm from './RegisterForm.jsx'

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    register: vi.fn(),
  }),
}))

vi.mock('@legacy/lib/api.js', () => ({
  authApi: {
    sendCode: vi.fn(),
  },
}))

describe('RegisterForm', () => {
  it('marks the register flow with a dedicated compact-layout class', () => {
    const { container } = render(
      <MemoryRouter>
        <RegisterForm onSwitchLogin={() => {}} />
      </MemoryRouter>,
    )

    const form = container.querySelector('form')

    expect(form).toHaveClass('v2-auth-form--register')
    expect(screen.getByRole('button', { name: '注册并进入平台' })).toBeInTheDocument()
  })
})
