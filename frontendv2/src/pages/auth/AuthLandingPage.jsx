import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import AuthHeroShell from '@/components/AuthHeroShell.jsx'
import ForgotPasswordForm from '@/components/AuthForms/ForgotPasswordForm.jsx'
import LoginForm from '@/components/AuthForms/LoginForm.jsx'
import RegisterForm from '@/components/AuthForms/RegisterForm.jsx'

const introTabs = [
  { key: 'overview', label: '平台介绍', copy: '登录后进入社区，再根据方向与角色继续深入。' },
  { key: 'directions', label: '方向模块', copy: '考研、考公、就业、留学都按真实后端功能拆分。' },
  { key: 'admin', label: '管理能力', copy: '管理员走单独治理主站，默认从社区治理开始。' },
]

export default function AuthLandingPage() {
  const { isAuthed, user, loading } = useAuth()
  const [mode, setMode] = useState('login')
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) return null
  if (isAuthed && user) return <Navigate replace to="/app" />

  const currentIntro = introTabs.find((item) => item.key === activeTab) || introTabs[0]

  return (
    <AuthHeroShell>
      <section className="v2-auth-panel v2-glass-card">
        <div className="v2-auth-panel__head">
          <p className="v2-kicker">identity gateway</p>
          <h2>选择认证方式</h2>
          <p>{currentIntro.copy}</p>
        </div>

        <div aria-label="认证方式切换" className="v2-auth-tabs" role="tablist">
          <button
            aria-selected={mode === 'login'}
            className={`v2-auth-tab ${mode === 'login' ? 'is-active' : ''}`}
            onClick={() => setMode('login')}
            role="tab"
            type="button"
          >
            登录
          </button>
          <button
            aria-selected={mode === 'register'}
            className={`v2-auth-tab ${mode === 'register' ? 'is-active' : ''}`}
            onClick={() => setMode('register')}
            role="tab"
            type="button"
          >
            注册
          </button>
        </div>

        <div className="v2-auth-intro-tabs" role="tablist" aria-label="站点信息标签">
          {introTabs.map((item) => (
            <button
              aria-selected={activeTab === item.key}
              className={`v2-auth-intro-tab ${activeTab === item.key ? 'is-active' : ''}`}
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="v2-auth-panel__body">
          {mode === 'login' ? (
            <LoginForm
              onSwitchRegister={() => setMode('register')}
              onSwitchReset={() => setMode('reset')}
            />
          ) : null}
          {mode === 'register' ? (
            <RegisterForm onSwitchLogin={() => setMode('login')} />
          ) : null}
          {mode === 'reset' ? (
            <ForgotPasswordForm onSwitchLogin={() => setMode('login')} />
          ) : null}
        </div>
      </section>
    </AuthHeroShell>
  )
}
