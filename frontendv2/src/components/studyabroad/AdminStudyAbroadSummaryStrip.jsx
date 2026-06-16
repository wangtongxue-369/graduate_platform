export default function AdminStudyAbroadSummaryStrip({ items = [] }) {
  return (
    <section className="v2-summary-strip" aria-label="留学管理摘要">
      {items.map((item) => (
        <article className="v2-summary-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.note}</p>
        </article>
      ))}
    </section>
  )
}
