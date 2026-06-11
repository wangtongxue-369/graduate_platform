import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { userApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import { createSettingsAttempts } from '@/lib/settingsPreview.js'

export default function SettingsPracticePage() {
  const { token } = useAuth()
  const [attempts, setAttempts] = useState(createSettingsAttempts())
  const [notice, setNotice] = useState('当前显示的是练习记录预览。')

  useEffect(() => {
    let active = true

    async function load() {
      if (!token || token === 'dev-token') return
      try {
        const data = await userApi.myAttempts(0, 8, {}, token)
        if (!active) return
        setAttempts(data?.content?.length ? data.content : [])
        setNotice('')
      } catch (error) {
        if (!active) return
        setNotice(error.message || '练习记录暂时不可用，已切换到预览数据。')
      }
    }

    load()
    return () => {
      active = false
    }
  }, [token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="practice history"
        title="练习记录"
        lead="对应后端 myAttempts 分页结构，列表把正确率判断和题干摘要分开显示。"
      />

      {notice ? <div className="v2-status-note">{notice}</div> : null}

      <section className="v2-feed-list" aria-label="练习记录">
        {attempts.map((attempt) => (
          <article className="v2-feed-item" key={attempt.id}>
            <div className="v2-feed-index">{attempt.correct ? '对' : '错'}</div>
            <div className="v2-feed-body">
              <strong>{attempt.questionStem || '练习题目'}</strong>
              <p>{String(attempt.createdAt || '').slice(0, 16).replace('T', ' ')}</p>
            </div>
            <span className="v2-feed-action">{attempt.correct ? '正确' : '待复盘'}</span>
          </article>
        ))}
      </section>
    </div>
  )
}
