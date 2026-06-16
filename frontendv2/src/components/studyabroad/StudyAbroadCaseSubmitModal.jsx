import { studyAbroadCountryOptions, studyAbroadResultOptions } from '@/lib/studyabroad/studyAbroadLabels.js'

export default function StudyAbroadCaseSubmitModal({
  open,
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
            <p className="v2-kicker">匿名提交</p>
            <h3>提交案例</h3>
          </div>
          <button className="v2-secondary-link" type="button" onClick={onClose}>关闭</button>
        </div>
        <form className="v2-form-grid" onSubmit={handleSubmit}>
          <label className="v2-field">
            <span>申请年份</span>
            <input value={form.applicationYear} onChange={(event) => updateField('applicationYear', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>本科专业</span>
            <input value={form.studentMajor} onChange={(event) => updateField('studentMajor', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>GPA</span>
            <input value={form.gpa} onChange={(event) => updateField('gpa', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>语言考试</span>
            <input value={form.languageType} onChange={(event) => updateField('languageType', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>语言成绩</span>
            <input value={form.languageScore} onChange={(event) => updateField('languageScore', event.target.value)} />
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
            <span>学校</span>
            <input value={form.school} onChange={(event) => updateField('school', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>项目</span>
            <input value={form.program} onChange={(event) => updateField('program', event.target.value)} />
          </label>
          <label className="v2-field">
            <span>录取结果</span>
            <select value={form.admissionResult} onChange={(event) => updateField('admissionResult', event.target.value)}>
              {studyAbroadResultOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="v2-field v2-form-grid--single" style={{ gridColumn: '1 / -1' }}>
            <span>软背景</span>
            <textarea value={form.softBackground} onChange={(event) => updateField('softBackground', event.target.value)} />
          </label>
          <label className="v2-field v2-form-grid--single" style={{ gridColumn: '1 / -1' }}>
            <span>总结</span>
            <textarea value={form.summary} onChange={(event) => updateField('summary', event.target.value)} />
          </label>
          <label className="v2-field v2-form-grid--single" style={{ gridColumn: '1 / -1' }}>
            <span>联系方式</span>
            <input
              value={form.contact}
              onChange={(event) => updateField('contact', event.target.value)}
              placeholder="可选：邮箱、微信或站内联系说明"
            />
          </label>
          <div className="v2-inline-actions" style={{ gridColumn: '1 / -1' }}>
            <button className="v2-primary-link" type="submit">提交案例</button>
          </div>
        </form>
      </div>
    </div>
  )
}
