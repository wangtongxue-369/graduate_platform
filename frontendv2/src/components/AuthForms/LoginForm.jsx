import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@legacy/context/AuthContext.jsx'

const credentialTypeOptions = [
  { value: 'username', label: '用户名' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '手机号' },
  { value: 'studentId', label: '学号' },
]

function validateCredential(type, value) {
  const trimmed = value.trim()
  if (!trimmed) return '请输入账号'
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '邮箱格式不正确'
  if (type === 'phone' && !/^1[3-9]\d{9}$/.test(trimmed)) return '手机号格式不正确'
  if (type === 'studentId' && !/^[A-Za-z0-9_-]{6,20}$/.test(trimmed)) return '学号格式不正确'
  return ''
}

export default function LoginForm({ onSwitchRegister, onSwitchReset }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    credentialType: 'username',
    credential: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
      navigate('/app', { replace: true })
    } catch (requestError) {
      setError(requestError.message || '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="v2-auth-form" onSubmit={handleSubmit}>
      <label className="v2-auth-field">
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

      <label className="v2-auth-field">
        <span>账号</span>
        <input
          autoComplete="off"
          placeholder="请输入账号"
          type="text"
          value={form.credential}
          onChange={(event) => setForm({ ...form, credential: event.target.value })}
        />
      </label>

      <label className="v2-auth-field">
        <span>密码</span>
        <input
          autoComplete="current-password"
          placeholder="请输入密码"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
      </label>

      {error ? <div className="v2-auth-message v2-auth-message--error">{error}</div> : null}

      <button className="v2-primary-link" disabled={submitting} type="submit">
        {submitting ? '登录中…' : '登录'}
      </button>

      <div className="v2-auth-actions-row">
        <button className="v2-auth-textlink" onClick={onSwitchReset} type="button">忘记密码</button>
        <button className="v2-auth-textlink" onClick={onSwitchRegister} type="button">去注册</button>
      </div>
    </form>
  )
}
