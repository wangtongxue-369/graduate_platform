import { studyAbroadCountryOptions, studyAbroadTopicOptions } from '@/lib/studyabroad/studyAbroadLabels.js'
import StudyAbroadPageModal from '@/components/studyabroad/StudyAbroadPageModal.jsx'

export default function StudyAbroadExperienceComposerDrawer({
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
    <StudyAbroadPageModal
      open={open}
      kicker="留学经验库"
      title={editingItem ? '编辑经验帖' : '发布经验帖'}
      lead="填写标题、摘要和正文。经验帖会展示在留学经验库，其他用户可以点击查看全文。"
      onClose={onClose}
      className="v2-studyabroad-editor-drawer"
      testId="studyabroad-experience-composer-drawer"
    >
      <form className="v2-form-grid" onSubmit={handleSubmit}>
        <label className="v2-field">
          <span>标题</span>
          <input value={form.title} onChange={(event) => updateField('title', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>国家 / 地区</span>
          <select value={form.country} onChange={(event) => updateField('country', event.target.value)}>
            {studyAbroadCountryOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>主题</span>
          <select value={form.topic} onChange={(event) => updateField('topic', event.target.value)}>
            {studyAbroadTopicOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="v2-field">
          <span>作者署名</span>
          <input value={form.authorName} onChange={(event) => updateField('authorName', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>标签</span>
          <input value={form.tags} onChange={(event) => updateField('tags', event.target.value)} placeholder="用逗号分隔" />
        </label>
        <label className="v2-field" style={{ gridColumn: '1 / -1' }}>
          <span>摘要</span>
          <textarea value={form.summary} onChange={(event) => updateField('summary', event.target.value)} />
        </label>
        <label className="v2-field" style={{ gridColumn: '1 / -1' }}>
          <span>正文</span>
          <textarea value={form.content} onChange={(event) => updateField('content', event.target.value)} />
        </label>
        <div className="v2-inline-actions" style={{ gridColumn: '1 / -1' }}>
          <button className="v2-primary-link" type="submit">{editingItem ? '保存经验' : '发布经验'}</button>
        </div>
      </form>
    </StudyAbroadPageModal>
  )
}
