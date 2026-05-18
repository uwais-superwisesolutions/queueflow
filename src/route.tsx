import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom'
import AppLayout from '@/layouts/app-layout'
import GuestLayout from '@/layouts/guest-layout'

// Marketing
const LandingScreen     = lazy(() => import('@/features/marketing/landing').then(m => ({ default: m.LandingScreen })))
const SignUpScreen       = lazy(() => import('@/features/marketing/sign-up').then(m => ({ default: m.SignUpScreen })))
const LoginScreen        = lazy(() => import('@/features/marketing/login').then(m => ({ default: m.LoginScreen })))
const AcceptInviteScreen = lazy(() => import('@/features/marketing/accept-invite').then(m => ({ default: m.AcceptInviteScreen })))

// Onboarding
const OnboardingScreen   = lazy(() => import('@/features/onboarding/onboarding').then(m => ({ default: m.OnboardingScreen })))

// SuperUser
const SuperUserDashboard = lazy(() => import('@/features/superuser/dashboard').then(m => ({ default: m.SuperUserDashboard })))

// OrgUser
const OrgUserClaimScreen = lazy(() => import('@/features/orguser/seat-claim').then(m => ({ default: m.OrgUserClaimScreen })))
const OrgUserQueueScreen = lazy(() => import('@/features/orguser/live-queue').then(m => ({ default: m.OrgUserQueueScreen })))
const AvailabilityView   = lazy(() => import('@/features/orguser/availability').then(m => ({ default: m.AvailabilityView })))

// Client
const ClientPhoneScreen       = lazy(() => import('@/features/client/phone').then(m => ({ default: m.ClientPhoneScreen })))
const ClientOTPScreen         = lazy(() => import('@/features/client/otp').then(m => ({ default: m.ClientOTPScreen })))
const ClientNewDetailsScreen  = lazy(() => import('@/features/client/new-details').then(m => ({ default: m.ClientNewDetailsScreen })))
const ClientReturningScreen   = lazy(() => import('@/features/client/returning').then(m => ({ default: m.ClientReturningScreen })))
const ClientSlotPickerScreen  = lazy(() => import('@/features/client/slot-picker').then(m => ({ default: m.ClientSlotPickerScreen })))
const ClientConfirmationScreen = lazy(() => import('@/features/client/confirmation').then(m => ({ default: m.ClientConfirmationScreen })))
const ClientStatusScreen      = lazy(() => import('@/features/client/status').then(m => ({ default: m.ClientStatusScreen })))
const ClientRejectionScreen   = lazy(() => import('@/features/client/rejection').then(m => ({ default: m.ClientRejectionScreen })))

// System
const EmptyStatesScreen    = lazy(() => import('@/features/system/empty-states').then(m => ({ default: m.EmptyStatesScreen })))
const LoadingSkeletonScreen = lazy(() => import('@/features/system/loading-skeleton').then(m => ({ default: m.LoadingSkeletonScreen })))
const ErrorStateScreen     = lazy(() => import('@/features/system/error-state').then(m => ({ default: m.ErrorStateScreen })))
const SmsPreviewScreen     = lazy(() => import('@/features/system/sms-preview').then(m => ({ default: m.SmsPreviewScreen })))

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex items-center gap-[3px]">
        {[3, 4, 5, 6, 7].map((d, i) => (
          <span
            key={i}
            className="rounded-full animate-qf-pulse"
            style={{
              width: d, height: d,
              background: i === 3 ? 'var(--teal)' : 'var(--ink)',
              opacity: i === 3 ? 1 : 0.25 + i * 0.15,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function wrap(el: ReactNode) {
  return <Suspense fallback={<Loader />}>{el}</Suspense>
}

// Route wrappers — supply navigation handlers to feature screens
function LandingRoute() {
  const navigate = useNavigate()
  return <LandingScreen onCta={() => navigate('/signup')} onSignIn={() => navigate('/login')} />
}
function SignUpRoute() {
  const navigate = useNavigate()
  return <SignUpScreen onSubmit={() => navigate('/onboarding')} onSignIn={() => navigate('/login')} />
}
function LoginRoute() {
  const navigate = useNavigate()
  return <LoginScreen onSubmit={() => navigate('/dashboard')} onSignUp={() => navigate('/signup')} />
}
function AcceptInviteRoute() {
  const navigate = useNavigate()
  return <AcceptInviteScreen onSubmit={() => navigate('/claim')} />
}
function OnboardingRoute() {
  const navigate = useNavigate()
  return <OnboardingScreen onFinish={() => navigate('/dashboard')} onExit={() => navigate('/')} />
}
function OrgUserClaimRoute() {
  const navigate = useNavigate()
  return <OrgUserClaimScreen onClaim={() => navigate('/queue')} />
}
function ClientPhoneRoute() {
  const navigate = useNavigate()
  return <ClientPhoneScreen onContinue={() => navigate('/client/otp')} />
}
function ClientOTPRoute() {
  const navigate = useNavigate()
  return <ClientOTPScreen onContinue={() => navigate('/client/details')} onBack={() => navigate('/client')} />
}
function ClientNewDetailsRoute() {
  const navigate = useNavigate()
  return <ClientNewDetailsScreen onContinue={() => navigate('/client/slots')} onBack={() => navigate('/client/otp')} />
}
function ClientReturningRoute() {
  const navigate = useNavigate()
  return <ClientReturningScreen onContinue={() => navigate('/client/slots')} onBack={() => navigate('/client/otp')} />
}
function ClientSlotPickerRoute() {
  const navigate = useNavigate()
  return <ClientSlotPickerScreen onSelect={() => navigate('/client/confirm')} onBack={() => navigate('/client/details')} />
}
function ClientConfirmationRoute() {
  const navigate = useNavigate()
  return <ClientConfirmationScreen onApproved={() => navigate('/client/status')} onPickAnother={() => navigate('/client/slots')} />
}
function ClientStatusRoute() {
  const navigate = useNavigate()
  return <ClientStatusScreen onCancel={() => navigate('/')} />
}
function ClientRejectionRoute() {
  const navigate = useNavigate()
  return <ClientRejectionScreen onPickAnother={() => navigate('/client/slots')} onCancel={() => navigate('/')} />
}

const router = createBrowserRouter([
  // Marketing / auth (guest layout)
  {
    element: <GuestLayout />,
    children: [
      { path: '/',               element: wrap(<LandingRoute />) },
      { path: '/signup',         element: wrap(<SignUpRoute />) },
      { path: '/login',          element: wrap(<LoginRoute />) },
      { path: '/accept-invite',  element: wrap(<AcceptInviteRoute />) },
    ],
  },

  // Authenticated app (app layout)
  {
    element: <AppLayout />,
    children: [
      // Onboarding
      { path: '/onboarding', element: wrap(<OnboardingRoute />) },

      // SuperUser dashboard + sub-pages
      { path: '/dashboard',            element: wrap(<SuperUserDashboard initialPage="dashboard" />) },
      { path: '/dashboard/users',      element: wrap(<SuperUserDashboard initialPage="orgusers" />) },
      { path: '/dashboard/seats',      element: wrap(<SuperUserDashboard initialPage="seats" />) },
      { path: '/dashboard/timeslots',  element: wrap(<SuperUserDashboard initialPage="timeslots" />) },
      { path: '/dashboard/links',      element: wrap(<SuperUserDashboard initialPage="links" />) },
      { path: '/dashboard/analytics',  element: wrap(<SuperUserDashboard initialPage="analytics" />) },

      // OrgUser
      { path: '/claim',        element: wrap(<OrgUserClaimRoute />) },
      { path: '/queue',        element: wrap(<OrgUserQueueScreen />) },
      { path: '/queue/dark',   element: wrap(<OrgUserQueueScreen darkExample />) },
      { path: '/availability', element: wrap(<AvailabilityView />) },

      // Client portal
      { path: '/client',            element: wrap(<ClientPhoneRoute />) },
      { path: '/client/otp',        element: wrap(<ClientOTPRoute />) },
      { path: '/client/details',    element: wrap(<ClientNewDetailsRoute />) },
      { path: '/client/returning',  element: wrap(<ClientReturningRoute />) },
      { path: '/client/slots',      element: wrap(<ClientSlotPickerRoute />) },
      { path: '/client/confirm',    element: wrap(<ClientConfirmationRoute />) },
      { path: '/client/status',     element: wrap(<ClientStatusRoute />) },
      { path: '/client/rejected',   element: wrap(<ClientRejectionRoute />) },

      // System / design-system screens
      { path: '/system/empty',    element: wrap(<EmptyStatesScreen />) },
      { path: '/system/loading',  element: wrap(<LoadingSkeletonScreen />) },
      { path: '/system/error',    element: wrap(<ErrorStateScreen />) },
      { path: '/system/sms',      element: wrap(<SmsPreviewScreen />) },

      // Fallback
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default router
