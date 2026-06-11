import { useEffect, useRef, useState } from 'react'
import { authApi } from '@legacy/lib/api.js'

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

export default function ForgotPasswordForm({ onSwitchLogin }) {
  const timerRef = useRef(null)
  const [countdown, setCountdown] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    accountType: 'email',
    account: '',
    verifyCode: '',
    newPassword: '',
    confirmPassword: '',
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
    setMessage('')

    const accountError = validateAccount(form.accountType, form.account)
    if (accountError) return setError(accountError)
    if (form.newPassword.length < 8) return setError('新密码至少 8 位')
    if (form.newPassword !== form.confirmPassword) return setError('两次输入的密码不一致')

    setSubmitting(true)
    try {
      await authApi.resetPassword({
        accountType: form.accountType,
        account: form.account.trim(),
        verifyCode: form.verifyCode.trim(),
        newPassword: form.newPassword,
      })
      setMessage('密码已重置，现在可以返回登录。')
    } catch (requestError) {
      setError(requestError.message || '重置密码失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="v2-auth-form" onSubmit={handleSubmit}>
      <label className="v2-auth-field">
        <span>找回方式</span>
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
        <span>验证码</span>
        <div className="v2-auth-inline">
          <input type="text" value={form.verifyCode} onChange={(event) => setForm({ ...form, verifyCode: event.target.value })} />
          <button className="v2-secondary-link" disabled={countdown > 0} onClick={handleSendCode} type="button">
            {countdown > 0 ? `${countdown}s` : '发送'}
          </button>
        </div>
      </label>

      <label className="v2-auth-field">
        <span>新密码</span>
        <input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
      </label>

      <label className="v2-auth-field">
        <span>确认新密码</span>
        <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
      </label>

      {error ? <div className="v2-auth-message v2-auth-message--error">{error}</div> : null}
      {message ? <div className="v2-auth-message v2-auth-message--success">{message}</div> : null}

      <button className="v2-primary-link" disabled={submitting} type="submit">
        {submitting ? '提交中…' : '重置密码'}
      </button>

      <div className="v2-auth-actions-row">
        <button className="v2-auth-textlink" onClick={onSwitchLogin} type="button">返回登录</button>
      </div>
    </form>
  )
}
