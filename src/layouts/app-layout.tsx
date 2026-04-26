import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-background" />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
