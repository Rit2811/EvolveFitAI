import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppShell from './components/AppShell'
import FullPageLoader from './components/FullPageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/PublicLayout'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'

const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const PlanGenerationPage = lazy(() => import('./pages/PlanGenerationPage'))
const CheckInPage = lazy(() => import('./pages/CheckInPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const CoachPage = lazy(() => import('./pages/CoachPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

export default function App() {
  return <Suspense fallback={<FullPageLoader label="Loading page" />}><Routes>
    <Route element={<PublicLayout />}><Route index element={<HomePage />} /><Route element={<PublicOnlyRoute />}><Route path="login" element={<AuthPage mode="login" />} /><Route path="register" element={<AuthPage mode="register" />} /></Route></Route>
    <Route element={<ProtectedRoute allowIncomplete />}><Route element={<AppShell />}><Route path="onboarding" element={<OnboardingPage />} /></Route></Route>
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="dashboard" element={<DashboardPage />} /><Route path="plan" element={<PlanGenerationPage />} /><Route path="check-in" element={<CheckInPage />} /><Route path="progress" element={<ProgressPage />} /><Route path="coach" element={<CoachPage />} /><Route path="profile" element={<ProfilePage />} /></Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}
