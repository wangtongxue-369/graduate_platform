import { NavLink } from 'react-router-dom'

export default function SubnavTabs({ items, compact = false }) {
  return (
    <nav
      aria-label="页面分区导航"
      className={`v2-route-tabs ${compact ? 'v2-route-tabs--compact' : ''}`}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `v2-route-tab ${isActive ? 'is-active' : ''}`}
        >
          <span>{item.label}</span>
          {item.note ? <small>{item.note}</small> : null}
        </NavLink>
      ))}
    </nav>
  )
}
