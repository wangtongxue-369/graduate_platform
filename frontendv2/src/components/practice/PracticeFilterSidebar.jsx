export default function PracticeFilterSidebar({
  title = '筛选控制器',
  fields,
  actions,
  note,
}) {
  return (
    <aside className="v2-side-column">
      <section className="v2-side-card v2-practice-sidebar">
        <p className="v2-kicker">{title}</p>
        <div className="v2-filter-form">{fields}</div>
        {note ? <p className="v2-note-text">{note}</p> : null}
        {actions ? <div className="v2-inline-actions">{actions}</div> : null}
      </section>
    </aside>
  )
}
