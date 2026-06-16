export default function KaoyanPlanEditModal({
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
          <h3>编辑计划</h3>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        {error ? <div className="v2-status-note">{error}</div> : null}

        <form className="v2-filter-form v2-plan-modal-grid" onSubmit={onSubmit}>
          <label className="v2-field">
            <span>计划名称</span>
            <input value={form.name} onChange={(event) => onChange('name', event.target.value)} />
          </label>

          <label className="v2-field">
            <span>计划简介</span>
            <textarea value={form.description} onChange={(event) => onChange('description', event.target.value)} />
          </label>

          <div className="v2-plan-modal-split">
            <label className="v2-field">
              <span>开始日期</span>
              <input type="date" value={form.startDate} onChange={(event) => onChange('startDate', event.target.value)} />
            </label>

            <label className="v2-field">
              <span>结束日期</span>
              <input type="date" value={form.endDate} onChange={(event) => onChange('endDate', event.target.value)} />
            </label>
          </div>

          <label className="v2-field">
            <span>计划总时长（小时）</span>
            <input
              min="1"
              step="0.5"
              type="number"
              value={form.totalDurationHours}
              onChange={(event) => onChange('totalDurationHours', event.target.value)}
            />
          </label>

          <div className="v2-inline-actions">
            <button className="v2-segment-button" type="button" onClick={onClose}>取消</button>
            <button className="v2-segment-button is-active" disabled={saving} type="submit">
              {saving ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
