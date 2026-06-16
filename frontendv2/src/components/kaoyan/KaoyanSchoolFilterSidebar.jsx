function renderTriStateOptions(activeValue, onChange) {
  return (
    <div className="v2-segment-group">
      {[
        { value: '', label: '不限' },
        { value: 'true', label: '是' },
        { value: 'false', label: '否' },
      ].map((item) => (
        <button
          key={item.value || 'all'}
          className={`v2-segment-button ${activeValue === item.value ? 'is-active' : ''}`}
          type="button"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function renderSelectOptions(options) {
  return [
    <option key="all" value="">全部</option>,
    ...options.map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    )),
  ]
}

export default function KaoyanSchoolFilterSidebar({
  draftFilters,
  regionOptions = [],
  majorCategoryOptions = [],
  yearOptions = [],
  onChange,
  onApply,
  onClear,
}) {
  return (
    <section className="v2-side-card">
      <p className="v2-kicker">筛选控制器</p>
      <form className="v2-filter-form" onSubmit={onApply}>
        <div className="v2-ledger-filter-group">
          <h3>关键词检索</h3>
          <label className="v2-field">
            <span>院校名称</span>
            <input
              value={draftFilters.schoolName}
              onChange={(event) => onChange('schoolName', event.target.value)}
              placeholder="如：浙江大学"
            />
          </label>
          <label className="v2-field">
            <span>具体专业</span>
            <input
              value={draftFilters.majorName}
              onChange={(event) => onChange('majorName', event.target.value)}
              placeholder="如：计算机科学与技术"
            />
          </label>
        </div>

        <div className="v2-ledger-filter-group">
          <h3>基础筛选</h3>
          <label className="v2-field">
            <span>地区</span>
            <select
              value={draftFilters.region}
              onChange={(event) => onChange('region', event.target.value)}
            >
              {renderSelectOptions(regionOptions)}
            </select>
          </label>
          <label className="v2-field">
            <span>专业门类</span>
            <select
              value={draftFilters.majorCategory}
              onChange={(event) => onChange('majorCategory', event.target.value)}
            >
              {renderSelectOptions(majorCategoryOptions)}
            </select>
          </label>
          <label className="v2-field">
            <span>年份</span>
            <select
              value={draftFilters.year}
              onChange={(event) => onChange('year', event.target.value)}
            >
              {renderSelectOptions(yearOptions)}
            </select>
          </label>
        </div>

        <div className="v2-ledger-filter-group">
          <h3>院校标签</h3>
          <label className="v2-field">
            <span>985</span>
            {renderTriStateOptions(draftFilters.is985, (value) => onChange('is985', value))}
          </label>
          <label className="v2-field">
            <span>211</span>
            {renderTriStateOptions(draftFilters.is211, (value) => onChange('is211', value))}
          </label>
          <label className="v2-field">
            <span>双一流</span>
            {renderTriStateOptions(
              draftFilters.isDoubleFirstClass,
              (value) => onChange('isDoubleFirstClass', value),
            )}
          </label>
        </div>

        <div className="v2-ledger-filter-actions">
          <button className="v2-segment-button is-active" type="submit">应用筛选</button>
          <button className="v2-segment-button" type="button" onClick={onClear}>清空条件</button>
        </div>
      </form>
    </section>
  )
}
