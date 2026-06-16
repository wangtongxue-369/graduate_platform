import {
  studyAbroadApplicationPriorityOptions,
  studyAbroadApplicationStatusOptions,
  studyAbroadCountryOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'

export default function StudyAbroadApplicationEditorDrawer({
  open,
  form,
  editingItem,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!open) return null

  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="v2-side-card v2-practice-drawer v2-studyabroad-editor-drawer" data-testid="studyabroad-application-editor-drawer">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">申请抽屉</p>
          <h3>{editingItem ? '编辑申请' : '新建申请'}</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
      </div>
      <form className="v2-filter-form" onSubmit={handleSubmit}>
        <label className="v2-field">
          <span>国家 / 地区</span>
          <select value={form.country} onChange={(event) => updateField('country', event.target.value)}>
            {studyAbroadCountryOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>院校</span>
          <input aria-label="院校" value={form.school} onChange={(event) => updateField('school', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>专业</span>
          <input aria-label="专业" value={form.program} onChange={(event) => updateField('program', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>学位</span>
          <input value={form.degree} onChange={(event) => updateField('degree', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>入学季</span>
          <input value={form.intake} onChange={(event) => updateField('intake', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>申请轮次</span>
          <input value={form.applicationRound} onChange={(event) => updateField('applicationRound', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>截止日期</span>
          <input type="date" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>状态</span>
          <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
            {studyAbroadApplicationStatusOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>优先级</span>
          <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)}>
            {studyAbroadApplicationPriorityOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>备注</span>
          <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">保存申请</button>
        </div>
      </form>
    </section>
  )
}
