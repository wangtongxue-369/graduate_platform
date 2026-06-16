export default function AdminEmploymentSourceList({
  title,
  items = [],
  selectedId,
  onSelect,
  emptyText = '当前没有可操作的对象。',
  variant = 'side',
}) {
  const selectedKey = selectedId == null ? null : String(selectedId)

  function getItemKey(item, index) {
    return item.id ?? item.studentId ?? item.name ?? item.title ?? `item-${index}`
  }

  function isSelected(item, index) {
    return selectedKey != null && selectedKey === String(getItemKey(item, index))
  }

  if (variant === 'main') {
    return (
      <section className="v2-feed-list v2-admin-employment-source-list" aria-label={title}>
        {items.map((item, index) => (
          <article className="v2-feed-item" key={getItemKey(item, index)}>
            <div className="v2-feed-index">{String(item.title || item.name || getItemKey(item, index)).slice(0, 2)}</div>
            <div className="v2-feed-body">
              <button
                className="v2-admin-employment-title-button"
                type="button"
                onClick={() => onSelect(item)}
              >
                {item.title || item.name}
              </button>
              <p>{item.companyName || item.school || item.city || '待补充信息'}</p>
              <p>{item.industry || item.major || item.roleType || item.studentId || ''}</p>
            </div>
            <div className="v2-feed-side">
              <button
                className={`v2-secondary-link ${isSelected(item, index) ? 'is-active' : ''}`}
                type="button"
                onClick={() => onSelect(item)}
              >
                {isSelected(item, index) ? '已选中' : '选择'}
              </button>
            </div>
          </article>
        ))}
        {!items.length ? <p className="v2-admin-employment-empty">{emptyText}</p> : null}
      </section>
    )
  }

  return (
    <section className="v2-side-card">
      <div className="v2-side-card__head">
        <div>
          <p className="v2-kicker">对象列表</p>
          <h3>{title}</h3>
        </div>
        <span className="v2-note-text">{items.length}</span>
      </div>

      <div className="v2-check-list">
        {items.map((item, index) => (
          <article className="v2-check-row" key={getItemKey(item, index)}>
            <button
              className={`v2-secondary-link ${isSelected(item, index) ? 'is-active' : ''}`}
              type="button"
              onClick={() => onSelect(item)}
            >
              {item.title || item.name}
            </button>
            <span>{item.companyName || item.school || item.city || '待补充信息'}</span>
            <span>{item.industry || item.major || item.roleType || item.studentId || ''}</span>
          </article>
        ))}
        {!items.length ? <p>{emptyText}</p> : null}
      </div>
    </section>
  )
}
