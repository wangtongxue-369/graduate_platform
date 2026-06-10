import { Outlet } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader.jsx'

export default function AdminShell() {
  return (
    <div className="v1-app v1-app--admin">
      <SiteHeader role="admin" />
      <main className="v1-shell v1-shell--admin">
        <Outlet />
      </main>
    </div>
  )
}
