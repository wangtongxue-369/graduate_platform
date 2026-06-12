import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsProfile } from '@/lib/settingsPreview.js'

export default function SettingsSecurityPage() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState(createSettingsProfile(user))
  const [notice, setNotice] = useState('安全中心：预览数据')

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
    <div className="v2-main-column">
      <PageIntro
        kicker="安全中心"
        pathItems={[
          { label: '个人设置', to: '/settings/profile' },
          { label: '安全中心' },
        ]}
        title="安全中心"
        lead="单独查看最近设备、时间与位置。"
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
  )
}
