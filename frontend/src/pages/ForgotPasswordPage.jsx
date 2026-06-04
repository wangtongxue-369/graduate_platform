import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { authApi } from '../lib/api.js'
import '../App.css'

const accountTypeOptions = [
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '手机号' },
  { value: 'studentId', label: '学号' },
]

function validateAccount(type, value) {
  const trimmed = value.trim()
  if (!trimmed) return '请输入账号'
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '邮箱格式不正确'
  if (type === 'phone' && !/^1[3-9]\d{9}$/.test(trimmed)) return '手机号格式不正确'
  if (type === 'studentId' && !/^[A-Za-z0-9_-]{6,20}$/.test(trimmed)) return '学号格式不正确'
  return ''
}

function validatePassword(password) {
  if (password.length < 8 || password.length > 20) return '密码长度需为 8-20 位'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '密码需同时包含字母和数字'
  return ''
}

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    accountType: 'email',
    account: '',
    verifyCode: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [countdown, setCountdown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function handleSendCode() {
    const accountError = validateAccount(form.accountType, form.account)
    if (accountError) {
      setError(accountError)
      return
    }
    setError('')
    try {
      await authApi.sendCode(form.account.trim(), form.accountType)
      let sec = 60
      setCountdown(sec)
      timerRef.current = setInterval(() => {
        sec -= 1
        setCountdown(sec)
        if (sec <= 0) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }, 1000)
    } catch (e) {
      setError(e.message || '发送验证码失败')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    const accountError = validateAccount(form.accountType, form.account)
    if (accountError) {
      setError(accountError)
      return
    }
    const passwordError = validatePassword(form.newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    try {
      await authApi.resetPassword({
        accountType: form.accountType,
        account: form.account.trim(),
        verifyCode: form.verifyCode.trim(),
        newPassword: form.newPassword,
      })
      setSuccessMessage('密码已重置，请使用新密码登录')
      setTimeout(() => navigate('/login'), 1200)
    } catch (e) {
      setError(e.message || '重置密码失败')
    } finally {
      setSubmitting(false)
    }
  }

  const placeholderMap = {
    email: '请输入邮箱',
    phone: '请输入手机号',
    studentId: '请输入学号',
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section auth-wrap">
          <div className="section-head">
            <p className="eyebrow">找回密码</p>
            <h2>重置账户密码</h2>
            <p className="muted">通过验证码验证身份后设置新密码。</p>
          </div>

          <form className="auth-card" onSubmit={handleSubmit} autoComplete="off">
            <input type="text" name="fake_username" autoComplete="username" tabIndex={-1} style={{ display: 'none' }} />
            <input type="password" name="fake_password" autoComplete="new-password" tabIndex={-1} style={{ display: 'none' }} />
            <label className="field">
              <span>账号类型</span>
              <select
                value={form.accountType}
                onChange={(event) => setForm({ ...form, accountType: event.target.value, account: '' })}
              >
                {accountTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>账号</span>
              <input
                value={form.account}
                onChange={(event) => setForm({ ...form, account: event.target.value })}
                type="text"
                autoComplete="off"
                placeholder={placeholderMap[form.accountType]}
                required
              />
            </label>

            <label className="field">
              <span>验证码</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={form.verifyCode}
                  onChange={(event) => setForm({ ...form, verifyCode: event.target.value })}
                  type="text"
                  autoComplete="one-time-code"
                  placeholder="请输入验证码"
                  style={{ flex: 1 }}
                  required
                />
                <button
                  className="btn outline small"
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  style={{ whiteSpace: 'nowrap', minWidth: 100 }}
                >
                  {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
                </button>
              </div>
            </label>

            <label className="field">
              <span>新密码</span>
              <input
                value={form.newPassword}
                onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
                type="password"
                autoComplete="new-password"
                placeholder="8-20 位，字母+数字"
                required
              />
            </label>

            <label className="field">
              <span>确认新密码</span>
              <input
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                type="password"
                autoComplete="new-password"
                placeholder="请再次输入新密码"
                required
              />
            </label>

            {error ? <div className="error-text">{error}</div> : null}
            {successMessage ? <div className="success-text">{successMessage}</div> : null}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? '提交中...' : '重置密码'}
            </button>

            <div className="muted auth-tip">
              想起密码了？<Link to="/login">返回登录</Link>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default ForgotPasswordPage
