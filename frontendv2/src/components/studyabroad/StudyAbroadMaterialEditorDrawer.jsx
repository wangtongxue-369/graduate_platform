import { studyAbroadMaterialStageOptions } from '@/lib/studyabroad/studyAbroadLabels.js'
import StudyAbroadPageModal from '@/components/studyabroad/StudyAbroadPageModal.jsx'

export default function StudyAbroadMaterialEditorDrawer({
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
    <StudyAbroadPageModal
      open={open}
      kicker="材料清单"
      title="新增 / 编辑材料"
      lead="记录文书、成绩单、推荐信等材料的状态和截止日期。附件上传仍在材料卡片中完成。"
      onClose={onClose}
      className="v2-studyabroad-editor-drawer"
      testId="studyabroad-material-editor-drawer"
    >
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
          <span>阶段</span>
          <select value={form.stage} onChange={(event) => updateField('stage', event.target.value)}>
            {studyAbroadMaterialStageOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>材料类别</span>
          <input value={form.category} onChange={(event) => updateField('category', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>截止日期</span>
          <input type="date" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>完成状态</span>
          <select value={form.completed ? 'done' : 'todo'} onChange={(event) => updateField('completed', event.target.value === 'done')}>
            <option value="todo">待完成</option>
            <option value="done">已完成</option>
          </select>
        </label>
        <label className="v2-field">
          <span>备注</span>
          <textarea value={form.note} onChange={(event) => updateField('note', event.target.value)} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">保存材料</button>
        </div>
      </form>
    </StudyAbroadPageModal>
  )
}
