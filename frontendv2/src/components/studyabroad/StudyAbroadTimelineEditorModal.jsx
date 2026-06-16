import {
  studyAbroadTimelinePhaseOptions,
  studyAbroadTimelineStatusOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'

export default function StudyAbroadTimelineEditorModal({
  open,
  applications = [],
  form,
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
    <div className="v2-modal-overlay" onClick={onClose}>
      <div className="v2-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="v2-modal-head">
          <div>
            <p className="v2-kicker">时间线节点</p>
            <h3>新增 / 编辑节点</h3>
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>
        <form className="v2-form-grid" onSubmit={handleSubmit}>
          <label className="v2-field">
            <span>关联申请</span>
            <select value={form.applicationId} onChange={(event) => updateField('applicationId', event.target.value)}>
              <option value="">不关联</option>
              {applications.map((item) => (
                <option key={item.id} value={item.id}>{item.school} / {item.program}</option>
              ))}
            </select>
          </label>
          <label className="v2-field">
            <span>标题</span>
            <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>国家 / 地区</span>
            <input value={form.country} onChange={(event) => updateField('country', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>学校</span>
            <input value={form.school} onChange={(event) => updateField('school', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>阶段</span>
            <select value={form.phase} onChange={(event) => updateField('phase', event.target.value)}>
              {studyAbroadTimelinePhaseOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="v2-field">
            <span>状态</span>
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              {studyAbroadTimelineStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="v2-field">
            <span>截止日期</span>
            <input type="date" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} />
          </label>
          <label className="v2-field" style={{ gridColumn: '1 / -1' }}>
            <span>备注</span>
            <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} />
          </label>
          <div className="v2-inline-actions" style={{ gridColumn: '1 / -1' }}>
            <button className="v2-primary-link" type="submit">保存节点</button>
          </div>
        </form>
      </div>
    </div>
  )
}
