export default function KaoyanStudyRoomCreateModal({
  canUseRemote,
  error,
  form,
  saving,
  schoolOptions,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div
        aria-label="新建同频自习室"
        aria-modal="true"
        className="v2-modal-card v2-plan-modal-card v2-room-create-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <div>
            <h3>新建同频自习室</h3>
            <p className="v2-room-create-modal__lead">先定一个房间名和大致方向，进入房间后再继续安排学习节奏和讨论规则。</p>
          </div>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        {error ? <div className="v2-status-note">{error}</div> : null}

        <form className="v2-filter-form v2-room-create-modal__grid" onSubmit={onSubmit}>
          <label className="v2-field">
            <span>房间名称</span>
            <input
              aria-label="房间名称"
              type="text"
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
            />
          </label>
          <label className="v2-field">
            <span>目标院校</span>
            <select
              aria-label="目标院校"
              value={form.schoolId}
              onChange={(event) => onChange('schoolId', event.target.value)}
            >
              <option value="">暂不指定</option>
              {schoolOptions.map((item) => (
                <option key={`create-${item.id}-${item.name}`} value={String(item.id)}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="v2-field">
            <span>创建专业</span>
            <input
              aria-label="创建专业"
              type="text"
              value={form.major}
              onChange={(event) => onChange('major', event.target.value)}
            />
          </label>
          <div className="v2-inline-actions">
            <button className="v2-segment-button" type="button" onClick={onClose}>取消</button>
            <button className="v2-segment-button is-active" disabled={saving || !canUseRemote} type="submit">
              {saving ? '创建中...' : '创建并进入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
