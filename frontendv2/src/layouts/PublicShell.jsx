import { Outlet } from 'react-router-dom'

export default function PublicShell() {
  return (
    <div className="v2-app">
      <Outlet />
    </div>
  )
}
