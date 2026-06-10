import { Link } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { getRoleLandingPath } from '@/lib/roleRouting.js'

const roleLabelMap = {
  guest: '公共浏览',
  student: '学生工作站',
  admin: '平台总台',
}

export default function SiteHeader({ role = 'guest' }) {
  const { user, isAuthed, logout } = useAuth()
  const homeLink = role === 'guest' ? '/' : getRoleLandingPath(user)

  return (
    <header className={`v1-header v1-header--${role}`}>
      <div className="v1-header-band" />
      <div className="v1-header-inner">
        <Link className="v1-brand" to={homeLink}>
          <span className="v1-brand-mark">GP</span>
          <span className="v1-brand-copy">
            <strong>毕业去向平台</strong>
            <small>{roleLabelMap[role]}</small>
          </span>
        </Link>

        <nav className="v1-nav" aria-label="全站导航">
          <Link to="/community">社区</Link>
          <Link to="/practice">题库</Link>
          {role !== 'guest' ? <Link to={homeLink}>主站</Link> : null}
        </nav>

        <div className="v1-actions">
          {isAuthed ? (
            <>
              <Link className="v1-text-link" to="/profile">
                {user?.name || '个人中心'}
              </Link>
              <button className="v1-btn v1-btn--ghost" type="button" onClick={logout}>
                退出
              </button>
            </>
          ) : (
            <>
              <Link className="v1-text-link" to="/login">
                登录
              </Link>
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
