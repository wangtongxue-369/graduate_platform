export default function AdminKaoyanSchoolFormModal({
  mode = 'create',
  form,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit'
  return (
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal-card v2-school-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="v2-modal-head">
          <h3>{isEdit ? '编辑院校' : '新增院校'}</h3>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        {error ? <div className="v2-status-note">{error}</div> : null}

        <form className="v2-filter-form" onSubmit={onSubmit}>
          <label className="v2-field">
            <span>院校名称</span>
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
            />
          </label>
          <label className="v2-field">
            <span>地区</span>
            <input
              type="text"
              value={form.region}
              onChange={(event) => onChange('region', event.target.value)}
            />
          </label>
          <label className="v2-field">
            <span>省份</span>
            <input
              type="text"
              value={form.province}
              onChange={(event) => onChange('province', event.target.value)}
            />
          </label>
          <label className="v2-field">
            <span>院校类型</span>
            <input
              type="text"
              value={form.schoolType}
              onChange={(event) => onChange('schoolType', event.target.value)}
            />
          </label>
          <label className="v2-field">
            <span>院校标签</span>
            <div className="v2-tag-row v2-school-form-tags">
              <label className="v2-school-form-tag">
                <input
                  type="checkbox"
                  checked={Boolean(form.is985)}
                  onChange={(event) => onChange('is985', event.target.checked)}
                />
                <span>985</span>
              </label>
              <label className="v2-school-form-tag">
                <input
                  type="checkbox"
                  checked={Boolean(form.is211)}
                  onChange={(event) => onChange('is211', event.target.checked)}
                />
                <span>211</span>
              </label>
              <label className="v2-school-form-tag">
                <input
                  type="checkbox"
                  checked={Boolean(form.isDoubleFirstClass)}
                  onChange={(event) => onChange('isDoubleFirstClass', event.target.checked)}
                />
                <span>双一流</span>
              </label>
            </div>
          </label>
          <div className="v2-inline-actions">
            <button className="v2-segment-button" type="button" onClick={onClose}>取消</button>
            <button className="v2-segment-button is-active" disabled={saving} type="submit">
              {saving ? '保存中…' : isEdit ? '保存院校修改' : '新增院校'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
