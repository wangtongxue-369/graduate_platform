import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminShell from './AdminShell.jsx'
import CommonShell from './CommonShell.jsx'
import SettingsShell from './SettingsShell.jsx'

const authState = {
  loading: false,
  isAuthed: true,
  user: {
    id: 1,
    name: '考研测试用户',
    role: 'user',
    target: 'kaoyan',
  },
}

vi.mock('@legacy/context/AuthContext.jsx', () => ({
  useAuth: () => authState,
}))

describe('stack shells', () => {
  beforeEach(() => {
    authState.loading = false
    authState.isAuthed = true
    authState.user = {
      id: 1,
      name: '考研测试用户',
      role: 'user',
      target: 'kaoyan',
    }
  })

  it('shows common modules and direction modules for signed-in users', () => {
    render(
      <MemoryRouter initialEntries={['/community']}>
        <Routes>
          <Route element={<CommonShell />}>
            <Route
              path="/community"
              element={<div className="v2-main-column"><h1>社区内容</h1></div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '个人设置' })).toHaveAttribute('href', '/settings/profile')
    expect(screen.getByRole('link', { name: '社区' })).toHaveAttribute('href', '/community')
    expect(screen.getByRole('link', { name: '题库' })).toHaveAttribute('href', '/practice')
    expect(screen.getByRole('link', { name: '院校比较' })).toHaveAttribute('href', '/station/kaoyan/schools')
  })

  it('shows governance modules for admins', () => {
    authState.user = {
      id: 9,
      name: '管理员',
      role: 'admin',
      target: 'job',
    }

    render(
      <MemoryRouter initialEntries={['/admin/community']}>
        <Routes>
          <Route element={<AdminShell />}>
            <Route
              path="/admin/community"
              element={<div className="v2-main-column"><h1>社区治理</h1></div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '社区治理' })).toHaveAttribute('href', '/admin/community')
    expect(screen.getByRole('link', { name: '题库治理' })).toHaveAttribute('href', '/admin/question-banks')
    expect(screen.getByRole('link', { name: '就业运营' })).toHaveAttribute('href', '/admin/employment')
    expect(screen.queryByRole('link', { name: '院校比较' })).not.toBeInTheDocument()
  })

  it('shows a way back to the main site from settings', () => {
    render(
      <MemoryRouter initialEntries={['/settings/profile']}>
        <Routes>
          <Route element={<SettingsShell />}>
            <Route
              path="/settings/profile"
              element={<div className="v2-main-column"><h1>个人信息</h1></div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '返回主站' })).toHaveAttribute('href', '/community')
  })
})
