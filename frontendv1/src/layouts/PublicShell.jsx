import { Outlet } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader.jsx'

export default function PublicShell() {
  return (
    <div className="v1-app v1-app--public">
      <SiteHeader role="guest" />
      <main className="v1-shell">
        <Outlet />
      </main>
    </div>
  )
}
