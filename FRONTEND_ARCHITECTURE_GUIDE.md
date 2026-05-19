# Queueflow Frontend Architecture Guide (AI-First)

This document is the canonical frontend architecture reference for AI-assisted development in `queueflow`.

It is intentionally practical: optimize for consistent screens, low-risk changes, and a clear path from the current prototype UI to real API-backed behavior.

---

## 1) Purpose and Scope

Use this guide when you are:
- Adding a new screen, route, or queue workflow
- Connecting existing mock UI to backend APIs
- Refactoring frontend code
- Deciding where new code should live
- Reviewing whether a change follows project conventions

Core goals:
- Keep route wiring centralized
- Keep page-level flows easy to follow
- Keep reusable UI primitives small and consistent
- Keep future API/auth behavior centralized instead of scattered through views

---

## 2) Current Tech Stack

- Framework: **React 19 + TypeScript**
- Bundler: **Vite 8** (`vite.config.ts`)
- Router: **React Router v7** (`src/route.tsx`)
- Styling: **Tailwind CSS 3** with CSS variable design tokens (`src/index.css`)
- Icons: local SVG path wrapper (`src/components/ui/icon.tsx`)
- HTTP: **Axios** with centralized interceptor (`src/services/interceptor.ts`)
- State:
  - **Local React state** for most screen interaction
  - **Redux Toolkit** is configured but currently only has an `_init` placeholder reducer
  - **Zustand** is installed but not currently used
- Utilities: `clsx` + `tailwind-merge` through `cn(...)` (`src/lib/utils.ts`)

---

## 3) High-Level Frontend Architecture

### 3.1 Runtime Composition

The app bootstraps in this order (`src/main.tsx`):

1. React root + `StrictMode`
2. Redux `Provider`
3. React Router `RouterProvider`
4. Global stylesheet import (`src/index.css`)

`src/App.tsx` currently returns `null`. The router is the real application root.

### 3.2 Route + Screen Flow

Navigation is centralized in `src/route.tsx`.

Standard flow:

```text
User action
  -> route wrapper calls useNavigate()
    -> router matches route
      -> GuestLayout or AppLayout renders <Outlet />
        -> lazy-loaded screen renders
```

Route wrappers adapt router behavior into screen props. Feature screens receive callbacks like `onSubmit`, `onBack`, `onContinue`, and `onOpenClientPortal` instead of importing router hooks everywhere.

### 3.3 Future Request Flow

When API integration is added, use this flow:

```text
View/Component
  -> Service function (src/services/*)
    -> Axios instance (src/services/interceptor.ts)
      -> API
        -> success: typed data back to view
        -> failure: interceptor handles auth failures; caller handles local UI state
```

Do not call `axios` directly from views.

---

## 4) Project Structure and Ownership

Primary directories in `src/`:

- `views/` - Route-level screens grouped by product area
- `components/ui/` - Base UI primitives (`Button`, `Card`, `Field`, `Modal`, etc.)
- `components/layout/` - Shared layout pieces (`Sidebar`, `TopBar`, `PhoneFrame`, `QFLogo`)
- `layouts/` - Route shells (`AppLayout`, `GuestLayout`)
- `services/` - API transport and future domain service functions
- `stores/` - Redux store setup and future global state slices
- `types/` - Shared TypeScript contracts and UI type unions
- `hooks/` - Reusable React hooks
- `lib/` - Pure utilities (`cn`, time formatting, hashing)

Ownership rule:
- **Views orchestrate** user flows and page state
- **UI components render** reusable primitives and should stay domain-light
- **Layout components own** app chrome and repeated navigation structure
- **Services fetch/mutate data**
- **Types define** shared contracts
- **Lib/hooks hold** pure reusable behavior

---

## 5) Routing Standards

Routing is centralized in `src/route.tsx` using `createBrowserRouter`.

Rules:
- Add every route in `src/route.tsx`
- Lazy-load route screens with `React.lazy`
- Wrap lazy route elements with `wrap(...)` so the shared loader is used
- Keep navigation logic in small route wrapper components when a screen needs callbacks
- Use `GuestLayout` for marketing/auth routes
- Use `AppLayout` for app, dashboard, org-user, client, and system routes
- Use `Navigate` for catch-all fallback routes

Current route groups:
- Marketing/auth: `/`, `/signup`, `/login`, `/accept-invite`
- Onboarding: `/onboarding`
- Super user dashboard: `/dashboard/*`
- Org user workflows: `/claim`, `/queue`, `/availability`
- Client portal: `/client/*`
- System/design screens: `/system/*`

Do not:
- Create ad-hoc route arrays in feature folders
- Import `useNavigate` into every screen when a route wrapper can pass a callback
- Duplicate fallback routes outside the central router

---

## 6) Authentication and Authorization

### 6.1 Current State

There are no route guards yet. All `AppLayout` routes are currently accessible if the URL is known.

The Axios interceptor reads a token from `localStorage`:

```typescript
const token = localStorage.getItem('token')
```

If an API response returns `401`, it removes the token and redirects to `/login`.

### 6.2 Expected Auth Direction

When backend auth is connected:
- Keep token attachment and `401` redirect behavior in `src/services/interceptor.ts`
- Add route-level guards instead of checking auth inside every view
- Store only session-wide auth/profile data globally
- Keep role/permission checks close to routes or layout boundaries

Recommended future guard shape:

```tsx
{
  element: <PrivateRoute><AppLayout /></PrivateRoute>,
  children: [
    { path: '/dashboard', element: wrap(<DashboardRoute initialPage="dashboard" />) },
  ],
}
```

Do not scatter `localStorage.getItem('token')` checks through screens.

---

## 7) API and Service Layer Conventions

All API calls must go through `src/services/` and use the shared Axios instance from `src/services/interceptor.ts`.

### 7.1 Current Interceptor Responsibilities

`src/services/interceptor.ts` currently:
- sets `baseURL` from `import.meta.env.VITE_API_BASE_URL`
- sends JSON by default
- attaches `Authorization: Bearer {token}` from `localStorage`
- clears the token and redirects to `/login` on `401`
- rejects errors upward for the caller to handle

### 7.2 Service Rules

Use one service file per API area:
- `queueApi.ts`
- `bookingApi.ts`
- `organizationApi.ts`
- `seatApi.ts`
- `timeslotApi.ts`
- `authApi.ts`

Export explicit functions. Avoid class-based clients for now.

Standard service function shape:

```typescript
import api from './interceptor'
import type { Booking } from '@/types'

export async function getQueueBookings(seatId: string) {
  const response = await api.request<Booking[]>({
    url: `/seats/${seatId}/bookings`,
    method: 'GET',
  })

  return response
}
```

Rules:
- Return the Axios response unless a feature has a documented reason to return `response.data`
- Type request and response payloads
- Let the interceptor handle auth transport behavior
- Use the caller for local loading, empty, and inline error states
- Do not show the same error twice

### 7.3 Error Handling

For now, screens should use local error state when they need visible inline errors:

```tsx
const [error, setError] = useState<string | null>(null)

try {
  await approveBooking(id)
} catch {
  setError('Could not approve this booking.')
}
```

If backend error shapes become inconsistent, add a shared `src/lib/api-error.ts` helper instead of parsing error shapes inline in every view.

---

## 8) State Management Strategy

Use the lightest state mechanism that satisfies the scope.

1. **Local component state**
   - Default for forms, tabs, selected rows, modal visibility, mock data mutation, and loading flags
2. **Custom hooks**
   - Reusable behavior with lifecycle concerns, such as timers (`src/hooks/use-tick.ts`)
3. **Redux Toolkit**
   - Use only for cross-screen workflows or structured app state that many screens edit
4. **Zustand**
   - Installed but unused; introduce only if the app needs a small app-wide store and Redux would be too heavy

Current Redux setup:
- Store root: `src/stores/store.ts`
- Typed hooks: `useAppDispatch`, `useAppSelector`
- Placeholder reducer: `_init`

Redux rules when adding real slices:
1. Create the slice near store ownership, for example `src/stores/authStore.ts`
2. Register it in `rootReducer`
3. Export typed selectors/actions from the slice file
4. Keep transient page state out of Redux

---

## 9) Types and Data Contracts

Shared contracts live in `src/types/index.ts`.

Current type groups include:
- UI type unions: `Tone`, `ButtonVariant`, `ButtonSize`, `IconName`
- Queue domain types: `Booking`, `BookingStatus`, `QueueState`, `DailyStats`
- Organization types: `Department`, `Seat`, `OrgUser`, `TimeslotType`
- Navigation types: `NavItem`, `SidebarNavItem`
- Client portal and analytics types

Rules:
- Avoid `any` in new code
- Prefer named interfaces for API payloads and domain entities
- Keep UI-only unions near the UI components that depend on them only if `types/index.ts` grows too large
- Split `src/types/index.ts` into feature files once it becomes hard to scan

Suggested future split:

```text
src/types/
  queueTypes.ts
  organizationTypes.ts
  clientTypes.ts
  uiTypes.ts
  index.ts
```

Naming conventions:
- Interfaces: PascalCase nouns (`Booking`, `QueueState`, `CreateSeatPayload`)
- API request bodies: suffix `Payload`
- API responses: suffix `Response`
- Status unions: suffix `Status`
- Boolean fields: prefix with `is`, `has`, or `can`

---

## 10) UI and Component Patterns

### 10.1 Component Layers

- `views/` = route screens and feature composition
- `components/layout/` = repeated page chrome and app structure
- `components/ui/` = primitive components and small reusable building blocks

Do not put domain-heavy booking or organization logic inside `components/ui`.

### 10.2 UI Import Conventions

Prefer importing primitives from the barrel:

```tsx
import { Button, Card, Field, Modal, Pill } from '@/components/ui'
```

Use `cn(...)` from `@/lib/utils` for conditional class composition:

```tsx
className={cn('base classes', active && 'bg-surface-2')}
```

### 10.3 Design Tokens

Global design tokens live in `src/index.css` and are mapped into Tailwind in `tailwind.config.js`.

Use token-backed classes:
- backgrounds: `bg-bg`, `bg-surface`, `bg-surface-2`
- borders: `border-line`, `border-line-2`
- text: `text-ink`, `text-ink-2`, `text-ink-3`
- accents: `teal`, `coral`, `amber`, `blue`, `success`

Use CSS variables directly only when Tailwind cannot express the value cleanly.

Dark mode uses the `.qf-dark` class. Keep dark-theme support token-based; do not hard-code separate dark colors in every component.

### 10.4 Buttons and Icons

Use `Button` from `src/components/ui/button.tsx` for app commands.

Rules:
- Use the `icon` and `iconRight` props instead of manually placing icons inside buttons
- Add new icon names to `IconName` and `ICONS` together
- Keep button variants aligned to the existing `ButtonVariant` union
- Use icon-only buttons only when the visual meaning is obvious or an accessible label is supplied

Example:

```tsx
<Button variant="primary" icon="link" onClick={handleCreateLink}>
  Get join link
</Button>
```

### 10.5 Cards and Layout

Use `Card` for repeated framed content, tables, metric panels, and modal-like sections.

Rules:
- Keep dashboard chrome in layout/view components
- Use stable grid templates for data-dense layouts
- Use `qf-scroll` on scroll containers that should match the app scrollbar style
- Keep fixed-height app surfaces explicit, as the dashboard currently does with `calc(100vh - 48px)`

### 10.6 Modals

Use `Modal` from `src/components/ui/modal.tsx`.

Current modal API:

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Invite org user"
  footer={<Button variant="primary">Send invite</Button>}
>
  <InviteForm />
</Modal>
```

Rules:
- Controlled open state lives in the parent
- Reset form state when closing if stale data would be confusing
- Use modal `footer` for primary and secondary actions
- Avoid nested modals
- For destructive actions, require an explicit confirmation step before calling the mutation

### 10.7 Forms

There is no form library. Forms currently use manual controlled state.

Use `Field`, `TextInput`, and `SelectInput` from `components/ui`.

Standard pattern:

```tsx
const [name, setName] = useState('')

<Field label="Seat name">
  <TextInput value={name} onChange={(e) => setName(e.target.value)} />
</Field>
```

Rules:
- Validate synchronously before API calls when possible
- Disable submit buttons during async work
- Keep form state local unless multiple screens need to edit the same draft
- Promote repeated form sections to a feature component, not to `components/ui`

---

## 11) View Organization

Current view groups:

- `views/marketing/` - landing, signup, login, invite acceptance
- `views/onboarding/` - organization setup flow
- `views/superuser/` - dashboard and management views
- `views/orguser/` - seat claim, live queue, availability
- `views/client/` - phone, OTP, details, slot picking, confirmation, status, rejection
- `views/system/` - empty/loading/error/SMS preview screens

Rules:
- Keep route-level screens in the matching feature folder
- Export named screen components from view files
- Use each folder's `index.ts` as a public export surface where helpful
- Keep mock/demo data near the screen that owns it until it becomes shared or API-backed
- When a view file grows too large, split feature-only helpers into adjacent files

Suggested split pattern:

```text
src/views/superuser/
  dashboard.tsx
  management.tsx
  dashboard-data.ts
  management-table.tsx
```

If a helper becomes reusable across feature groups, move it to `src/components/`, `src/hooks/`, or `src/lib/`.

---

## 12) Data Fetching Patterns

### 12.1 Current State

Most screens currently render local mock data. Treat this as prototype data, not a final architecture.

When replacing mock data:
- Keep the UI component shape stable
- Move backend calls into `src/services/*`
- Add shared response/payload types before wiring the call into a view
- Preserve loading, empty, and error states

### 12.2 Effect-Based Fetching

Use `useEffect` for screen-level data that loads after render:

```tsx
const [bookings, setBookings] = useState<Booking[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  let cancelled = false

  async function load() {
    setLoading(true)
    try {
      const response = await getQueueBookings(seatId)
      if (!cancelled) setBookings(response.data)
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  load()

  return () => {
    cancelled = true
  }
}, [seatId])
```

### 12.3 Parallel Requests

Use `Promise.all` for independent data sources:

```tsx
const [queueRes, seatsRes] = await Promise.all([
  getQueueBookings(seatId),
  getSeats(),
])
```

### 12.4 Timers and Live UI

Use a hook for repeated timer behavior instead of duplicating intervals.

`src/hooks/use-tick.ts` already provides a simple rerender tick:

```tsx
useTick(1000)
```

If a screen needs the current timestamp, create a hook that returns it rather than keeping separate interval implementations in multiple views.

---

## 13) Styling Standards

Rules:
- Prefer Tailwind utility classes mapped to design tokens
- Use inline styles only for dynamic values, exact grid templates, CSS variables, or values that Tailwind cannot express cleanly
- Keep typography compact and operational; Queueflow is a work tool, not a marketing-heavy site once inside the app
- Use `tnum` for timers, queue numbers, counts, and analytics values
- Use `mono` for technical values such as IDs, URLs, and timing strings when appropriate
- Preserve focus-visible behavior from `src/index.css`

Avoid:
- One-off hard-coded color palettes in views
- Recreating existing UI primitives with raw buttons/cards
- Large untyped object blobs when a named interface would make the data clearer

---

## 14) Build, Lint, and Verification

Available commands:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Before handing off frontend changes:
- Run `npm run build` for TypeScript and production bundle verification
- Run `npm run lint` for lint checks
- For visual changes, start `npm run dev` and inspect affected routes in the browser

Vite dev server defaults to port `3000` (`vite.config.ts`).

---

## 15) Path Aliases

Configured in `vite.config.ts` and `tsconfig.app.json`:

- `@/*` -> `src/*`
- `ui` -> `src/components/ui/index.ts`

Prefer `@/...` imports for app code:

```tsx
import { cn } from '@/lib/utils'
import type { Booking } from '@/types'
```

The `ui` alias is available, but `@/components/ui` is clearer and already used throughout the codebase.

---

## 16) AI-Assisted Development Checklist

When making changes with AI assistance:

1. Read the target route and screen first
2. Check existing UI primitives before adding new components
3. Keep route wiring in `src/route.tsx`
4. Keep API calls in `src/services/*`
5. Add or update TypeScript contracts before wiring data into JSX
6. Preserve design tokens and existing spacing/radius conventions
7. Run build and lint before final handoff

Default decision rule:
- If code is only useful to one screen, keep it near that screen
- If code is reused by multiple feature groups, promote it to `components`, `hooks`, `lib`, or `types`
- If behavior crosses routes or sessions, consider store-level state

