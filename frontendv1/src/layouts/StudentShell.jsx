import { Outlet } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader.jsx'

export default function StudentShell() {
  return (
    <div className="v1-app v1-app--student">
      <SiteHeader role="student" />
      <main className="v1-shell v1-shell--station">
        <Outlet />
      </main>
    </div>
  )
}
