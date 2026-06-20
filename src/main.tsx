import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import './styles.css'

const queryClient = new QueryClient()

// Apply stored theme before first paint to avoid flash
const stored = localStorage.getItem('fitnexia_admin_theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const initialDark =
  stored === 'dark' || (stored !== 'light' && (stored === 'system' || !stored) && prefersDark)
document.documentElement.dataset.theme = initialDark ? 'dark' : 'light'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

