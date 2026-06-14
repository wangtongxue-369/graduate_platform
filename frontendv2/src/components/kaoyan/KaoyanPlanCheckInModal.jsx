export default function KaoyanPlanCheckInModal({
  dateLabel,
  form,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal-card v2-plan-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="v2-modal-head">
          <h3>打卡 · {dateLabel}</h3>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        {error ? <div className="v2-status-note">{error}</div> : null}

        <form className="v2-filter-form v2-plan-modal-grid" onSubmit={onSubmit}>
          <label className="v2-field">
            <span>学习时长（小时）</span>
            <input
              autoFocus
              max="24"
              min="0.1"
              step="0.1"
              type="number"
              value={form.durationHours}
              onChange={(event) => onChange('durationHours', event.target.value)}
            />
          </label>

          <label className="v2-field">
            <span>备注</span>
            <textarea
              value={form.remark}
              onChange={(event) => onChange('remark', event.target.value)}
            />
          </label>

          <div className="v2-inline-actions">
            <button className="v2-segment-button" type="button" onClick={onClose}>取消</button>
            <button className="v2-segment-button is-active" disabled={saving} type="submit">
              {saving ? '提交中...' : '确认打卡'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
