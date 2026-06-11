import { Link } from 'react-router-dom'

export default function WorkspaceSidebar({
  badge = 'GP',
  kicker,
  title,
  description,
  metrics = [],
  navItems = [],
  currentPath = '',
  footer,
}) {
  return (
    <aside className="v2-sidebar">
      <section className="v2-sidebar-card v2-sidebar-card--profile">
        <span className="v2-sidebar-avatar" aria-hidden="true">{badge}</span>
        {kicker ? <p className="v2-sidebar-kicker">{kicker}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}

        {metrics.length ? (
          <div className="v2-sidebar-pills">
            {metrics.map((item) => (
              <span key={`${item.label}-${item.value}`}>
                <strong>{item.value}</strong>
                <small>{item.label}</small>
              </span>
            ))}
          </div>
        ) : null}

        {footer}
      </section>

      {navItems.length ? (
        <nav className="v2-sidebar-card v2-sidebar-nav" aria-label={`${title}导航`}>
          {navItems.map((item) => {
            const isCurrent = currentPath === item.to
            return (
              <Link
                key={item.to}
                className={`v2-sidebar-nav-item ${isCurrent ? 'is-current' : ''}`}
                to={item.to}
              >
                <strong>{item.label}</strong>
                <span>{item.summary}</span>
              </Link>
            )
          })}
        </nav>
      ) : null}
    </aside>
  )
}
