import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@legacy/context/AuthContext.jsx'
import App from './App.jsx'
import './index.css'
import { ROUTER_FUTURE_FLAGS } from './routerFuture.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={ROUTER_FUTURE_FLAGS}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
