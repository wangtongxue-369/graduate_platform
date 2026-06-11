import { useMemo, useState } from 'react'
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

  const groups = useMemo(() => (
    mode === 'settings' ? getSettingsNavigation() : getAppNavigation(user)
  ), [mode, user])

  const profilePath = '/settings/profile'
  const homePath = getRoleLandingPath(user)
  const avatarText = getAvatarText(user?.name)

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  function handleLanguageChange(nextValue) {
    setLanguageMode(nextValue)
    persistLanguageMode(nextValue)
  }

  return (
    <aside className="v2-stack-sidebar">
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
            <div className="v2-stack-profile__copy">
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

        <section className="v2-stack-menu v2-glass-card">
          <p className="v2-stack-menu__title">偏好控件</p>
          <div className="v2-stack-preferences">
            <div className="v2-stack-preferences__block">
              <span>语言</span>
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
            </div>

            <div className="v2-stack-preferences__block">
              <span>主题</span>
              <ThemeSwitch />
            </div>
          </div>
        </section>
      </div>

      <div className="v2-stack-sidebar__footer">
        <button className="v2-stack-logout" onClick={handleLogout} type="button">
          退出登录
        </button>
      </div>
    </aside>
  )
}
