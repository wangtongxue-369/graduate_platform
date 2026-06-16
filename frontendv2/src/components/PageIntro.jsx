import { Link } from 'react-router-dom'

export default function PageIntro({
  kicker,
  title,
  lead,
  actions,
  pathItems = [],
  compact = false,
  kickerAsTitle = false,
}) {
  const sectionClassName = [
    'v2-article-card',
    'v2-article-card--feature',
    compact ? 'v2-page-intro--compact' : '',
    kickerAsTitle ? 'v2-article-card--page-title' : '',
  ].filter(Boolean).join(' ')
  const kickerClassName = [
    'v2-kicker',
    kickerAsTitle ? 'v2-kicker--page-title' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={sectionClassName}>
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
      {kicker ? (
        kickerAsTitle
          ? <h1 className={kickerClassName}>{kicker}</h1>
          : <p className={kickerClassName}>{kicker}</p>
      ) : null}
      {title ? <h1>{title}</h1> : null}
      {lead ? <p className="v2-lead">{lead}</p> : null}
      {actions ? <div className="v2-inline-actions">{actions}</div> : null}
    </section>
  )
}
