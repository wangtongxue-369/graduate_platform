import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import ThemeSwitch from '@/components/ThemeSwitch.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'

const roleLabelMap = {
  guest: '公共浏览',
  common: '公共模块',
  student: '学生工作站',
  admin: '平台总台',
}

function getAvatarText(name = '', role = 'guest') {
  const clean = name.trim()

  if (clean) return clean.slice(0, 1).toUpperCase()
  return role === 'admin' ? 'A' : 'G'
}

export default function SiteHeader({ role = 'guest' }) {
  const navigate = useNavigate()
  const { user, isAuthed, logout } = useAuth()
  const homeLink = role === 'guest' ? '/' : getRoleLandingPath(user)
  const showRoleHome = role === 'student' || role === 'admin' || (role === 'common' && isAuthed)
  const avatarText = getAvatarText(user?.name, user?.role || role)

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <header className={`v1-header v1-header--${role}`}>
      <div className="v1-header-inner">
        <Link className="v1-brand" to={homeLink}>
          <span className="v1-brand-mark">GP</span>
          <span className="v1-brand-copy">
            <strong>毕业去向平台</strong>
            <small>{roleLabelMap[role]} / graduate platform</small>
          </span>
        </Link>

        <div className="v1-header-directory">
          <nav className="v1-nav" aria-label="全站导航">
            <Link to="/community">社区</Link>
            <Link to="/practice">题库</Link>
            {showRoleHome ? <Link to={homeLink}>主站</Link> : null}
          </nav>
          <span className="v1-header-chip">{roleLabelMap[role]}</span>
        </div>

        <div className="v1-actions">
          <ThemeSwitch />
          {isAuthed ? (
            <>
              <Link className="v1-user-chip" to="/profile">
                <span className="v1-user-avatar" aria-hidden="true">{avatarText}</span>
                <span className="v1-user-summary">
                  <strong>{user?.name || '个人中心'}</strong>
                  <small>{user?.role === 'admin' ? '管理员' : '已登录'}</small>
                </span>
              </Link>
              <button className="v1-btn v1-btn--ghost" type="button" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <>
              <RoleAuthLink className="v1-text-link">
                登录
              </RoleAuthLink>
              <Link className="v1-btn v1-btn--primary" to="/register">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
