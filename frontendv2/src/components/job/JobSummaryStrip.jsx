export default function JobSummaryStrip({ items = [] }) {
  return (
    <section className="v2-summary-strip v2-employment-summary-strip">
      {items.map((item) => (
        <article className="v2-summary-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.note ? <p>{item.note}</p> : null}
        </article>
      ))}
    </section>
  )
}
