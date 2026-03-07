import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import App from './App.jsx'
import './locales/i18n.js'

createRoot(document.getElementById('root')).render(
    <App />,
)
