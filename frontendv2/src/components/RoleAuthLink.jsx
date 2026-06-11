import { Link, useLocation } from 'react-router-dom'

export default function RoleAuthLink({ children, state, to = '/login', ...props }) {
  const location = useLocation()

  return (
    <Link
      {...props}
      state={{
        ...(state || {}),
        backgroundLocation: location,
      }}
      to={to}
    >
      {children}
    </Link>
  )
}
