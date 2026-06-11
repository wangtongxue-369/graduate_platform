import { Link } from 'react-router-dom'

export default function ReturnBar({ to, label, hint, items = [] }) {
  const crumbs = items.length
    ? items
    : [{ label, to }]

  return (
    <div className="v1-return-bar" role="navigation" aria-label="返回路径">
      <div className="v1-return-crumbs">
        {crumbs.map((item, index) => (
          item?.to ? (
            <Link className="v1-return-link" key={`${item.label}-${index}`} to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span className="v1-return-current" key={`${item?.label || 'current'}-${index}`}>
              {item?.label}
            </span>
          )
        ))}
      </div>
      {hint ? <span className="v1-return-hint">{hint}</span> : null}
    </div>
  )
}
