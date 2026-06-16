export default function EmploymentConfirmModal({
  open,
  title,
  body,
  confirmLabel = '确认',
  cancelLabel = '取消',
  onConfirm,
  onClose,
}) {
  if (!open) return null

  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal-card v2-employment-confirm" onClick={(event) => event.stopPropagation()}>
        <div className="v2-modal-head">
          <div>
            <p className="v2-kicker">操作确认</p>
            <h3>{title}</h3>
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>
        <p>{body}</p>
        <div className="v2-inline-actions">
          <button className="v2-secondary-link" type="button" onClick={onClose}>{cancelLabel}</button>
          <button className="v2-primary-link" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
