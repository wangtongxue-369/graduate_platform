import {
  studyAbroadCountryOptions,
  studyAbroadResultOptions,
  studyAbroadSubjectOptions,
  studyAbroadTopicOptions,
} from '@/lib/studyabroad/studyAbroadLabels.js'

export default function AdminStudyAbroadFilters({
  filters,
  onChange,
  onSubmit,
  onReset,
  mode,
}) {
  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="v2-side-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">筛选控制器</p>
          <h3>先筛选，再进入具体治理对象</h3>
        </div>
      </div>
      <form className="v2-filter-form" onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
      >
        <label className="v2-field">
          <span>国家 / 地区</span>
          <select value={filters.country || ''} onChange={(event) => updateField('country', event.target.value)}>
            <option value="">全部</option>
            {studyAbroadCountryOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        {mode === 'programs' ? (
          <>
            <label className="v2-field">
              <span>学科方向</span>
              <select value={filters.subjectArea || ''} onChange={(event) => updateField('subjectArea', event.target.value)}>
                <option value="">全部</option>
                {studyAbroadSubjectOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>合作项目</span>
              <select value={filters.partnerOnly || ''} onChange={(event) => updateField('partnerOnly', event.target.value)}>
                <option value="">不限</option>
                <option value="true">只看合作项目</option>
                <option value="false">只看普通项目</option>
              </select>
            </label>
          </>
        ) : null}
        {mode === 'cases' ? (
          <>
            <label className="v2-field">
              <span>录取结果</span>
              <select value={filters.result || ''} onChange={(event) => updateField('result', event.target.value)}>
                <option value="">全部</option>
                {studyAbroadResultOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="v2-field">
              <span>本科专业</span>
              <input value={filters.major || ''} onChange={(event) => updateField('major', event.target.value)} />
            </label>
          </>
        ) : null}
        {mode === 'experiences' ? (
          <label className="v2-field">
            <span>主题</span>
            <select value={filters.topic || ''} onChange={(event) => updateField('topic', event.target.value)}>
              <option value="">全部</option>
              {studyAbroadTopicOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="v2-field">
          <span>关键词</span>
          <input value={filters.keyword || ''} onChange={(event) => updateField('keyword', event.target.value)} />
        </label>
        <div className="v2-inline-actions">
          <button className="v2-primary-link" type="submit">应用筛选</button>
          <button className="v2-secondary-link" type="button" onClick={onReset}>重置</button>
        </div>
      </form>
    </section>
  )
}
