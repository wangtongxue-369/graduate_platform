import { Link } from 'react-router-dom'
import PageIntro from '@/components/PageIntro.jsx'
import { createKaoyanPreviewOverview } from '@/pages/student/kaoyan/kaoyanPageData.js'

export default function KaoyanOverviewPage() {
  const overview = createKaoyanPreviewOverview()

  return (
    <div className="v2-main-column">
      <PageIntro
        kicker="考研主站"
        title="考研总览"
        lead="主站只做任务判断和入口分发，复杂动作进入各自深层页完成。"
      />

      <section className="v2-summary-strip" aria-label="考研主站摘要">
        {overview.metrics.map((item) => (
          <article className="v2-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>先看现在该推进哪条线，再进入对应工作区。</p>
          </article>
        ))}
      </section>

      <section className="v2-card-grid--dense" aria-label="考研主流程">
        <Link className="v2-preview-panel" to="/station/kaoyan/schools">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">择校账本</p>
              <strong>把院校档案、分数线和收藏动作收在同一页里比较。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.schools.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.schoolName}</strong>
                <span>{item.majorName}</span>
                <small>{item.totalScoreLine ? `总分线 ${item.totalScoreLine}` : '总分线待补充'} / {item.note}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/plans">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">计划轨道</p>
              <strong>计划列表只负责排优先级，打卡和编辑进入计划详情页。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.plans.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.status}</span>
                <small>{item.description}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/materials">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">资料中枢</p>
              <strong>公开资料、上传入口、我的资料状态和附件下载全部走深层路由。</strong>
            </div>
            <span className="v2-feed-action">进入</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.materials.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.materialType}</span>
                <small>{item.description}</small>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="v2-card-grid" aria-label="考研专项支持">
        <Link className="v2-preview-panel" to="/station/kaoyan/support/mentors">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">1v1咨询</p>
              <strong>先锁定能回答你当前问题的学长学姐，再进入一对一沟通。</strong>
            </div>
            <span className="v2-feed-action">开始咨询</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.seniors.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.nickname}</strong>
                <span>{item.major}</span>
                <small>{item.expertiseSubjects}</small>
              </div>
            ))}
          </div>
        </Link>

        <Link className="v2-preview-panel" to="/station/kaoyan/support/rooms">
          <div className="v2-preview-panel__head">
            <div>
              <p className="v2-kicker">同频自习室</p>
              <strong>找到合适房间后直接进房学习，把筛选和实时陪伴分开处理。</strong>
            </div>
            <span className="v2-feed-action">进入房间</span>
          </div>
          <div className="v2-preview-panel__rows">
            {overview.rooms.map((item) => (
              <div className="v2-preview-row" key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.major}</span>
                <small>{item.memberCount} 人在线</small>
              </div>
            ))}
          </div>
        </Link>
      </section>
    </div>
  )
}
