import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/routes'
import { ErrorBoundary } from './app/components/ErrorBoundary'
import { AsyncErrorBoundary } from './app/components/ErrorBoundary'
import { Toaster } from 'sonner'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Root error boundary caught:', error, errorInfo);
    }}>
      <AsyncErrorBoundary>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </AsyncErrorBoundary>
    </ErrorBoundary>
  </StrictMode>,
)
