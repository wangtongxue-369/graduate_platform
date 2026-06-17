export default function AdminKaoyanScoreLineFormModal({
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
      <div
        className="v2-modal-card v2-score-line-form-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="v2-modal-head">
          <h3>{isEdit ? '编辑分数线' : '新增分数线'}</h3>
          <button className="v2-segment-button" type="button" onClick={onClose}>关闭</button>
        </div>

        {error ? <div className="v2-status-note">{error}</div> : null}

        <form className="v2-filter-form" onSubmit={onSubmit}>
          <div className="v2-score-lines-grid">
            <label className="v2-field">
              <span>年份</span>
              <input type="text" value={form.year} onChange={(event) => onChange('year', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>学位类型</span>
              <input type="text" value={form.degreeType} onChange={(event) => onChange('degreeType', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>专业门类</span>
              <input type="text" value={form.majorCategory} onChange={(event) => onChange('majorCategory', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>具体专业</span>
              <input type="text" value={form.majorName} onChange={(event) => onChange('majorName', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>政治线</span>
              <input type="number" value={form.politicsLine} onChange={(event) => onChange('politicsLine', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>外语线</span>
              <input type="number" value={form.foreignLangLine} onChange={(event) => onChange('foreignLangLine', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>专业课一线</span>
              <input type="number" value={form.subject1Line} onChange={(event) => onChange('subject1Line', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>专业课二线</span>
              <input type="number" value={form.subject2Line} onChange={(event) => onChange('subject2Line', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>总分线</span>
              <input type="number" value={form.totalScoreLine} onChange={(event) => onChange('totalScoreLine', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>计划招生</span>
              <input type="number" value={form.plannedEnrollment} onChange={(event) => onChange('plannedEnrollment', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>实考人数</span>
              <input type="number" value={form.actualApplicants} onChange={(event) => onChange('actualApplicants', event.target.value)} />
            </label>
            <label className="v2-field">
              <span>报录比</span>
              <input type="number" value={form.admissionRatio} onChange={(event) => onChange('admissionRatio', event.target.value)} />
            </label>
            <label className="v2-field v2-score-line-form-source">
              <span>数据来源</span>
              <input type="text" value={form.source} onChange={(event) => onChange('source', event.target.value)} />
            </label>
          </div>
          <label className="v2-field">
            <span>备注</span>
            <textarea rows={3} value={form.note} onChange={(event) => onChange('note', event.target.value)} />
          </label>
          <div className="v2-inline-actions">
            <button className="v2-segment-button" type="button" onClick={onClose}>取消</button>
            <button className="v2-segment-button is-active" disabled={saving} type="submit">
              {saving ? '保存中…' : isEdit ? '保存分数线修改' : '新增分数线'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
