import { Link } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const lanes = [
  { label: '帖子待审', note: '优先处理新用户与附件内容', to: '/admin/review' },
  { label: '帖子举报', note: '进入举报队列看成立与驳回', to: '/admin/reports' },
  { label: '评论举报', note: '和帖子举报共用风险判断流', to: '/admin/reports' },
  { label: '分类管理', note: '维护社区分类启停与合并', to: '/admin/community' },
  { label: '用户状态管理', note: '从治理页进入异常用户台账', to: '/admin/users' },
]

export default function AdminCommunityWorkbenchPage() {
  return (
    <section className="v1-admin-workbench-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '社区治理' }]} hint="先选治理队列，再进入具体处理页。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / community governance</p>
        <h1>社区治理</h1>
        <p>社区治理属于审核流家族：队列先行，处理动作后置，不把所有社区管理平铺成后台表格。</p>
      </header>
      <div className="v1-card-stack">
        {lanes.map((lane) => (
          <Link className="v1-list-card" key={lane.label} to={lane.to}>
            <strong>{lane.label}</strong>
            <span>{lane.note}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
