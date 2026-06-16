export default function PracticeModePanel({
  title = '练习模式',
  modes = [],
  value,
  onChange,
  summaryItems = [],
  lead,
  actions,
}) {
  return (
    <section className="v2-article-card v2-practice-card">
      <div className="v2-section-head">
        <div>
          <p className="v2-kicker">{title}</p>
          <h3>先定练习方式，再进入会话</h3>
        </div>
        {actions}
      </div>
      {lead ? <p>{lead}</p> : null}

      <div className="v2-segment-group" role="group" aria-label="练习模式">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={`v2-segment-button ${value === mode.value ? 'is-active' : ''}`}
            onClick={() => onChange?.(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {summaryItems.length ? (
        <div className="v2-practice-stats-grid">
          {summaryItems.map((item) => (
            <article className="v2-summary-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.note ? <p>{item.note}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}
