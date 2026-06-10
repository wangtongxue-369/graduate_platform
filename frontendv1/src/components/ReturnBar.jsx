import { Link } from 'react-router-dom'

export default function ReturnBar({ to, label, hint }) {
  return (
    <div className="v1-return-bar" role="navigation" aria-label="返回路径">
      <Link className="v1-return-link" to={to}>
        {label}
      </Link>
      {hint ? <span className="v1-return-hint">{hint}</span> : null}
    </div>
  )
}
