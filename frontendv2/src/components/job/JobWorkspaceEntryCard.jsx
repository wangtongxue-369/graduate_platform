import { Link } from 'react-router-dom'

export default function JobWorkspaceEntryCard({ kicker, title, description, to, rows = [] }) {
  return (
    <Link className="v2-preview-panel v2-employment-workspace-card" to={to}>
      <div className="v2-preview-panel__head">
        <div>
          <p className="v2-kicker">{kicker}</p>
          <strong>{title}</strong>
        </div>
        <span className="v2-feed-action">进入</span>
      </div>
      {description ? <p>{description}</p> : null}
      <div className="v2-preview-panel__rows">
        {rows.map((row) => (
          <div className="v2-preview-row" key={row.label}>
            <strong>{row.label}</strong>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
    </Link>
  )
}
