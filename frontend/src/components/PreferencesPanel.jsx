import { useEffect, useRef, useState } from 'react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { formatFontScalePercent } from '../lib/preferences.js'

const themeOptions = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

const languageOptions = [
  { value: 'zh-CN', label: '简体中文', note: '默认中文界面' },
  { value: 'bilingual', label: '双语提示', note: '逐步覆盖关键导航和说明' },
  { value: 'en', label: 'English', note: '国际化框架预留，当前内容仍以中文为主' },
]

export default function PreferencesPanel() {
  const { preferences, setTheme, setFontScale, setLanguageMode, resetPreferences } = usePreferences()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    function handlePointerDown(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="preferences-fab"
        aria-label="Open display preferences"
        onClick={() => setOpen((value) => !value)}
      >
        偏好
      </button>

      {open ? (
        <div className="preferences-backdrop">
          <section
            ref={panelRef}
            className="preferences-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preferences-panel-title"
          >
            <div className="preferences-panel-head">
              <div>
                <p className="eyebrow">Display</p>
                <h3 id="preferences-panel-title">显示偏好</h3>
                <p className="muted">这些设置会应用到整个站点，并自动保存。</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close display preferences"
                onClick={() => setOpen(false)}
              >
                x
              </button>
            </div>

            <div className="preferences-group">
              <span className="preferences-group-title">主题</span>
              <div className="preferences-chip-row">
                {themeOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`preferences-chip ${preferences.theme === item.value ? 'is-active' : ''}`}
                    aria-label={`Theme ${item.value}`}
                    aria-pressed={preferences.theme === item.value}
                    onClick={() => setTheme(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="preferences-group">
              <div className="preferences-group-row">
                <span className="preferences-group-title">字体大小</span>
                <strong>{formatFontScalePercent(preferences.fontScale)}</strong>
              </div>
              <label className="preferences-range-field">
                <span className="sr-only">Font scale</span>
                <input
                  type="range"
                  min="0.875"
                  max="1.25"
                  step="0.025"
                  value={preferences.fontScale}
                  aria-label="Font scale"
                  onChange={(event) => setFontScale(Number(event.target.value))}
                />
              </label>
              <div className="preferences-range-scale">
                <span>最小</span>
                <span>默认</span>
                <span>最大</span>
              </div>
            </div>

            <div className="preferences-group">
              <span className="preferences-group-title">语言模式</span>
              <div className="preferences-stack">
                {languageOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`preferences-card ${preferences.languageMode === item.value ? 'is-active' : ''}`}
                    aria-label={`Language ${item.value}`}
                    aria-pressed={preferences.languageMode === item.value}
                    onClick={() => setLanguageMode(item.value)}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="preferences-actions">
              <button
                type="button"
                className="btn ghost"
                aria-label="Reset display preferences"
                onClick={resetPreferences}
              >
                恢复默认
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
