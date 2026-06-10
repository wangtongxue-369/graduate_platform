import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'

const roles = [
  { key: null, label: '游客', path: '/' },
  { key: 'job', label: '就业', path: '/app' },
  { key: 'kaoyan', label: '考研', path: '/app' },
  { key: 'kaogong', label: '考公', path: '/app' },
  { key: 'liuxue', label: '留学', path: '/app' },
  { key: 'admin', label: '管理员', path: '/app' },
]

export default function PreviewDock() {
  const navigate = useNavigate()
  const { token, isAuthed, user, switchDevUser } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const isRealUser = Boolean(isAuthed && token && token !== 'dev-token')

  if (!import.meta.env.DEV) return null

  function handleSwitch(nextKey, path) {
    switchDevUser(nextKey)
    navigate(path)
  }

  const currentLabel = isRealUser
    ? (user?.name || '已登录账号')
    : (isAuthed ? `模拟：${user?.name}` : '当前：游客')

  return (
    <aside className={`v1-preview-dock ${expanded ? 'is-open' : ''}`} aria-label="开发模式角色预览">
      <button
        className="v1-preview-trigger"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? '收起角色预览' : '打开角色预览'}
      </button>

      {expanded ? (
        <div className="v1-preview-panel">
          <div className="v1-preview-head">
            <strong>角色预览</strong>
            <span>{currentLabel}</span>
          </div>
          <div className="v1-preview-actions">
            {roles.map((item) => (
              <button
                key={item.label}
                className={`v1-preview-pill ${user?.target === item.key || (item.key === 'admin' && user?.role === 'admin') || (!item.key && !isAuthed) ? 'is-active' : ''}`}
                disabled={isRealUser}
                type="button"
                onClick={() => handleSwitch(item.key, item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {isRealUser
            ? <p>真实账号登录时不覆盖身份。</p>
            : <p>开发模式下可直接切换游客、学生方向和管理员视角。</p>}
        </div>
      ) : null}
    </aside>
  )
}
