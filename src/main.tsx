import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfirmProvider } from '@/components/ui'
import { consumeInviteCallback } from '@/lib/invite-callback'
import router from './route'
import './index.css'

// Must run before the router mounts so that:
//   - the hash is stripped before BrowserRouter computes its initial location
//   - tokens are in localStorage when the first axios call fires
consumeInviteCallback()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfirmProvider>
      <RouterProvider router={router} />
    </ConfirmProvider>
  </StrictMode>
)
