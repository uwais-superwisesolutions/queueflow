import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/layouts/app-layout'
import GuestLayout from '@/layouts/guest-layout'

const router = createBrowserRouter([
  {
    element: <GuestLayout />,
    children: [
      {
        path: '/login',
        element: <div>Login</div>,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <div>Dashboard</div>,
      },
    ],
  },
])

export default router
