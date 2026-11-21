import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MaintenanceOverlay from './components/common/MaintenanceOverlay.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <MaintenanceOverlay />
  </StrictMode>,
)
