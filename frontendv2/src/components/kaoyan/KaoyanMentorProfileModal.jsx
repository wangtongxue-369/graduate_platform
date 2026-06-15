export default function KaoyanMentorProfileModal({
  mentor,
  acting,
  onClose,
  onConsult,
}) {
  if (!mentor) return null

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div
        aria-labelledby="v2-mentor-profile-title"
        aria-modal="true"
        className="v2-modal-card v2-mentor-profile-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <div className="v2-mentor-profile-modal__head">
            <p className="v2-kicker">学长学姐资料</p>
            <h3 id="v2-mentor-profile-title">{mentor.nickname}资料</h3>
            <p>{mentor.graduateSchool} / {mentor.major}</p>
          </div>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        <div className="v2-card-grid v2-mentor-profile-modal__summary">
          <article className="v2-summary-card">
            <span>毕业院校</span>
            <strong>{mentor.graduateSchool}</strong>
            <p>公开展示院校信息</p>
          </article>
          <article className="v2-summary-card">
            <span>专业方向</span>
            <strong>{mentor.major}</strong>
            <p>{mentor.enrollmentYear ? `${mentor.enrollmentYear} 级` : '届次待补充'}</p>
          </article>
          <article className="v2-summary-card">
            <span>擅长科目</span>
            <strong>{mentor.expertiseSubjects}</strong>
            <p>{mentor.examSubjects || '考试科目待补充'}</p>
          </article>
        </div>

        <div className="v2-check-list">
          <div className="v2-check-row">
            <strong>年级</strong>
            <span>{mentor.enrollmentYear ? `${mentor.enrollmentYear} 级` : '待补充'}</span>
          </div>
          <div className="v2-check-row">
            <strong>擅长科目</strong>
            <span>{mentor.expertiseSubjects}</span>
          </div>
          {mentor.examSubjects ? (
            <div className="v2-check-row">
              <strong>考试科目</strong>
              <span>{mentor.examSubjects}</span>
            </div>
          ) : null}
          <div className="v2-check-row">
            <strong>个人简介</strong>
            <span>{mentor.bio}</span>
          </div>
        </div>

        <div className="v2-inline-actions">
          <button className="v2-segment-button" type="button" onClick={onClose}>先回列表</button>
          <button
            className="v2-segment-button is-active"
            disabled={acting}
            type="button"
            onClick={() => onConsult(mentor)}
          >
            {acting ? '发起中...' : '发起咨询'}
          </button>
        </div>
      </div>
    </div>
  )
}
