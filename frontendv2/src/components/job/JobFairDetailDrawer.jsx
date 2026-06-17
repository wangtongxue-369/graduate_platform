export default function JobFairDetailDrawer({ fair, onClose }) {
  if (!fair) return null

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <section
        className="v2-modal-card v2-employment-detail-modal"
        data-testid="job-fair-detail-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <div>
            <p className="v2-kicker">招聘会详情</p>
            <h3>{fair.title}</h3>
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="v2-check-list">
          <article className="v2-check-row"><strong>城市</strong><span>{fair.city}</span></article>
          <article className="v2-check-row"><strong>行业</strong><span>{fair.industry}</span></article>
          <article className="v2-check-row"><strong>地点</strong><span>{fair.location}</span></article>
          <article className="v2-check-row"><strong>面向岗位</strong><span>{fair.targetRoles || '待补充'}</span></article>
          <article className="v2-check-row"><strong>报名截止</strong><span>{fair.applyDeadline || '待确认'}</span></article>
        </div>
        <p>{fair.description}</p>
        <div className="v2-inline-actions">
          {fair.applyUrl ? <a className="v2-primary-link" href={fair.applyUrl} rel="noreferrer" target="_blank">打开报名链接</a> : null}
        </div>
      </section>
    </div>
  )
}
