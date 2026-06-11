import { Link } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const modules = [
  { label: '院校数据', note: '分页、筛选与启停', to: '/admin/kaoyan' },
  { label: '分数线数据', note: '年份、专业与学校联动', to: '/admin/kaoyan' },
  { label: '资料待审', note: '切入审核流处理资料', to: '/admin/materials' },
]

export default function AdminKaoyanWorkbenchPage() {
  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '考研治理' }]} hint="院校与分数线留在治理台，资料审核切到审核流。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / kaoyan governance</p>
        <h1>考研治理</h1>
      </header>
      <div className="v1-card-stack">
        {modules.map((module) => (
          <Link className="v1-list-card" key={module.label} to={module.to}>
            <strong>{module.label}</strong>
            <span>{module.note}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
