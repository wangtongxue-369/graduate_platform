import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const materials = [
  { id: 'material-9', title: '考研政治冲刺讲义', reason: '等待审核来源与版权说明', action: '去审核' },
  { id: 'material-12', title: '计算机复试题库整理', reason: '需要确认标签和方向归属', action: '去审核' },
]

export default function AdminMaterialReviewPage() {
  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '考研治理', to: '/admin/kaoyan' }, { label: '资料待审' }]} hint="资料审核属于考研入口下的审核流页面。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / kaoyan material review</p>
        <h1>资料待审</h1>
        <p>从考研治理进入，但页面结构遵循审核流：队列、原文、决定，不混入院校与分数线表格。</p>
      </header>
      <div className="v1-card-stack">
        {materials.map((item) => (
          <article className="v1-list-card" key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.reason}</span>
            <span>{item.action}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
