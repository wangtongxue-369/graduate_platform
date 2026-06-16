import { studyAbroadCountryOptions, studyAbroadTopicOptions } from '@/lib/studyabroad/studyAbroadLabels.js'

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
    <section className="v2-side-card v2-practice-drawer v2-studyabroad-editor-drawer" data-testid="studyabroad-experience-composer-drawer">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">经验抽屉</p>
          <h3>{editingItem ? '编辑经验' : '发布经验'}</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
      </div>
      <form className="v2-filter-form" onSubmit={handleSubmit}>
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
        <label className="v2-field">
          <span>摘要</span>
          <textarea value={form.summary} onChange={(event) => updateField('summary', event.target.value)} />
        </label>
        <label className="v2-field">
          <span>正文</span>
          <textarea value={form.content} onChange={(event) => updateField('content', event.target.value)} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">{editingItem ? '保存经验' : '发布经验'}</button>
        </div>
      </form>
    </section>
  )
}
