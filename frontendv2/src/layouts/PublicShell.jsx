import { Outlet } from 'react-router-dom'
import { ThemePreferenceSync } from '@/components/ThemeSwitch.jsx'

export default function PublicShell() {
  return (
    <div className="v2-app">
      <ThemePreferenceSync />
      <Outlet />
    </div>
  )
}
