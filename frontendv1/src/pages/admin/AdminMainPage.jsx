import { Link } from 'react-router-dom'
import StatCard from '@/components/StatCard.jsx'

const modules = [
  { title: '内容治理', desc: '帖子审核、举报处理、评论举报、分类管理。', to: '/admin/review' },
  { title: '用户治理', desc: '按方向与状态处理禁言、封禁、上传限制。', to: '/admin/users' },
  { title: '就业运营', desc: '招聘会、岗位、提醒触发、简历摘要。', to: '/admin/employment' },
  { title: '方向数据与题库治理', desc: '考研、考公、题库与题目治理。', to: '/admin/question-banks' },
]

export default function AdminMainPage() {
  return (
    <section className="v1-admin-main">
      <div className="v1-admin-hero">
        <div className="v1-station-copy">
          <p className="v1-eyebrow">admin main station</p>
          <h1>今天先处理最影响平台秩序的 4 条队列。</h1>
          <p className="v1-lead">
            管理员主站先分发治理优先级，再进入具体后台模块。留学没有独立管理员后台，不在这里伪造一个假总台。
          </p>
        </div>
        <div className="v1-station-stats">
          <StatCard label="待审核帖子" value="19" tone="accent" />
          <StatCard label="待处理举报" value="7" />
          <StatCard label="异常状态用户" value="14" />
          <StatCard label="就业提醒任务" value="5" />
        </div>
      </div>

      <div className="v1-step-grid v1-step-grid--two">
        {modules.map((item) => (
          <article className="v1-step-card" key={item.to}>
            <h2>{item.title}</h2>
            <p>{item.desc}</p>
            <Link className="v1-btn v1-btn--primary" to={item.to}>
              进入模块
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
