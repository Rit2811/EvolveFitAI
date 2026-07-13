import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'
import FullPageLoader from './FullPageLoader'

export default function ProtectedRoute({ allowIncomplete = false }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!allowIncomplete && !profile?.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
