import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
} from '@legacy/lib/preferences.js'
import ThemeSwitch from '@/components/ThemeSwitch.jsx'
import {
  getAppNavigation,
  getSettingsNavigation,
  getShellDescription,
  getShellTitle,
} from '@/lib/navigation.js'
import { getRoleLandingPath } from '@/lib/roleRouting.js'

const languageOptions = [
  { value: 'zh-CN', label: '中文' },
  { value: 'bilingual', label: '双语' },
  { value: 'en', label: 'English' },
]

function readLanguageMode() {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.languageMode || DEFAULT_PREFERENCES.languageMode
  } catch {
    return DEFAULT_PREFERENCES.languageMode
  }
}

function persistLanguageMode(languageMode) {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...parsed, languageMode }),
    )
  } catch {
    // ignore local preference persistence failures
  }
}

function getAvatarText(name = '') {
  const clean = String(name || '').trim()
  return clean ? clean.slice(0, 1).toUpperCase() : 'G'
}

export default function HugoStackSidebar({ mode = 'app' }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [languageMode, setLanguageMode] = useState(readLanguageMode)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sidebarRef = useRef(null)

  const groups = useMemo(() => (
    mode === 'settings' ? getSettingsNavigation() : getAppNavigation(user)
  ), [mode, user])

  const profilePath = '/settings/profile'
  const homePath = getRoleLandingPath(user)
  const avatarText = getAvatarText(user?.name)

  useEffect(() => {
    if (!settingsOpen) return undefined

    function handlePointerDown(event) {
      if (!sidebarRef.current?.contains(event.target)) {
        setSettingsOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [settingsOpen])

  async function handleLogout() {
    setSettingsOpen(false)
    if (!user) {
      navigate('/login')
      return
    }
    await logout()
    navigate('/', { replace: true })
  }

  function handleLanguageChange(nextValue) {
    setLanguageMode(nextValue)
    persistLanguageMode(nextValue)
  }

  return (
    <aside className="v2-stack-sidebar" ref={sidebarRef}>
      <div className="v2-stack-sidebar__column">
        {mode === 'settings' ? (
          <div className="v2-stack-profile v2-glass-card">
            <span aria-hidden="true" className="v2-stack-profile__avatar">{avatarText}</span>
            <div className="v2-stack-profile__copy">
              <p className="v2-kicker">profile hub</p>
              <strong>{user?.name || '当前用户'}</strong>
              <span>{getShellTitle(user, mode)}</span>
              <small>{getShellDescription(user, mode)}</small>
              <div className="v2-stack-profile__actions">
                <Link aria-label="返回主站" className="v2-secondary-link v2-stack-profile__home" to={homePath}>
                  返回主站
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Link
            aria-label="个人设置"
            className="v2-stack-profile v2-glass-card"
            to={profilePath}
          >
            <span aria-hidden="true" className="v2-stack-profile__avatar">{avatarText}</span>
            <div className="v2-stack-profile__copy v2-stack-profile__copy--app">
              <p className="v2-kicker">graduate platform</p>
              <strong>{user?.name || '当前用户'}</strong>
              <span>{getShellTitle(user, mode)}</span>
              <small>{getShellDescription(user, mode)}</small>
            </div>
          </Link>
        )}

        <div className="v2-stack-nav-wrap">
          {groups.map((group) => (
            <section className="v2-stack-menu v2-glass-card" key={group.title}>
              <p className="v2-stack-menu__title">{group.title}</p>
              <nav aria-label={group.title}>
                {group.items.map((item) => (
                  <NavLink
                    className={({ isActive }) => `v2-stack-menu__link ${isActive ? 'is-active' : ''}`}
                    key={item.to}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </section>
          ))}
        </div>
      </div>

      <div className="v2-stack-sidebar__footer">
        <button
          aria-expanded={settingsOpen}
          aria-label="打开偏好与账户设置"
          className="v2-stack-settings-trigger"
          onClick={() => setSettingsOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" className="v2-stack-settings-trigger__icon">⚙</span>
          <span>设置</span>
        </button>

        {settingsOpen ? (
          <section
            aria-label="偏好与账户设置"
            className="v2-stack-settings-popover v2-glass-card"
          >
            <div className="v2-stack-settings-head">
              <div>
                <p className="v2-kicker">workspace settings</p>
                <h2>偏好与账户设置</h2>
              </div>
              <button className="v2-role-auth-close" onClick={() => setSettingsOpen(false)} type="button">
                关闭
              </button>
            </div>

            <div className="v2-stack-settings-body">
              <section className="v2-stack-settings-card">
                <p className="v2-stack-menu__title">语言</p>
                <div className="v2-language-switch" role="group" aria-label="语言切换">
                  {languageOptions.map((item) => (
                    <button
                      className={`v2-language-switch__btn ${languageMode === item.value ? 'is-active' : ''}`}
                      key={item.value}
                      onClick={() => handleLanguageChange(item.value)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="v2-stack-settings-card">
                <p className="v2-stack-menu__title">主题</p>
                <ThemeSwitch />
              </section>

              <section className="v2-stack-settings-card">
                <p className="v2-stack-menu__title">账户</p>
                <div className="v2-stack-settings-account">
                  <div className="v2-stack-settings-account__meta">
                    <strong>{user?.name || '游客状态'}</strong>
                    <span>{user ? getShellTitle(user, mode) : '先登录后进入对应主站'}</span>
                  </div>
                  <button className="v2-primary-link v2-stack-settings-action" onClick={handleLogout} type="button">
                    {user ? '退出登录' : '登录 / 注册'}
                  </button>
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  )
}
