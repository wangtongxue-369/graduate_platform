import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsDashboard, createSettingsProfile } from '@/lib/settingsPreview.js'
import { withRequestTimeout } from '@/lib/withRequestTimeout.js'

export default function SettingsProfilePage() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState(createSettingsProfile(user))
  const [dashboard, setDashboard] = useState(createSettingsDashboard())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') {
        setNotice('当前显示的是个人设置预览数据，用来观察真实资料页布局。')
        return
      }

      try {
        const [profileData, dashboardData] = await withRequestTimeout(
          Promise.all([userApi.profile(token), userApi.dashboard(token)]),
          8000,
          '个人信息读取超时，请检查后端服务。',
        )
        if (!active) return
        setProfile(createSettingsProfile(profileData))
        setDashboard(dashboardData || createSettingsDashboard())
      } catch (error) {
        if (!active) return
        setNotice(error.message || '个人信息暂时不可用，已切换到预览数据。')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [token, user])

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="profile"
          title="个人信息"
          lead="这里对应后端的 profile 与 dashboard 结构，优先呈现身份、目标方向与近期使用痕迹。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-card-grid">
          <article className="v2-module-card">
            <strong>{profile.name}</strong>
            <p>{profile.school || '未填写学校'} / {profile.major || '未填写专业'}</p>
            <p>{profile.grade || '未填写年级'} / 方向 {profile.target}</p>
          </article>
          <article className="v2-module-card">
            <strong>联系资料</strong>
            <p>邮箱 {profile.email || '未填写'}</p>
            <p>手机 {profile.phone || '未填写'}</p>
            <p>学号 {profile.studentId || '未填写'}</p>
          </article>
          <article className="v2-module-card">
            <strong>使用概览</strong>
            <p>发帖 {dashboard.postCount}</p>
            <p>评论 {dashboard.commentCount}</p>
            <p>练习 {dashboard.attemptCount}</p>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">账户状态</p>
          <ul>
            <li>角色：{profile.role}</li>
            <li>状态：{profile.status}</li>
            <li>意向地区：{profile.intentRegion || '未设置'}</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
