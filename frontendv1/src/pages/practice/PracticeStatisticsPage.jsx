import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import { createPracticePreview } from '@/lib/practicePreview.js'

export default function PracticeStatisticsPage() {
  const { statistics } = createPracticePreview()

  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '题库目录', to: '/practice' }, { label: '统计图谱' }]} hint="统计页只看结果走势，不承担练习入口。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">practice / statistics</p>
        <h1>统计图谱</h1>
        <p>准确率、连续练习天数和最近一次练习时间单独展示，避免和题库筛选互相抢空间。</p>
      </header>
      <div className="v1-metric-grid">
        <article className="v1-metric-card">
          <span>准确率</span>
          <strong>{Math.round(statistics.accuracyRate * 100)}%</strong>
        </article>
        <article className="v1-metric-card">
          <span>连续天数</span>
          <strong>{statistics.streakDays} 天</strong>
        </article>
        <article className="v1-metric-card">
          <span>练习总次数</span>
          <strong>{statistics.totalSessions}</strong>
        </article>
      </div>
    </section>
  )
}
