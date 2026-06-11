import { Outlet } from 'react-router-dom'
import HugoStackSidebar from '@/components/HugoStackSidebar.jsx'

export default function CommonShell() {
  return (
    <div className="v2-app">
      <div className="v2-shell v2-shell--stack">
        <HugoStackSidebar mode="app" />
        <main className="v2-stack-frame">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
