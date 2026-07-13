import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth'
import FullPageLoader from './FullPageLoader'

export default function PublicOnlyRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={profile?.onboarding_completed ? '/dashboard' : '/onboarding'} replace />
  return <Outlet />
}
