import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const assets = [
  { label: '岗位数据', note: '岗位信息与上下线' },
  { label: '分数线数据', note: '年份线与岗位关联' },
  { label: '日历事件', note: '考试时间与提醒节点' },
]

export default function AdminKaogongWorkbenchPage() {
  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '考公治理' }]} hint="考公治理是纯数据治理台，不做审核页结构。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / kaogong governance</p>
        <h1>考公治理</h1>
      </header>
      <div className="v1-card-stack">
        {assets.map((asset) => (
          <article className="v1-list-card" key={asset.label}>
            <strong>{asset.label}</strong>
            <span>{asset.note}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
