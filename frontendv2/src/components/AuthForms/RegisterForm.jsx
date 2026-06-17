import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { authApi } from '@legacy/lib/api.js'

const accountTypeOptions = [
  { value: 'phone', label: '手机号' },
  { value: 'email', label: '邮箱' },
  { value: 'studentId', label: '学号' },
]

function validateAccount(type, value) {
  const trimmed = value.trim()
  if (!trimmed) return '请输入账号'
  if (type === 'phone' && !/^1[3-9]\d{9}$/.test(trimmed)) return '手机号格式不正确'
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '邮箱格式不正确'
  if (type === 'studentId' && !/^[A-Za-z0-9_-]{6,20}$/.test(trimmed)) return '学号格式不正确'
  return ''
}

function validatePassword(password) {
  if (password.length < 8 || password.length > 20) return '密码长度需要 8-20 位'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return '密码需要同时包含字母和数字'
  return ''
}

export default function RegisterForm({ onSwitchLogin }) {
  const navigate = useNavigate()
  const { register } = useAuth()
  const timerRef = useRef(null)
  const [countdown, setCountdown] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
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

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
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
    } catch (requestError) {
      setError(requestError.message || '发送验证码失败')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const accountError = validateAccount(form.accountType, form.account)
    if (accountError) return setError(accountError)
    if (!form.username.trim()) return setError('请输入用户名')
    if (!form.name.trim()) return setError('请输入昵称')
    if (!form.school.trim() || !form.major.trim() || !form.grade.trim()) return setError('请补全学校、专业和年级')
    if (!form.verifyCode.trim()) return setError('请输入验证码')

    const passwordError = validatePassword(form.password)
    if (passwordError) return setError(passwordError)
    if (form.password !== form.confirmPassword) return setError('两次输入的密码不一致')
    if (!form.agreementAccepted) return setError('请先勾选用户协议')

    setSubmitting(true)
    try {
      const account = form.account.trim()
      const bridgeEmail = form.accountType === 'email'
        ? account
        : (form.contactEmail.trim() || `${form.accountType}-${account}@graduate.local`)

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
      navigate('/app', { replace: true })
    } catch (requestError) {
      setError(requestError.message || '注册失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="v2-auth-form v2-auth-form--dense v2-auth-form--register" onSubmit={handleSubmit}>
      <div className="v2-auth-grid">
        <label className="v2-auth-field">
          <span>注册方式</span>
          <select value={form.accountType} onChange={(event) => setForm({ ...form, accountType: event.target.value, account: '' })}>
            {accountTypeOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>

        <label className="v2-auth-field">
          <span>账号</span>
          <input type="text" value={form.account} onChange={(event) => setForm({ ...form, account: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>用户名</span>
          <input type="text" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>验证码</span>
          <div className="v2-auth-inline">
            <input type="text" value={form.verifyCode} onChange={(event) => setForm({ ...form, verifyCode: event.target.value })} />
            <button className="v2-secondary-link" disabled={countdown > 0} onClick={handleSendCode} type="button">
              {countdown > 0 ? `${countdown}s` : '发送'}
            </button>
          </div>
        </label>

        <label className="v2-auth-field">
          <span>密码</span>
          <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>确认密码</span>
          <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>昵称</span>
          <input type="text" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>目标方向</span>
          <select value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })}>
            <option value="kaoyan">考研</option>
            <option value="kaogong">考公</option>
            <option value="job">就业</option>
            <option value="liuxue">留学</option>
          </select>
        </label>

        <label className="v2-auth-field">
          <span>学校</span>
          <input type="text" value={form.school} onChange={(event) => setForm({ ...form, school: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>专业</span>
          <input type="text" value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>年级</span>
          <input type="text" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} />
        </label>

        <label className="v2-auth-field">
          <span>意向地区</span>
          <input type="text" value={form.intentRegion} onChange={(event) => setForm({ ...form, intentRegion: event.target.value })} />
        </label>
      </div>

      <label className="v2-auth-checkbox">
        <input
          checked={form.agreementAccepted}
          type="checkbox"
          onChange={(event) => setForm({ ...form, agreementAccepted: event.target.checked })}
        />
        <span>我已阅读并同意用户协议与隐私政策</span>
      </label>

      {error ? <div className="v2-auth-message v2-auth-message--error">{error}</div> : null}

      <button className="v2-primary-link" disabled={submitting} type="submit">
        {submitting ? '注册中…' : '注册并进入平台'}
      </button>

      <div className="v2-auth-actions-row">
        <button className="v2-auth-textlink" onClick={onSwitchLogin} type="button">已有账号，去登录</button>
      </div>
    </form>
  )
}
