import { createBrowserRouter, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/Register'
import LoginPage from '@/pages/auth/Login'
import ForgotPasswordPage from '@/pages/auth/ForgotPassword'
import BuyerDashboard from '@/pages/BuyerDashboard'
import BreederDashboard from '@/pages/BreederDashboard'
import AdminDashboard from '@/pages/AdminDashboard'
import SitterDashboard from '@/pages/SitterDashboard'
import BuyerInquiries from '@/pages/stubs/BuyerInquiries'
import BuyerReviews from '@/pages/stubs/BuyerReviews'
import BreederListings from '@/pages/stubs/BreederListings'
import BreederInquiries from '@/pages/stubs/BreederInquiries'
import BreederVerification from '@/pages/stubs/BreederVerification'
import BreederDocuments from '@/pages/stubs/BreederDocuments'
import AdminVerificationQueue from '@/pages/stubs/AdminVerificationQueue'
import AdminUsers from '@/pages/stubs/AdminUsers'
import AdminListings from '@/pages/stubs/AdminListings'
import ProfilePage from '@/pages/stubs/ProfilePage'
import BreederProfilePage from '@/pages/BreederProfile'
import SitterProfilePage from '@/pages/SitterProfile'
import CreateListingPage from '@/pages/breeder/CreateListingPage'
import SearchPage from '@/pages/Search'
import ListingDetailPage from '@/pages/ListingDetail'
import { ProtectedRoute, AdminRoute } from '@/components/common/ProtectedRoute'
import { useAuthStore } from '@/store/authStore'

const DASHBOARD_ROUTES: Record<string, string> = {
  buyer: '/buyer/dashboard',
  breeder: '/breeder/dashboard',
  sitter: '/sitter/dashboard',
  admin: '/admin',
}

function RedirectIfAuth({ element }: { element: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  if (token && user) {
    return <Navigate to={DASHBOARD_ROUTES[user.role] ?? '/'} replace />
  }
  return <>{element}</>
}

function DashboardRedirect() {
  const user = useAuthStore((s) => s.user)
  return <Navigate to={DASHBOARD_ROUTES[user?.role ?? ''] ?? '/'} replace />
}

const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <div>PawTrust Home</div> },
  { path: '/search', element: <SearchPage /> },
  { path: '/sitters', element: <div>Pet Sitters — coming soon</div> },
  { path: '/sitters/:id', element: <SitterProfilePage /> },
  { path: '/breeders/:id', element: <BreederProfilePage /> },
  { path: '/listings/:id', element: <ListingDetailPage /> },
  { path: '/register', element: <RedirectIfAuth element={<RegisterPage />} /> },
  { path: '/login', element: <RedirectIfAuth element={<LoginPage />} /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  // Protected routes (require valid token)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/buyer/dashboard', element: <BuyerDashboard /> },
      { path: '/dashboard/buyer', element: <BuyerDashboard /> },
      { path: '/dashboard', element: <DashboardRedirect /> },
      { path: '/breeder/dashboard', element: <BreederDashboard /> },
      { path: '/dashboard/breeder/inquiries', element: <BreederDashboard /> },
      { path: '/sitter/dashboard', element: <SitterDashboard /> },
      { path: '/profile', element: <ProfilePage /> },
      // Buyer sub-routes
      { path: '/buyer/inquiries', element: <BuyerInquiries /> },
      { path: '/buyer/reviews', element: <BuyerReviews /> },
      // Breeder sub-routes
      { path: '/breeder/listings', element: <BreederListings /> },
      { path: '/breeder/inquiries', element: <BreederInquiries /> },
      { path: '/breeder/verification', element: <BreederVerification /> },
      { path: '/breeder/documents', element: <BreederDocuments /> },
      { path: '/breeder/listings/new', element: <CreateListingPage /> },
      { path: '/breeder/listings/:id/edit', element: <div>Edit Listing — coming soon</div> },
    ],
  },

  // Admin-only routes
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/verification', element: <AdminVerificationQueue /> },
      { path: '/admin/users', element: <AdminUsers /> },
      { path: '/admin/listings', element: <AdminListings /> },
    ],
  },
])

export default router
