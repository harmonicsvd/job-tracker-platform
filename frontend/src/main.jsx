import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
       

<Toaster
  position="top-right"
  toastOptions={{
    duration: 10000,
    style: {
      background: '#17231F',
      color: '#FFFFFF',
      borderRadius: '10px',
      padding: '14px 16px',
      maxWidth: '420px',
      width: 'min(420px, calc(100vw - 32px))',
    },
    success: {
      duration: 5000,
    },
    error: {
      duration: 10000,
    },
  }}
>
  {(t) => (
    <ToastBar toast={t}>
      {({ message }) => (
        <div className="flex items-start gap-3 w-full">

          {/* Custom status icon */}
          {t.type === 'error' ? (
            <AlertCircle
              size={21}
              color="#F4B58E"
              className="shrink-0"
            />
          ) : (
            <CheckCircle2
              size={21}
              color="#A8C7A7"
              className="shrink-0"
            />
          )}

          {/* Notification content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              {t.id === 'gmail-quota-exceeded'
                ? 'Gmail quota exceeded'
                : t.id === 'groq-quota-exceeded'
                ? 'Groq quota exceeded'
                : t.type === 'success'
                ? 'Sync complete'
                : 'Something went wrong'}
            </p>

            <div className="text-xs text-white/70 mt-1">
              {message}
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Close notification"
            className="shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X size={17} />
          </button>

        </div>
      )}
    </ToastBar>
  )}
</Toaster>


      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)