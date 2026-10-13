import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import router from './router'
import { useAuthStore } from './store/authStore'
import { getMe } from './api/auth.api'
import { Footer } from '@/components/layout/Footer'
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner'
import './i18n'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// On boot, validate stored token and refresh user data
;(async () => {
  const { token } = useAuthStore.getState()
  if (token) {
    try {
      const { data } = await getMe()
      useAuthStore.setState({ user: data.data })
    } catch {
      // Token expired or invalid — clear auth state
      useAuthStore.setState({ token: null, user: null })
    }
  }
})()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Footer />
        <CookieConsentBanner />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
)
