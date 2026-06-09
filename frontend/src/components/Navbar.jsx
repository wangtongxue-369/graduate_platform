import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const trackMenus = {
  kaoyan: {
    label: '考研专属',
    to: '/kaoyan',
    items: [
      { label: '分数线/报录比', to: '/kaoyan/scores' },
      { label: '复习计划打卡', to: '/kaoyan/plan' },
      { label: '备考资料', to: '/kaoyan/materials' },
      { label: '同频自习室', to: '/kaoyan/studyroom' },
      { label: '1v1 咨询', to: '/kaoyan/consult' },
    ],
  },
  kaogong: {
    label: '考公专属',
    to: '/kaogong',
    items: [
      { label: '岗位匹配', to: '/kaogong/matching' },
      { label: '进面分数线', to: '/kaogong/scores' },
      { label: '考试日历', to: '/kaogong/calendar' },
      { label: '模拟面试', to: '/kaogong/interview' },
    ],
  },
  job: {
    label: '就业专属',
    to: '/job',
    items: [
      { label: '宣讲会/网申', to: '/job/fairs' },
      { label: '简历模板', to: '/job/resume' },
      { label: '岗位推荐', to: '/job/recommend' },
      { label: '投递跟踪', to: '/job/applications' },
    ],
  },
  liuxue: {
    label: '留学专属',
    to: '/studyabroad',
    items: [
      { label: '申请项目', to: '/studyabroad/applications' },
      { label: '申请时间线', to: '/studyabroad/timeline' },
      { label: '材料清单', to: '/studyabroad/materials' },
      { label: '经验库', to: '/studyabroad/experience' },
      { label: '录取案例库', to: '/studyabroad/admission-cases' },
      { label: '留学社区（并入）', to: '/community?category=liuxue' },
    ],
  },
}

function TrackDropdown({ menu }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="dropdown-trigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {menu.label}
        <span className="dropdown-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open ? (
        <div className="dropdown-menu">
          <Link className="dropdown-item all" to={menu.to} onClick={() => setOpen(false)}>
            功能面板首页
          </Link>
          <div className="dropdown-divider" />
          {menu.items.map((item) => (
            <Link
              className="dropdown-item"
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function Navbar() {
  const { isAuthed, user, logout } = useAuth()
  const target = user?.target || ''
  const menu = trackMenus[target] || null

  return (
    <header className="nav">
      <Link className="logo" to="/">
        <span className="logo-mark">GP</span>
        <div>
          <div className="logo-title">毕业去向平台</div>
          <div className="logo-sub">升学 · 考公 · 就业 · 留学</div>
        </div>
      </Link>

      <nav className="nav-links">
        <NavLink to="/community">社区</NavLink>
        <NavLink to="/practice">题库</NavLink>
        {isAuthed && menu ? <TrackDropdown menu={menu} /> : null}
        {isAuthed && user?.role === 'admin' ? <NavLink to="/admin">管理后台</NavLink> : null}
      </nav>

      <div className="nav-actions">
        {isAuthed ? (
          <>
            <Link className="btn ghost" to="/profile">{user?.name || '用户中心'}</Link>
            <button className="btn primary" type="button" onClick={logout}>退出</button>
          </>
        ) : (
          <>
            <Link className="btn ghost" to="/login">登录</Link>
            <Link className="btn primary" to="/register">注册</Link>
          </>
        )}
      </div>
    </header>
  )
}
