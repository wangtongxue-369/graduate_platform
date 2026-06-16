const roleTypeOptions = ['不限', '后端', '前端', '产品', '运营']
const industryOptions = ['不限', '教育科技', '互联网', '制造业', '金融科技']

export default function JobRecommendationFilters({ filters, onChange, onReset }) {
  function updateField(key, value) {
    onChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="v2-side-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">筛选台</p>
          <h3>把高频条件固定在右栏</h3>
        </div>
        <button className="v2-secondary-link" type="button" onClick={onReset}>重置</button>
      </div>

      <form className="v2-filter-form" onSubmit={(event) => event.preventDefault()}>
        <label className="v2-field">
          <span>关键词</span>
          <input
            type="text"
            placeholder="岗位、企业、描述"
            value={filters.keyword}
            onChange={(event) => updateField('keyword', event.target.value)}
          />
        </label>
        <label className="v2-field">
          <span>城市</span>
          <input
            type="text"
            placeholder="上海 / 杭州"
            value={filters.city}
            onChange={(event) => updateField('city', event.target.value)}
          />
        </label>
        <label className="v2-field">
          <span>岗位类型</span>
          <div className="v2-segment-group" role="group" aria-label="岗位类型">
            {roleTypeOptions.map((item) => (
              <button
                key={item}
                className={`v2-segment-button ${filters.roleType === (item === '不限' ? '' : item) ? 'is-active' : ''}`}
                type="button"
                onClick={() => updateField('roleType', item === '不限' ? '' : item)}
              >
                {item}
              </button>
            ))}
          </div>
        </label>
        <label className="v2-field">
          <span>行业</span>
          <div className="v2-segment-group" role="group" aria-label="行业">
            {industryOptions.map((item) => (
              <button
                key={item}
                className={`v2-segment-button ${filters.industry === (item === '不限' ? '' : item) ? 'is-active' : ''}`}
                type="button"
                onClick={() => updateField('industry', item === '不限' ? '' : item)}
              >
                {item}
              </button>
            ))}
          </div>
        </label>
        <label className="v2-field">
          <span>技能关键词</span>
          <input
            type="text"
            placeholder="Java, Spring Boot"
            value={filters.skills}
            onChange={(event) => updateField('skills', event.target.value)}
          />
        </label>
        <label className="v2-field">
          <span>只看可投递</span>
          <div className="v2-segment-group" role="group" aria-label="只看可投递">
            {[
              { value: false, label: '全部' },
              { value: true, label: '可投递' },
            ].map((item) => (
              <button
                key={item.label}
                className={`v2-segment-button ${filters.onlyApplyable === item.value ? 'is-active' : ''}`}
                type="button"
                onClick={() => updateField('onlyApplyable', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </label>
      </form>
    </section>
  )
}
