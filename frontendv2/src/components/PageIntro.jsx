import { Link } from 'react-router-dom'

export default function PageIntro({
  kicker,
  title,
  lead,
  actions,
  pathItems = [],
  compact = false,
}) {
  return (
    <section className={`v2-article-card v2-article-card--feature ${compact ? 'v2-page-intro--compact' : ''}`}>
      {pathItems.length ? (
        <nav aria-label="页面路径" className="v2-page-trail">
          {pathItems.map((item, index) => (
            <span className="v2-page-trail__item" key={`${item.label}-${index}`}>
              {item.to ? (
                <Link className="v2-page-trail__link" to={item.to}>{item.label}</Link>
              ) : (
                <span className="v2-page-trail__current">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      {kicker ? <p className="v2-kicker">{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className="v2-lead">{lead}</p> : null}
      {actions ? <div className="v2-inline-actions">{actions}</div> : null}
    </section>
  )
}
