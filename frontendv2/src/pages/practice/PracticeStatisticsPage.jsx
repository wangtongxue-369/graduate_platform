import { useEffect, useState } from 'react'
import { useAuth } from '@legacy/context/AuthContext.jsx'
import { practiceApi } from '@legacy/lib/api.js'
import PageIntro from '@/components/PageIntro.jsx'
import PracticeStatisticsDashboard from '@/components/practice/PracticeStatisticsDashboard.jsx'

export default function PracticeStatisticsPage() {
  const { token } = useAuth()
  const [granularity, setGranularity] = useState('day')
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadStats() {
      try {
        const data = await practiceApi.statistics(granularity, token)
        if (!active) return
        setStats(data || null)
        setMessage('')
      } catch (error) {
        if (!active) return
        setStats(null)
        setMessage(error.message || '练习统计暂时不可用。')
      }
    }

    loadStats()
    return () => {
      active = false
    }
  }, [granularity, token])

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="练习统计"
        pathItems={[
          { label: '题库目录', to: '/practice' },
          { label: '练习统计' },
        ]}
        title="练习统计"
        lead="从日、周、月三个粒度观察练习频率、正确率和高频错点，判断下一轮训练重点。"
      />

      {message ? <div className="v2-status-note">{message}</div> : null}

      <PracticeStatisticsDashboard
        granularity={granularity}
        onGranularityChange={setGranularity}
        stats={stats}
      />
    </div>
  )
}
