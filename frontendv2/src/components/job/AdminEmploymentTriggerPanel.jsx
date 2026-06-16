export default function AdminEmploymentTriggerPanel({
  sources = [],
  selectedSource,
  onSelectSource,
  onTrigger,
}) {
  return (
    <section className="v2-side-card v2-practice-drawer" data-testid="admin-employment-trigger-panel">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">提醒触发</p>
          <h3>在明确上下文后再发一轮提醒</h3>
        </div>
      </div>

      <div className="v2-check-list">
        {sources.map((item) => (
          <article className="v2-check-row" key={`${item.relatedType}-${item.id}`}>
            <button className="v2-secondary-link" type="button" onClick={() => onSelectSource(item)}>
              {item.title}
            </button>
            <span>{item.relatedType === 'FAIR' ? '招聘会' : '岗位'}</span>
          </article>
        ))}
      </div>

      {selectedSource ? (
        <div className="v2-check-list">
          <article className="v2-check-row">
            <strong>当前上下文</strong>
            <span>{selectedSource.relatedType === 'FAIR' ? '招聘会' : '岗位'} / {selectedSource.title}</span>
          </article>
        </div>
      ) : (
        <p>请先选择提醒上下文。</p>
      )}

      <div className="v2-inline-actions">
        <button className="v2-primary-link" type="button" onClick={onTrigger} disabled={!selectedSource}>触发提醒</button>
      </div>
    </section>
  )
}
