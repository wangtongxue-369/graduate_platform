import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authApi } from '../lib/api.js'
import '../App.css'

const accountTypeOptions = [
  { value: 'phone', label: '手机号注册' },
  { value: 'email', label: '邮箱注册' },
  { value: 'studentId', label: '学号注册' },
]

function validateAccount(type, value) {
  const trimmed = value.trim()
  if (!trimmed) return '请输入账号'
  if (type === 'phone' && !/^1[3-9]\d{9}$/.test(trimmed)) return '手机号格式不正确'
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '邮箱格式不正确'
  if (type === 'studentId' && !/^[A-Za-z0-9_-]{6,20}$/.test(trimmed)) return '学号格式不正确'
  return ''
}

function validateUsername(username) {
  const trimmed = username.trim()
  if (!trimmed) return '请输入用户名'
  if (!/^[A-Za-z][A-Za-z0-9_]{3,19}$/.test(trimmed)) {
    return '用户名需以字母开头，4-20 位（字母/数字/下划线）'
  }
  return ''
}

function validatePassword(password) {
  if (password.length < 8 || password.length > 20) return '密码长度需为 8-20 位'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '密码需同时包含字母和数字'
  return ''
}

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    accountType: 'phone',
    account: '',
    verifyCode: '',
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    school: '',
    major: '',
    grade: '',
    target: 'kaoyan',
    intentRegion: '',
    contactEmail: '',
    agreementAccepted: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
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

    const accountError = validateAccount(form.accountType, form.account)
    if (accountError) return setError(accountError)

    const usernameError = validateUsername(form.username)
    if (usernameError) return setError(usernameError)

    const passwordError = validatePassword(form.password)
    if (passwordError) return setError(passwordError)

    if (form.password !== form.confirmPassword) return setError('两次输入的密码不一致')
    if (!form.agreementAccepted) return setError('请先勾选用户协议与隐私政策')
    if (!form.name.trim() || !form.school.trim() || !form.major.trim() || !form.grade.trim()) {
      return setError('请补全昵称、学校、专业和年级')
    }

    setSubmitting(true)
    try {
      const account = form.account.trim()
      const bridgeEmail =
        form.accountType === 'email'
          ? account
          : form.contactEmail.trim() || `${form.accountType}-${account}@graduate.local`

      await register({
        username: form.username.trim(),
        name: form.name.trim(),
        email: bridgeEmail,
        phone: form.accountType === 'phone' ? account : '',
        studentId: form.accountType === 'studentId' ? account : '',
        verifyCode: form.verifyCode.trim(),
        password: form.password,
        target: form.target,
        school: form.school.trim(),
        major: form.major.trim(),
        grade: form.grade.trim(),
        intentRegion: form.intentRegion.trim(),
        accountType: form.accountType,
        agreementAccepted: form.agreementAccepted,
      })
      navigate('/profile')
    } catch (err) {
      setError(err.message || '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  const accountPlaceholder = {
    phone: '请输入手机号',
    email: '请输入邮箱',
    studentId: '请输入学号',
  }

  return (
    <div className="app">
      <Navbar />
      <main className="shell">
        <section className="section auth-wrap">
          <div className="section-head">
            <p className="eyebrow">注册</p>
            <h2>创建你的账户</h2>
            <p className="muted">注册后可使用社区互动、题库练习、学习计划和订阅提醒等功能。</p>
          </div>

          <form className="auth-card wide" onSubmit={handleSubmit} autoComplete="off">
            <input type="text" name="fake_username" autoComplete="username" tabIndex={-1} style={{ display: 'none' }} />
            <input type="password" name="fake_password" autoComplete="new-password" tabIndex={-1} style={{ display: 'none' }} />

            <div className="form-grid">
              <label className="field">
                <span>注册方式</span>
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
                  name="gp_register_account"
                  value={form.account}
                  onChange={(event) => setForm({ ...form, account: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder={accountPlaceholder[form.accountType]}
                  required
                />
              </label>

              <label className="field">
                <span>用户名</span>
                <input
                  name="gp_register_username"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder="以字母开头，4-20 位"
                  required
                />
              </label>

              <label className="field">
                <span>验证码</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    name="gp_register_verify_code"
                    value={form.verifyCode}
                    onChange={(event) => setForm({ ...form, verifyCode: event.target.value })}
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="请输入验证码"
                    style={{ flex: 1 }}
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
                <span>联系邮箱（可选）</span>
                <input
                  value={form.contactEmail}
                  onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
                  type="email"
                  autoComplete="off"
                  placeholder="用于安全通知"
                />
              </label>

              <label className="field">
                <span>密码</span>
                <input
                  name="gp_register_password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  type="password"
                  autoComplete="new-password"
                  placeholder="8-20 位，字母+数字"
                  required
                />
              </label>

              <label className="field">
                <span>确认密码</span>
                <input
                  name="gp_register_confirm_password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  type="password"
                  autoComplete="new-password"
                  placeholder="请再次输入密码"
                  required
                />
              </label>

              <label className="field">
                <span>昵称</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder="请输入昵称"
                  required
                />
              </label>

              <label className="field">
                <span>目标方向</span>
                <select value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })}>
                  <option value="kaoyan">考研</option>
                  <option value="kaogong">考公考编</option>
                  <option value="job">就业</option>
                  <option value="liuxue">留学</option>
                </select>
              </label>

              <label className="field">
                <span>学校</span>
                <input
                  value={form.school}
                  onChange={(event) => setForm({ ...form, school: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder="请输入学校"
                  required
                />
              </label>

              <label className="field">
                <span>专业</span>
                <input
                  value={form.major}
                  onChange={(event) => setForm({ ...form, major: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder="请输入专业"
                  required
                />
              </label>

              <label className="field">
                <span>年级</span>
                <input
                  value={form.grade}
                  onChange={(event) => setForm({ ...form, grade: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder="如：2023 级"
                  required
                />
              </label>

              <label className="field">
                <span>意向地区</span>
                <input
                  value={form.intentRegion}
                  onChange={(event) => setForm({ ...form, intentRegion: event.target.value })}
                  type="text"
                  autoComplete="off"
                  placeholder="如：上海 / 北京"
                />
              </label>
            </div>

            <label className="switch-item agreement">
              <input
                type="checkbox"
                checked={form.agreementAccepted}
                onChange={(event) => setForm({ ...form, agreementAccepted: event.target.checked })}
              />
              <span>我已阅读并同意《用户协议》和《隐私政策》</span>
            </label>

            {error ? <div className="error-text">{error}</div> : null}

            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? '注册中...' : '注册并登录'}
            </button>

            <div className="muted auth-tip">
              已有账号？<Link to="/login">去登录</Link>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default RegisterPage