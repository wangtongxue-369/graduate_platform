export default function JobPostingDetailDrawer({ posting, onClose, onTrack }) {
  if (!posting) return null

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <section
        className="v2-modal-card v2-employment-detail-modal"
        data-testid="job-posting-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <div>
            <p className="v2-kicker">岗位详情</p>
            <h3>{posting.companyName} / {posting.title}</h3>
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="v2-check-list">
          <article className="v2-check-row"><strong>城市</strong><span>{posting.city}</span></article>
          <article className="v2-check-row"><strong>行业</strong><span>{posting.industry}</span></article>
          <article className="v2-check-row"><strong>企业类型</strong><span>{posting.companyType}</span></article>
          <article className="v2-check-row"><strong>岗位类型</strong><span>{posting.roleType}</span></article>
          <article className="v2-check-row"><strong>薪资</strong><span>{posting.salaryRange}</span></article>
          <article className="v2-check-row"><strong>学历要求</strong><span>{posting.educationRequirement}</span></article>
        </div>
        <p>{posting.description}</p>
        {posting.responsibilities ? (
          <div className="v2-check-list">
            <article className="v2-check-row">
              <strong>关键职责</strong>
              <span>{posting.responsibilities}</span>
            </article>
          </div>
        ) : null}
        {posting.requirements ? (
          <div className="v2-check-list">
            <article className="v2-check-row">
              <strong>关键要求</strong>
              <span>{posting.requirements}</span>
            </article>
          </div>
        ) : null}
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="button" onClick={() => onTrack(posting)}>加入投递跟踪</button>
          {posting.applyUrl ? <a className="v2-secondary-link" href={posting.applyUrl} rel="noreferrer" target="_blank">打开申请链接</a> : null}
        </div>
      </section>
    </div>
  )
}
