export default function AdminEmploymentSourceList({
  title,
  items = [],
  selectedId,
  onSelect,
  emptyText = '当前没有可操作的对象。',
}) {
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
        {items.map((item) => (
          <article className="v2-check-row" key={item.id}>
            <button
              className={`v2-secondary-link ${selectedId === item.id ? 'is-active' : ''}`}
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
