import { Outlet } from 'react-router-dom'

export default function GuestLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
