import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsProfile } from '@/lib/settingsPreview.js'

export default function SettingsSecurityPage() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState(createSettingsProfile(user))
  const [notice, setNotice] = useState('当前显示的是安全信息预览。')

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') return
      try {
        const data = await userApi.profile(token)
        if (!active) return
        setProfile(createSettingsProfile(data))
        setNotice('')
      } catch (error) {
        if (!active) return
        setNotice(error.message || '安全信息暂时不可用，已切换到预览数据。')
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
          kicker="security"
          title="安全中心"
          lead="这里对应 profile.security 结构，把最近登录设备、时间与位置单独收进安全页。"
        />

        {notice ? <div className="v2-status-note">{notice}</div> : null}

        <section className="v2-card-grid">
          <article className="v2-module-card">
            <strong>最近登录</strong>
            <p>{security.lastLoginAt || '暂无记录'}</p>
            <p>{security.lastDevice || '未知设备'}</p>
          </article>
          <article className="v2-module-card">
            <strong>位置与网络</strong>
            <p>{security.lastLocation || '未知位置'}</p>
            <p>{security.lastIp || '未知 IP'}</p>
          </article>
        </section>
      </div>

      <aside className="v2-side-column">
        <section className="v2-side-card">
          <p className="v2-kicker">处理建议</p>
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
