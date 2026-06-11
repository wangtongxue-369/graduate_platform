import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const reviewItems = [
  { id: 'post-201', title: '资料互助帖待审', reason: '带 3 个附件，需要先核对附件说明。', action: '通过 / 退回' },
  { id: 'post-205', title: '新注册用户发帖', reason: '账号创建未满 24 小时。', action: '继续审核' },
]

export default function AdminReviewQueuePage() {
  return (
    <section className="v1-task-page">
      <ReturnBar
        items={[
          { label: '值班总台', to: '/admin' },
          { label: '社区治理', to: '/admin/community' },
          { label: '帖子待审' },
        ]}
        hint="队列先行，处理完一条后回到原队列继续。"
      />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / pending post queue</p>
        <h1>帖子待审</h1>
        <p>待审帖子按工单队列组织，突出为什么需要审核，而不是直接把内容塞进通用后台列表。</p>
      </header>
      <div className="v1-card-stack">
        {reviewItems.map((item) => (
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
