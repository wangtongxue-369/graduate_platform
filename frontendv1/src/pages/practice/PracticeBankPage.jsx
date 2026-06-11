import { Link, useParams } from 'react-router-dom'
import PreviewBanner from '@/components/PreviewBanner.jsx'
import ReturnBar from '@/components/ReturnBar.jsx'
import RoleAuthLink from '@/components/RoleAuthLink.jsx'
import { findPracticePreviewBank } from '@/lib/practicePreview.js'

export default function PracticeBankPage() {
  const { id } = useParams()
  const bank = findPracticePreviewBank(id)

  return (
    <section className="v1-task-page">
      <ReturnBar
        items={[
          { label: '题库目录', to: '/practice' },
          { label: bank?.title || '题库详情' },
        ]}
        hint="开始练习前先确认这套题库的方向、题量和练习去向。"
      />
      <PreviewBanner />

      <header className="v1-task-head">
        <p className="v1-eyebrow">practice / bank detail</p>
        <h1>{bank?.title || '题库详情'}</h1>
        <p>练习会话入口、题型摘要和结果去向都在这页确认，不把交卷结果混到目录页里。</p>
      </header>

      <div className="v1-workbench-grid">
        <article className="v1-sheet">
          <strong>练习会话入口</strong>
          <p>{bank?.description || '当前预览集中没有这套题库。'}</p>
          <div className="v1-tag-row">
            <span className="v1-tag">{bank?.target || 'preview'}</span>
            <span className="v1-tag">{bank?.subject || 'subject'}</span>
            <span className="v1-tag">{bank?.questionCount || 0} 题</span>
          </div>
          <div className="v1-action-row">
            <RoleAuthLink className="v1-btn v1-btn--primary">登录后开始练习</RoleAuthLink>
            <Link className="v1-btn" to="/practice/history">看历史</Link>
          </div>
        </article>

        <aside className="v1-file-panel">
          <strong>结果去向</strong>
          <span>交卷后进入成绩页，再跳到错题账本或历史时间轴。</span>
          <div className="v1-action-column">
            <Link className="v1-btn" to="/practice/statistics">统计图谱</Link>
            <Link className="v1-btn" to="/practice/wrong-questions">错题账本</Link>
          </div>
        </aside>
      </div>
    </section>
  )
}
