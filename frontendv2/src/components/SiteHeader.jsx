import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import ThemeSwitch from '@/components/ThemeSwitch.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'

const roleLabelMap = {
  guest: '游客大厅',
  common: '公共浏览层',
  student: '方向主站',
  admin: '治理总台',
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
    <header className={`v2-header v2-header--${role}`}>
      <div className="v2-header-inner">
        <Link className="v2-brand" to={homeLink}>
          <span className="v2-brand-mark">GP</span>
          <span className="v2-brand-copy">
            <strong>Graduate Platform</strong>
            <small>{roleLabelMap[role]}</small>
          </span>
        </Link>

        <nav className="v2-header-nav" aria-label="全站导航">
          <Link to="/community">社区</Link>
          <Link to="/practice">题库</Link>
          {showRoleHome ? <Link to={homeLink}>主站</Link> : null}
        </nav>

        <div className="v2-header-actions">
          <ThemeSwitch />
          {isAuthed ? (
            <>
              <Link className="v2-user-chip" to={homeLink}>
                <span className="v2-user-avatar" aria-hidden="true">{avatarText}</span>
                <span className="v2-user-copy">
                  <strong>{user?.name || '当前用户'}</strong>
                  <small>{user?.role === 'admin' ? '管理员身份' : '已登录'}</small>
                </span>
              </Link>
              <button className="v2-ghost-link" type="button" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <>
              <RoleAuthLink className="v2-ghost-link">
                登录
              </RoleAuthLink>
              <RoleAuthLink className="v2-header-cta">
                选择身份
              </RoleAuthLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
