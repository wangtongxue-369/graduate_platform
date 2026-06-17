import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import AppBootScreen from '@/components/AppBootScreen.jsx'
import AuthHeroShell from '@/components/AuthHeroShell.jsx'
import ForgotPasswordForm from '@/components/AuthForms/ForgotPasswordForm.jsx'
import LoginForm from '@/components/AuthForms/LoginForm.jsx'
import RegisterForm from '@/components/AuthForms/RegisterForm.jsx'

const authPanelCopy = {
  login: '使用账号、邮箱、手机号或学号登录，进入社区与对应方向模块继续使用。',
  register: '注册后即可补全个人方向、学校与目标信息，系统会按你的身份进入对应功能区。',
  reset: '通过验证码重设密码后，可继续使用原账号返回平台。',
}

export default function AuthLandingPage() {
  const { isAuthed, user, loading } = useAuth()
  const [mode, setMode] = useState('login')

  if (loading) {
    return (
      <AppBootScreen
        title="正在准备登录入口"
        message="正在确认你的登录状态，请稍候..."
      />
    )
  }

  if (isAuthed && user) return <Navigate replace to="/app" />

  return (
    <AuthHeroShell>
      <section className="v2-auth-panel v2-glass-card">
        <div className="v2-auth-panel__head">
          <p className="v2-kicker">账户入口</p>
          <h2>登录与注册</h2>
          <p>{authPanelCopy[mode] || authPanelCopy.login}</p>
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
