import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsDashboard, createSettingsProfile } from '@/lib/settingsPreview.js'
import { previewDataNotice } from '@/lib/stationData.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

const targetOptions = [
  { value: 'kaoyan', label: '考研' },
  { value: 'kaogong', label: '考公考编' },
  { value: 'job', label: '就业' },
  { value: 'liuxue', label: '留学' },
]

const targetLabelMap = Object.fromEntries(
  targetOptions.map((item) => [item.value, item.label]),
)

const roleLabelMap = {
  admin: '管理员',
  user: '注册用户',
  visitor: '游客',
}

const statusLabelMap = {
  inactive: '未激活',
  normal: '正常',
  muted: '禁言',
  upload_limited: '限制上传',
  temporary_locked: '临时锁定',
  banned: '封禁',
  deleting: '注销处理中',
  deleted: '已注销',
}

function createEditableProfileForm(profile = {}) {
  return {
    name: profile.name || '',
    school: profile.school || '',
    major: profile.major || '',
    grade: profile.grade || '',
    target: profile.target || 'kaoyan',
    intentRegion: profile.intentRegion || '',
  }
}

function buildProfilePayload(form) {
  return {
    name: form.name.trim(),
    school: form.school.trim(),
    major: form.major.trim(),
    grade: form.grade.trim(),
    target: form.target,
    intentRegion: form.intentRegion.trim(),
  }
}

function getTargetLabel(target) {
  return targetLabelMap[target] || target || '未设置'
}

export default function SettingsProfilePage() {
  const { user, token } = useAuth()
  const initialProfile = createSettingsProfile(user)
  const [profile, setProfile] = useState(initialProfile)
  const [dashboard, setDashboard] = useState(createSettingsDashboard())
  const [form, setForm] = useState(() => createEditableProfileForm(initialProfile))
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackTone, setFeedbackTone] = useState('note')

  useEffect(() => {
    let active = true

    async function load() {
      const previewProfile = createSettingsProfile(user)

      if (!token || token === 'dev-token') {
        if (!active) return
        setProfile(previewProfile)
        setForm(createEditableProfileForm(previewProfile))
        setDashboard(createSettingsDashboard())
        setFeedbackTone('note')
        setFeedback(previewDataNotice('个人设置'))
        return
      }

      try {
        const [profileData, dashboardData] = await withRequestTimeout(
          Promise.all([userApi.profile(token), userApi.dashboard(token)]),
          8000,
          '个人信息读取超时，请检查后端服务。',
        )
        if (!active) return

        const nextProfile = createSettingsProfile(profileData)
        setProfile(nextProfile)
        setForm(createEditableProfileForm(nextProfile))
        setDashboard(dashboardData || createSettingsDashboard())
        setFeedback('')
      } catch (error) {
        if (!active) return
        setProfile(previewProfile)
        setForm(createEditableProfileForm(previewProfile))
        setDashboard(createSettingsDashboard())
        setFeedbackTone('error')
        setFeedback(error.message || '个人信息暂时不可用，已切换到预览数据。')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [token, user])

  const security = profile.security || {}
  const roleLabel = roleLabelMap[String(profile.role || '').toLowerCase()] || profile.role || '未设置'
  const statusLabel = statusLabelMap[String(profile.status || '').toLowerCase()] || profile.status || '未设置'
  const targetLabel = getTargetLabel(profile.target)

  function handleFieldChange(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function startEditing() {
    setEditing(true)
    setForm(createEditableProfileForm(profile))
  }

  function cancelEditing() {
    setEditing(false)
    setForm(createEditableProfileForm(profile))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = buildProfilePayload(form)
    if (!payload.name) {
      setFeedbackTone('error')
      setFeedback('姓名不能为空。')
      return
    }

    setSaving(true)

    if (!token || token === 'dev-token') {
      const nextProfile = createSettingsProfile({ ...profile, ...payload })
      setProfile(nextProfile)
      setForm(createEditableProfileForm(nextProfile))
      setEditing(false)
      setSaving(false)
      setFeedbackTone('note')
      setFeedback('个人设置：本地预览已更新')
      return
    }

    try {
      const updated = await userApi.updateProfile(payload, token)
      const nextProfile = createSettingsProfile({
        ...profile,
        ...updated,
        security: updated?.security || profile.security,
      })
      setProfile(nextProfile)
      setForm(createEditableProfileForm(nextProfile))
      setEditing(false)
      setFeedbackTone('note')
      setFeedback('个人资料已更新。')
    } catch (error) {
      setFeedbackTone('error')
      setFeedback(error.message || '个人资料保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="个人设置"
        pathItems={[{ label: '个人设置' }]}
        title="个人信息"
        lead="先看身份与方向，再进入编辑区修改资料。"
        actions={(
          !editing ? (
            <button className="v2-primary-link" onClick={startEditing} type="button">
              编辑资料
            </button>
          ) : null
        )}
      />

      {feedback ? (
        <div className={feedbackTone === 'error' ? 'v2-status-error' : 'v2-status-note'}>
          {feedback}
        </div>
      ) : null}

      <section className="v2-card-grid v2-card-grid--dense">
        <article className="v2-summary-card">
          <span>当前角色</span>
          <strong>{roleLabel}</strong>
          <p>账户状态：{statusLabel}</p>
        </article>
        <article className="v2-summary-card">
          <span>目标方向</span>
          <strong>{targetLabel}</strong>
          <p>意向地区：{profile.intentRegion || '未设置'}</p>
        </article>
        <article className="v2-summary-card">
          <span>使用概览</span>
          <strong>{dashboard.attemptCount}</strong>
          <p>发帖 {dashboard.postCount} / 评论 {dashboard.commentCount}</p>
        </article>
      </section>

      {editing ? (
        <section className="v2-split-board">
          <form className="v2-article-card v2-settings-form" id="settings-profile-form" onSubmit={handleSubmit}>
            <div className="v2-settings-section-head">
              <p className="v2-kicker">可编辑字段</p>
              <h3>可同步到后端的资料</h3>
              <p>保存后会同步到社区、方向主站和推荐模块。</p>
            </div>

            <div className="v2-card-grid">
              <label className="v2-field">
                <span>姓名</span>
                <input
                  onChange={(event) => handleFieldChange('name', event.target.value)}
                  type="text"
                  value={form.name}
                />
              </label>
              <label className="v2-field">
                <span>学校</span>
                <input
                  onChange={(event) => handleFieldChange('school', event.target.value)}
                  type="text"
                  value={form.school}
                />
              </label>
              <label className="v2-field">
                <span>专业</span>
                <input
                  onChange={(event) => handleFieldChange('major', event.target.value)}
                  type="text"
                  value={form.major}
                />
              </label>
              <label className="v2-field">
                <span>年级</span>
                <input
                  onChange={(event) => handleFieldChange('grade', event.target.value)}
                  type="text"
                  value={form.grade}
                />
              </label>
              <label className="v2-field">
                <span>方向</span>
                <div className="v2-segment-group" role="group" aria-label="方向">
                  {targetOptions.map((item) => (
                    <button
                      className={`v2-segment-button ${form.target === item.value ? 'is-active' : ''}`}
                      key={item.value}
                      type="button"
                      onClick={() => handleFieldChange('target', item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </label>
              <label className="v2-field">
                <span>意向地区</span>
                <input
                  onChange={(event) => handleFieldChange('intentRegion', event.target.value)}
                  type="text"
                  value={form.intentRegion}
                />
              </label>
            </div>

            <div className="v2-form-actions">
              <button className="v2-secondary-link" onClick={cancelEditing} type="button">
                取消
              </button>
              <button className="v2-primary-link" disabled={saving} type="submit">
                {saving ? '保存中...' : '保存资料'}
              </button>
            </div>
          </form>

          <article className="v2-article-card">
            <div className="v2-settings-section-head">
              <p className="v2-kicker">账户识别</p>
              <h3>账户识别信息</h3>
              <p>邮箱、手机和学号暂时保持只读。</p>
            </div>

            <div className="v2-preview-row">
              <strong>邮箱</strong>
              <small>{profile.email || '未填写'}</small>
            </div>
            <div className="v2-preview-row">
              <strong>手机</strong>
              <small>{profile.phone || '未填写'}</small>
            </div>
            <div className="v2-preview-row">
              <strong>学号</strong>
              <small>{profile.studentId || '未填写'}</small>
            </div>
            <div className="v2-preview-row">
              <strong>用户名</strong>
              <small>{profile.username || '未填写'}</small>
            </div>
          </article>
        </section>
      ) : (
        <section className="v2-split-board">
          <article className="v2-article-card">
            <div className="v2-settings-section-head">
              <p className="v2-kicker">资料摘要</p>
              <h3>资料摘要</h3>
              <p>先确认身份和方向，再返回各功能页继续使用。</p>
            </div>

            <div className="v2-preview-row">
              <strong>{profile.name}</strong>
              <small>{profile.school || '未填写学校'} / {profile.major || '未填写专业'}</small>
            </div>
            <div className="v2-preview-row">
              <strong>方向与年级</strong>
              <small>{profile.grade || '未填写年级'} / 方向 {targetLabel}</small>
            </div>
            <div className="v2-preview-row">
              <strong>意向地区</strong>
              <small>{profile.intentRegion || '未设置'}</small>
            </div>
          </article>

          <article className="v2-article-card">
            <div className="v2-settings-section-head">
              <p className="v2-kicker">账户识别</p>
              <h3>账户识别信息</h3>
              <p>这组字段承担登录识别与流程衔接。</p>
            </div>

            <div className="v2-preview-row">
              <strong>邮箱</strong>
              <small>{profile.email || '未填写'}</small>
            </div>
            <div className="v2-preview-row">
              <strong>手机</strong>
              <small>{profile.phone || '未填写'}</small>
            </div>
            <div className="v2-preview-row">
              <strong>学号</strong>
              <small>{profile.studentId || '未填写'}</small>
            </div>
          </article>
        </section>
      )}

      <section className="v2-article-card">
        <div className="v2-settings-section-head">
          <p className="v2-kicker">安全记录</p>
          <h3>最近登录痕迹</h3>
          <p>发现异常时，再进入安全中心继续处理。</p>
        </div>

        <div className="v2-preview-row">
          <strong>最近登录时间</strong>
          <small>{security.lastLoginAt || '暂无记录'}</small>
        </div>
        <div className="v2-preview-row">
          <strong>最近设备</strong>
          <small>{security.lastDevice || '未知设备'}</small>
        </div>
        <div className="v2-preview-row">
          <strong>最近位置</strong>
          <small>{security.lastLocation || '未知位置'}</small>
        </div>
      </section>
    </div>
  )
}
