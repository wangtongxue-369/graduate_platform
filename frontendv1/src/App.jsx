import { Route, Routes } from 'react-router-dom'
import PublicShell from '@/layouts/PublicShell.jsx'

function GuestBootstrapPage() {
  return <h1>frontendv1 public station bootstrap</h1>
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<GuestBootstrapPage />} />
      </Route>
    </Routes>
  )
}
