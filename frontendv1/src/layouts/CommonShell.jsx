import { Outlet } from 'react-router-dom'
import SiteHeader from '@/components/SiteHeader.jsx'

export default function CommonShell() {
  return (
    <div className="v1-app v1-app--common">
      <SiteHeader role="common" />
      <main className="v1-shell v1-shell--common">
        <Outlet />
      </main>
    </div>
  )
}
