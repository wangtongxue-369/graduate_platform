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

  const security = profile.security || {}

  return (
    <>
      <div className="v2-main-column">
        <PageIntro
          kicker="profile"
          pathItems={[{ label: '个人设置' }]}
          title="个人信息"
          lead="这里对应后端的 profile 与 dashboard 结构，优先呈现身份、目标方向、使用概览与最近登录痕迹。"
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
          <article className="v2-module-card">
            <strong>最近登录</strong>
            <p>{security.lastLoginAt || '暂无记录'}</p>
            <p>{security.lastDevice || '未知设备'}</p>
            <p>{security.lastLocation || '未知位置'}</p>
          </article>
        </section>

        <section className="v2-feed-list" aria-label="资料维护提示">
          <div className="v2-feed-item">
            <div className="v2-feed-index">01</div>
            <div className="v2-feed-body">
              <strong>优先同步个人资料</strong>
              <p>学校、专业、年级与方向是社区发帖、方向主站和推荐模块共同引用的基础信息。</p>
            </div>
          </div>
          <div className="v2-feed-item">
            <div className="v2-feed-index">02</div>
            <div className="v2-feed-body">
              <strong>再处理联系信息</strong>
              <p>邮箱、手机与学号用于登录、找回密码和后续资料流转，修改时需要保持一致。</p>
            </div>
          </div>
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

        <section className="v2-side-card">
          <p className="v2-kicker">安全提示</p>
          <ul>
            <li>若设备异常，先修改密码。</li>
            <li>若登录地异常，优先核查账号共享。</li>
            <li>忘记密码时回到登录页进入找回流程。</li>
          </ul>
        </section>
      </aside>
    </>
  )
}
