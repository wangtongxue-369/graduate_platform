import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@legacy/context/AuthContext.jsx'
import App from './App.jsx'

vi.mock('@legacy/context/AuthContext.jsx', async () => {
  const React = await import('react')

  const devUsers = {
    kaoyan: { id: 'dev-1', name: '考研测试用户', target: 'kaoyan', role: 'user' },
    kaogong: { id: 'dev-2', name: '考公测试用户', target: 'kaogong', role: 'user' },
    job: { id: 'dev-3', name: '就业测试用户', target: 'job', role: 'user' },
    liuxue: { id: 'dev-4', name: '留学测试用户', target: 'liuxue', role: 'user' },
    admin: { id: 'dev-0', name: '管理员测试用户', target: 'job', role: 'admin' },
  }

  const TestAuthContext = React.createContext(null)

  function TestAuthProvider({ children, initialTarget = null }) {
    const initialUser = initialTarget ? devUsers[initialTarget] : null
    const [user, setUser] = React.useState(initialUser)
    const [token, setToken] = React.useState(initialUser ? 'dev-token' : '')

    function switchDevUser(target) {
      if (!target) {
        setUser(null)
        setToken('')
        return
      }

      const nextUser = devUsers[target]
      if (!nextUser) return

      setUser(nextUser)
      setToken('dev-token')
    }

    function logout() {
      setUser(null)
      setToken('')
    }

    return React.createElement(
      TestAuthContext.Provider,
      {
        value: {
          token,
          user,
          loading: false,
          isAuthed: Boolean(user),
          login: vi.fn(),
          register: vi.fn(),
          logout,
          switchDevUser,
        },
      },
      children,
    )
  }

  return {
    AuthProvider: TestAuthProvider,
    useAuth: () => React.useContext(TestAuthContext),
  }
})

function renderApp(initialEntries = ['/'], authProps = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider {...authProps}>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('frontendv1 role auth dialog flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens a role selection dialog when guest users click login', async () => {
    renderApp(['/'])

    fireEvent.click(screen.getByRole('link', { name: '登录后继续' }))

    expect(await screen.findByRole('dialog', { name: '选择你要进入的工作语境' })).toBeInTheDocument()
    expect(screen.getByText('考研')).toBeInTheDocument()
    expect(screen.getByText('管理员')).toBeInTheDocument()
  })

  it('lands on the admin station after choosing 管理员 from the auth dialog', async () => {
    renderApp(['/'])

    fireEvent.click(screen.getByRole('link', { name: '登录后继续' }))
    fireEvent.click((await screen.findByText('管理员')).closest('button'))

    expect(await screen.findByRole('heading', { name: '值班总台' })).toBeInTheDocument()
  })

  it('returns to the guest station after clicking logout from a preview role', async () => {
    renderApp(['/app'], { initialTarget: 'admin' })

    fireEvent.click(await screen.findByRole('button', { name: '退出' }))

    expect(await screen.findByRole('heading', { name: '先看内容，再决定是否进入身份语境。' })).toBeInTheDocument()
  })
})
