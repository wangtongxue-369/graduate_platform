import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'

const reportQueue = [
  { id: 'report-44', title: '帖子举报：资料互助帖', reason: '举报成立可能性高，建议优先处理', action: '查看处置' },
  { id: 'comment-12', title: '评论举报：联系方式外链', reason: '存在导流风险，需要确认删除与否', action: '查看处置' },
]

export default function AdminReportQueuePage() {
  return (
    <section className="v1-task-page">
      <ReturnBar items={[{ label: '值班总台', to: '/admin' }, { label: '社区治理', to: '/admin/community' }, { label: '举报处理' }]} hint="在举报队列里完成成立、驳回或下线决策。" />
      <PreviewBanner />
      <header className="v1-task-head">
        <p className="v1-eyebrow">admin / report queue</p>
        <h1>举报处理</h1>
        <p>帖子举报和评论举报共用同一条处置流，先读原因，再进入对象详情做决定。</p>
      </header>
      <div className="v1-card-stack">
        {reportQueue.map((item) => (
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
