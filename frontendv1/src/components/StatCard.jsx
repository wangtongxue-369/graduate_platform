export default function StatCard({ label, value, tone = 'default' }) {
  return (
    <article className={`v1-stat-card v1-stat-card--${tone}`}>
      <span className="v1-stat-label">{label}</span>
      <strong className="v1-stat-value">{value}</strong>
    </article>
  )
}
