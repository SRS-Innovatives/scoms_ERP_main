import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MaintenanceOverlay from './components/common/MaintenanceOverlay.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <MaintenanceOverlay />
  </React.StrictMode>,
)
