import { Link } from 'react-router-dom'

export default function StageRail({ ariaLabel, items = [] }) {
  return (
    <nav className="v1-stage-rail" aria-label={ariaLabel}>
      <ol className="v1-stage-rail-list">
        {items.map((item, index) => {
          const content = (
            <>
              <span className="v1-stage-rail-index">{item.index || String(index + 1).padStart(2, '0')}</span>
              <div className="v1-stage-rail-copy">
                <strong>{item.label}</strong>
                {item.hint ? <small>{item.hint}</small> : null}
              </div>
            </>
          )

          return (
            <li
              className={[
                'v1-stage-rail-item',
                item.current ? 'is-current' : '',
                item.done ? 'is-done' : '',
              ].filter(Boolean).join(' ')}
              key={item.key || `${item.label}-${index}`}
            >
              {item.to ? (
                <Link className="v1-stage-rail-link" to={item.to}>
                  {content}
                </Link>
              ) : (
                <div className="v1-stage-rail-link v1-stage-rail-link--static">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
