import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const operations = [
  { title: '招聘会管理', count: 8, note: '当前活动 5 场，支持上下架与时间校正' },
  { title: '岗位管理', count: 24, note: '岗位可联动通知触发器' },
  { title: '简历概览', count: 12, note: '只读概览，查看上传覆盖率与模板类型' },
  { title: '通知触发', count: 5, note: '人工确认匹配范围与跳过重复发送' },
]

export default function AdminEmploymentWorkbenchPage() {
  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '就业运营台' }]} hint="运营页关注节奏、触达与结果，不退化成普通表格页。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / employment operations</p>
        <h1>就业运营台</h1>
        <p>这里承接招聘会、岗位、通知触发与简历概览四类运营对象，不把它们堆到管理员首页。</p>
      </header>
      <div className="v1-metric-grid">
        {operations.map((item) => (
          <article className="v1-metric-card" key={item.title}>
            <span>{item.title}</span>
            <strong>{item.count}</strong>
            <small>{item.note}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
