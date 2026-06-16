export default function StudyAbroadPageModal({
  open,
  kicker,
  title,
  lead,
  onClose,
  children,
  className = '',
  testId,
}) {
  if (!open) return null

  return (
    <div className="v2-modal-overlay v2-studyabroad-page-modal-overlay" onClick={onClose}>
      <section
        className={`v2-modal-card v2-studyabroad-page-modal ${className}`}
        data-testid={testId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head v2-studyabroad-page-modal__head">
          <div>
            {kicker ? <p className="v2-kicker">{kicker}</p> : null}
            <h3>{title}</h3>
            {lead ? <p>{lead}</p> : null}
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="v2-studyabroad-page-modal__body">
          {children}
        </div>
      </section>
    </div>
  )
}
