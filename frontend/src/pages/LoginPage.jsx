import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../App.css'

const credentialTypeOptions = [
  { value: 'username', label: '用户名登录' },
  { value: 'email', label: '邮箱登录' },
  { value: 'phone', label: '手机号登录' },
  { value: 'studentId', label: '学号登录' },
]

function validateCredential(type, value) {
  const trimmed = value.trim()
  if (!trimmed) return '请输入账号'

  if (type === 'username' && !/^[A-Za-z][A-Za-z0-9_]{3,19}$/.test(trimmed)) {
    return '用户名需以字母开头，4-20 位（字母/数字/下划线）'
  }
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return '邮箱格式不正确'
  }
  if (type === 'phone' && !/^1[3-9]\d{9}$/.test(trimmed)) {
    return '手机号格式不正确'
  }
  if (type === 'studentId' && !/^[A-Za-z0-9_-]{6,20}$/.test(trimmed)) {
    return '学号格式不正确'
  }
  return ''
}

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    credentialType: 'username',
    credential: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const credentialError = validateCredential(form.credentialType, form.credential)
    if (credentialError) {
      setError(credentialError)
      return
    }
    if (!form.password.trim()) {
      setError('请输入密码')
      return
    }

    setSubmitting(true)
    try {
      const credential = form.credential.trim()
      await login({
        loginType: form.credentialType,
        credential,
        password: form.password,
        username: form.credentialType === 'username' ? credential : undefined,
        email: form.credentialType === 'email' ? credential : undefined,
        phone: form.credentialType === 'phone' ? credential : undefined,
        studentId: form.credentialType === 'studentId' ? credential : undefined,
      })
      navigate('/profile')
    } catch (err) {
      setError(err.message || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const placeholderMap = {
    username: '请输入用户名',
    email: '请输入邮箱账号',
    phone: '请输入手机号',
    studentId: '请输入学号',
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section auth-wrap">
          <div className="section-head">
            <p className="eyebrow">登录</p>
            <h2>统一认证入口</h2>
            <p className="muted">支持用户名/手机号/邮箱/学号登录，连续输错密码会触发临时锁定。</p>
          </div>

          <form className="auth-card" onSubmit={handleSubmit} autoComplete="off">
            <input type="text" name="fake_username" autoComplete="username" tabIndex={-1} style={{ display: 'none' }} />
            <input type="password" name="fake_password" autoComplete="new-password" tabIndex={-1} style={{ display: 'none' }} />

            <label className="field">
              <span>登录方式</span>
              <select
                value={form.credentialType}
                onChange={(event) => setForm({ ...form, credentialType: event.target.value, credential: '' })}
              >
                {credentialTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>账号</span>
              <input
                name="gp_login_credential"
                value={form.credential}
                onChange={(event) => setForm({ ...form, credential: event.target.value })}
                type="text"
                autoComplete="off"
                placeholder={placeholderMap[form.credentialType]}
                required
              />
            </label>

            <label className="field">
              <span>密码</span>
              <input
                name="gp_login_password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                type="password"
                autoComplete="new-password"
                placeholder="请输入密码"
                required
              />
            </label>

            {error ? <div className="error-text">{error}</div> : null}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? '登录中...' : '登录'}
            </button>

            <div className="muted auth-tip" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <Link to="/forgot-password">忘记密码？</Link>
              <span>还没有账号？<Link to="/register">去注册</Link></span>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default LoginPage