import { Route, Routes } from 'react-router-dom'

function GuestBootstrapPage() {
  return <h1>frontendv1 public station bootstrap</h1>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestBootstrapPage />} />
    </Routes>
  )
}
