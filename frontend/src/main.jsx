import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ColorModeProvider } from './components/ColorModeProvider'
import './index.css'
import App from './App.jsx'
import { logger } from './logger'

window.onerror = (msg, source, line, col, err) => {
  logger.error('Uncaught error', { message: msg, source, line, col, stack: err?.stack })
}

window.onunhandledrejection = (e) => {
  logger.error('Unhandled promise rejection', { reason: e.reason?.message, stack: e.reason?.stack })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeProvider>
      <App />
    </ColorModeProvider>
  </StrictMode>,
)
