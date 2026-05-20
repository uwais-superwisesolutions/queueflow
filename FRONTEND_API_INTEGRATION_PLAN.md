# QueueFlow Frontend — API Integration Plan

This document maps every backend API endpoint shipped across M0–M9 of [`PHASE_1_PLAN.md`](../../umar-uwais-ai-week-backend/PHASE_1_PLAN.md) to the frontend service, view, and store that consumes it. It records what's already wired, what's still mock, and what would need a small backend addition before further wiring is possible.

Read this with [`FRONTEND_ARCHITECTURE_GUIDE.md`](./FRONTEND_ARCHITECTURE_GUIDE.md) for the underlying conventions.

---

## 1. How to read this doc

### 1.1 Status legend

| Symbol | Meaning |
|---|---|
| ✅ | Wired and exercised by a real view |
| ⚙️ | Wired in the service layer, no view consumer yet |
| ⚠️ | View renders mock data; needs wiring against an existing endpoint |
| 🧱 | Needs a new backend endpoint before frontend wiring is possible |
| 🔮 | Phase 2 — deliberately out of scope for Phase 1 |
| 🗑️ | Dead code — safe to delete |

### 1.2 Cross-cutting infrastructure already in place

These pieces are shared by every feature below; nothing else in this doc has to repeat them.

| Concern | Location | Notes |
|---|---|---|
| Axios transport | [`src/services/interceptor.ts`](src/services/interceptor.ts) | `baseURL` from `VITE_API_BASE_URL`; attaches org-member or client Bearer based on the URL prefix; silent-refresh of the org token on 401; redirects to `/login` or `/client` on hard failure. |
| Public-route allow-list | `isPublicClientRoute()` in the interceptor | `/api/auth/*`, `/api/client/phone/{verify,confirm}`, `/api/client/portal-links/{slug}/scan` skip the Bearer step. |
| Org-member session store | [`src/stores/authStore.ts`](src/stores/authStore.ts) | Persists `userId`, `email`, `fullName`, `organisationId`, `organisationName`, `orgMemberId`, `role`, `onboardingComplete`. Backs `setSession` / `setTokens` / `clear`. |
| Client session store | [`src/stores/clientAuthStore.ts`](src/stores/clientAuthStore.ts) | Persists `clientId`, `orgId`, `phone`, `expiresAt`. `isAuthenticated()` checks token presence + expiry. |
| Portal scan cache | [`src/lib/client-org.ts`](src/lib/client-org.ts) | Caches the most recent portal-link scan result for bootstrapping the client portal. |
| Polling cadence | [`src/lib/realtime-channels.ts`](src/lib/realtime-channels.ts) | Centralised `POLL_INTERVAL_MS` values, frontend stand-in for the M9-deferred Supabase Realtime. Used via `usePolling` ([`src/hooks/use-polling.ts`](src/hooks/use-polling.ts)). |
| Error formatting | [`src/lib/api-error.ts`](src/lib/api-error.ts) | `getApiErrorMessage(err, fallback)` extracts a user-safe string from Axios errors. |

---

## 2. Per-feature breakdown

### F1 — Auth (org member)

**Backend** (M0 + refresh-token follow-up)

| Method | Path |
|---|---|
| POST | `/api/auth/signup` |
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |

**Frontend**

- Service: [`src/services/authApi.ts`](src/services/authApi.ts) — `signUp`, `login`, `refreshSession`.
- Store: [`src/stores/authStore.ts`](src/stores/authStore.ts) — `setSession`, `setTokens`, `clear`.
- Views: [`views/marketing/sign-up.tsx`](src/views/marketing/sign-up.tsx), [`views/marketing/login.tsx`](src/views/marketing/login.tsx). Logout buttons live in `ProfileMenu` inside `SuperUserDashboard` and `OrgUserDashboard`.

**Data flow**: view → `authApi` → backend → response stored in `authStore` (which also writes `token` + `refresh_token` to `localStorage`) → router navigates by `role` + `onboardingComplete`. Silent refresh is fully transparent to view code thanks to the response interceptor.

**Status**: ✅

**Remaining work**: none for Phase 1.

---

### F2 — Organisation onboarding

**Backend** (M1)

| Method | Path |
|---|---|
| GET | `/secure/organisations` |
| PATCH | `/secure/organisations/branding` |
| PATCH | `/secure/organisations/onboarding-step` |
| POST | `/secure/organisations/complete-onboarding` |

**Frontend**

- Service: [`src/services/organisationApi.ts`](src/services/organisationApi.ts) — `getOrganisation`, `updateBranding`, `updateOnboardingStep`, `completeOnboarding`.
- View: [`views/onboarding/onboarding.tsx`](src/views/onboarding/onboarding.tsx) — five-step wizard (departments → seats → team → timeslots → share). Resumes from `onboarding_step` on mount; calls `completeOnboarding` at the end.

**Data flow**: each step persists state-of-the-world (`departments`, `seats`, `timeslot_types`, invitations) via the relevant feature service, then bumps `onboarding_step` on the org. Wizard navigates back to `/dashboard` once `complete-onboarding` succeeds.

**Status**: ✅

**Remaining work**: none for Phase 1.

---

### F3 — Organisation settings + members + invites

**Backend** (M0 + M1)

| Method | Path |
|---|---|
| GET | `/secure/organisations/members` |
| POST | `/secure/organisations/invite` |
| POST | `/secure/organisations/accept-invite` |
| GET | `/secure/organisations/invitations` |
| PATCH | `/secure/organisations/branding` (re-used outside onboarding) |

**Frontend**

- Service: [`src/services/organisationApi.ts`](src/services/organisationApi.ts) — `getMembers`, `inviteUser`, `acceptInvite`, `getInvitations`, plus the shared branding/onboarding helpers.
- Views:
  - [`views/marketing/accept-invite.tsx`](src/views/marketing/accept-invite.tsx) — handles `acceptInvite` and routes by resulting role.
  - [`views/superuser/org-users.tsx`](src/views/superuser/org-users.tsx) — lists members + pending invites, dispatches `inviteUser`.
  - [`views/superuser/settings.tsx`](src/views/superuser/settings.tsx) — branding edit form bound to `updateBranding`.

**Status**: ✅

**Remaining work**: none for Phase 1. *Org-member profile edit* (`PATCH /secure/me/profile`) is 🧱 (see §3.2).

---

### F4 — Departments

**Backend** (M2)

| Method | Path |
|---|---|
| GET | `/secure/departments` |
| GET | `/secure/departments/{id}` |
| POST | `/secure/departments` |
| PUT | `/secure/departments/{id}` |
| DELETE | `/secure/departments/{id}` |

**Frontend**

- Service: [`src/services/departmentApi.ts`](src/services/departmentApi.ts) — `listDepartments`, `getDepartment`, `createDepartment`, `updateDepartment`, `deleteDepartment`.
- Views: [`views/superuser/seats.tsx`](src/views/superuser/seats.tsx) (full CRUD), [`views/onboarding/onboarding.tsx`](src/views/onboarding/onboarding.tsx) (create during step 1), [`views/superuser/portal-links.tsx`](src/views/superuser/portal-links.tsx) (read for scope dropdown), [`views/superuser/dashboard.tsx`](src/views/superuser/dashboard.tsx) (read for seat-tile labels).

**Status**: ✅

**Remaining work**: none.

---

### F5 — Seats

**Backend** (M2)

| Method | Path |
|---|---|
| GET | `/secure/seats` |
| GET | `/secure/departments/{departmentId}/seats` |
| GET | `/secure/seats/{id}` |
| POST | `/secure/seats` |
| PUT | `/secure/seats/{id}` |
| DELETE | `/secure/seats/{id}` |

**Frontend**

- Service: [`src/services/seatApi.ts`](src/services/seatApi.ts) — `listSeats`, `listSeatsByDepartment` ⚙️, `getSeat` ⚙️, `createSeat`, `updateSeat`, `deleteSeat`.
- Views: [`views/superuser/seats.tsx`](src/views/superuser/seats.tsx) (full CRUD), [`views/superuser/dashboard.tsx`](src/views/superuser/dashboard.tsx) + new `QueuesView`, [`views/orguser/seat-claim.tsx`](src/views/orguser/seat-claim.tsx) (claim tiles), [`views/superuser/portal-links.tsx`](src/views/superuser/portal-links.tsx) (scope dropdown).

**Status**: ✅ for the active surface. `listSeatsByDepartment` and `getSeat` are exported by the service layer but currently have no view consumer — fine to keep available for future drill-downs.

**Remaining work**: none for Phase 1.

---

### F6 — Timeslot types + org-user opt-in

**Backend** (M2)

| Method | Path |
|---|---|
| GET | `/secure/timeslot-types` |
| GET | `/secure/timeslot-types/{id}` |
| POST | `/secure/timeslot-types` |
| PUT | `/secure/timeslot-types/{id}` |
| PATCH | `/secure/timeslot-types/{id}/active` |
| DELETE | `/secure/timeslot-types/{id}` |
| GET | `/secure/me/timeslot-types` |
| POST | `/secure/me/timeslot-types/{id}/opt-in` |
| DELETE | `/secure/me/timeslot-types/{id}/opt-in` |

**Frontend**

- Service: [`src/services/timeslotTypeApi.ts`](src/services/timeslotTypeApi.ts) — all eight CRUD/opt-in helpers, plus `setTimeslotTypeActive`.
- Views: [`views/superuser/timeslot-types.tsx`](src/views/superuser/timeslot-types.tsx) (full CRUD + active toggle), [`views/orguser/dashboard.tsx`](src/views/orguser/dashboard.tsx) → `TimeConfigView` (opt-in/opt-out), [`views/onboarding/onboarding.tsx`](src/views/onboarding/onboarding.tsx) (create during step 4).

**Status**: ✅

**Remaining work**: none.

---

### F7 — Availability (patterns + exceptions)

**Backend** (M3)

| Method | Path |
|---|---|
| GET | `/secure/me/availability/patterns` |
| PUT | `/secure/me/availability/patterns` (with optional cascade `Resolutions`) |
| GET | `/secure/me/availability/exceptions?from=&to=` |
| POST | `/secure/me/availability/exceptions` |
| DELETE | `/secure/me/availability/exceptions/{id}` |

**Frontend**

- Service: [`src/services/availabilityApi.ts`](src/services/availabilityApi.ts) — five functions matching the endpoint set.
- View: [`views/orguser/availability.tsx`](src/views/orguser/availability.tsx) — Monday-first weekly pattern editor, exception list with create/delete, 409-conflict modal that posts resolutions back with `force=true`.

**Status**: ✅

**Remaining work**: none for Phase 1. The "effective availability" computation lives server-side and is consumed indirectly via slot search.

---

### F8 — Public holidays

**Backend** (M3)

| Method | Path |
|---|---|
| GET | `/secure/public-holidays?year=` |
| POST | `/secure/public-holidays` |
| DELETE | `/secure/public-holidays/{id}` |

**Frontend**

- Service: [`src/services/publicHolidayApi.ts`](src/services/publicHolidayApi.ts) — `listPublicHolidays`, `createPublicHoliday`, `deletePublicHoliday`.
- View: [`views/superuser/settings.tsx`](src/views/superuser/settings.tsx) — list / create / delete in the org-wide settings page.

**Status**: ✅

**Remaining work**: none.

---

### F9 — Client auth (OTP + per-tenant JWT)

**Backend** (M4)

| Method | Path |
|---|---|
| POST | `/api/client/phone/verify` |
| POST | `/api/client/phone/confirm` |
| GET | `/api/client/me` |

**Frontend**

- Services: [`src/services/clientAuthApi.ts`](src/services/clientAuthApi.ts) (`requestClientOtp`, `confirmClientOtp`), [`src/services/clientApi.ts`](src/services/clientApi.ts) (`getClientMe`).
- Store: [`src/stores/clientAuthStore.ts`](src/stores/clientAuthStore.ts).
- Views:
  - [`views/client/phone.tsx`](src/views/client/phone.tsx) — collects phone, calls `requestClientOtp`.
  - [`views/client/otp.tsx`](src/views/client/otp.tsx) — collects code, calls `confirmClientOtp`, persists the client session.
  - [`views/client/returning.tsx`](src/views/client/returning.tsx) — `getClientMe` to greet returning clients before slot picking.

**Status**: ✅

**Remaining work**: none for Phase 1. *Client-profile edit* (`PATCH /api/client/me`) is 🧱 — see §3.2.

---

### F10 — Slot search

**Backend** (M5)

| Method | Path |
|---|---|
| GET | `/api/client/slots?orgMemberId=&timeslotTypeId=&from=&to=` |

**Frontend**

- Service: [`src/services/slotApi.ts`](src/services/slotApi.ts) — `searchSlots`.
- View: [`views/client/slot-picker.tsx`](src/views/client/slot-picker.tsx) — Today / Tomorrow / Later tabs over the response.

**Status**: ✅

**Remaining work**: none for Phase 1.

---

### F11 — Client bookings (create / list / cancel)

**Backend** (M5)

| Method | Path |
|---|---|
| POST | `/api/client/bookings` |
| GET | `/api/client/bookings/me` |
| POST | `/api/client/bookings/{id}/cancel` |

**Frontend**

- Service: [`src/services/clientBookingApi.ts`](src/services/clientBookingApi.ts) — `createClientBooking`, `listMyClientBookings`, `cancelMyClientBooking`.
- Views: [`views/client/confirmation.tsx`](src/views/client/confirmation.tsx) (create + poll soft-hold), [`views/client/status.tsx`](src/views/client/status.tsx) (list-own + status polling + cancel).

**Data flow**: confirmation creates exactly once (refguard); polls `listMyClientBookings` every `POLL_INTERVAL_MS.bookingStatus` until the booking leaves `pending_approval`; the status screen runs the same poll for ongoing state changes.

**Status**: ✅ — `clientReason` is now threaded from `new-details.tsx` through the route state into the create payload.

**Remaining work**: none for Phase 1.

---

### F12 — Queue bookings (org-member view + state transitions)

**Backend** (M5)

| Method | Path |
|---|---|
| GET | `/secure/bookings` (combined queue) |
| POST | `/secure/bookings/{id}/decision` (approve/reject) |
| POST | `/secure/bookings/{id}/check-in` |
| POST | `/secure/bookings/{id}/start` |
| POST | `/secure/bookings/{id}/complete` |
| POST | `/secure/bookings/{id}/cancel` |
| POST | `/secure/bookings/{id}/no-show` |

**Frontend**

- Service: [`src/services/queueBookingApi.ts`](src/services/queueBookingApi.ts) — `getQueue`, `bookingDecision`, `checkInBooking`, `startBooking`, `completeBooking`, `cancelBooking`, `noShowBooking`.
- Views:
  - [`views/orguser/live-queue.tsx`](src/views/orguser/live-queue.tsx) — primary consumer; renders the four queue sections, dispatches every transition.
  - [`views/superuser/dashboard.tsx`](src/views/superuser/dashboard.tsx) — `DashboardBody` reads `getQueue` for KPIs; `QueuesView` reads it for the org-wide grouped list.

**Status**: ✅

**Remaining work**: none for Phase 1.

---

### F13 — Seat assignments + queue dashboard

**Backend** (M6)

| Method | Path |
|---|---|
| POST | `/secure/seats/{id}/claim` |
| GET | `/secure/me/seat-assignment` |
| POST | `/secure/me/heartbeat` |
| POST | `/secure/me/end-shift` |
| GET | `/secure/sessions/active` |

**Frontend**

- Service: [`src/services/sessionApi.ts`](src/services/sessionApi.ts) — `claimSeat`, `getMySeatAssignment`, `heartbeat`, `endShift`, `listActiveSessions`.
- Views:
  - [`views/orguser/seat-claim.tsx`](src/views/orguser/seat-claim.tsx) — seat tiles + claim action; auto-switches an existing assignment.
  - [`views/orguser/live-queue.tsx`](src/views/orguser/live-queue.tsx) — `heartbeat` on a timer, `endShift` from the profile menu.
  - [`views/superuser/dashboard.tsx`](src/views/superuser/dashboard.tsx) — `listActiveSessions` for the "Active sessions" panel + per-seat tiles.

**Status**: ✅

**Remaining work**: none for Phase 1.

---

### F14 — Portal links (admin + anonymous scan)

**Backend** (M7)

| Method | Path |
|---|---|
| GET | `/secure/portal-links` |
| POST | `/secure/portal-links` |
| DELETE | `/secure/portal-links/{id}` |
| POST | `/api/client/portal-links/{slug}/scan` (anonymous) |

**Frontend**

- Service: [`src/services/portalLinkApi.ts`](src/services/portalLinkApi.ts) — `listPortalLinks`, `createPortalLink`, `deletePortalLink`, `scanPortalLink`.
- Views:
  - [`views/superuser/portal-links.tsx`](src/views/superuser/portal-links.tsx) — full CRUD, scope picker bound to departments + seats.
  - [`views/client/phone.tsx`](src/views/client/phone.tsx) — uses `resolvePortalScan` (in `lib/client-org.ts`) to call `scanPortalLink` on first arrival, then caches the result for `confirmation.tsx`.
- Dead code: [`views/superuser/management.tsx`](src/views/superuser/management.tsx) `ClientLinksView` — duplicate mock implementation; not referenced from the dashboard router.

**Status**: ✅ for the live surface.

**Remaining work**: 🗑️ Delete `ClientLinksView` and the surrounding `LINKS`/`PortalLink` mock types in `management.tsx`. ~30-line cleanup.

---

### F15 — Notifications (M8 backend writes; no read endpoint)

**Backend** (M8)

| Layer | Reality |
|---|---|
| `notifications` table | Written by `BookingService.TransitionAsync` (M5/M8 wiring) and `DelayDetector` (M8). |
| `NotificationDispatcher` background service | Pulls `status = pending`, sends via `ISmsSender` (currently `LoggingSmsSender`). |
| Read endpoint | **None today.** |

**Frontend**

- Service: *(none)* — there's no `notificationApi.ts`.
- View: [`views/orguser/dashboard.tsx`](src/views/orguser/dashboard.tsx) → `NotificationsView` renders a hard-coded 3-item array.

**Status**: ⚠️ mock view + 🧱 missing endpoint.

**Remaining work**:

1. **Backend addition** (small):
   - New endpoint: `GET /secure/notifications?status=&from=&to=&limit=` returning the org's recent notifications (optionally filtered by the caller's `org_member_id` for org_user-scoped views, or unfiltered for super_user).
   - Reuses existing `INotificationRepository` — needs a `GetByOrgIdAsync(orgId, filter)` method.
2. **Frontend wiring**:
   - New `src/types/notificationTypes.ts` mirroring `NotificationResponse`.
   - New `src/services/notificationApi.ts` with `listNotifications`.
   - Rewrite `NotificationsView` to fetch + render + poll on `POLL_INTERVAL_MS.notifications` (add the constant in `realtime-channels.ts`).
   - Optional: also surface on a super-user notification feed.

---

### F16 — Realtime / live updates

**Backend** (M9)

- Channel naming documented in [`../../umar-uwais-ai-week-backend/REALTIME_CHANNELS.md`](../../umar-uwais-ai-week-backend/REALTIME_CHANNELS.md).
- Three channels: `org:{orgId}:dashboard`, `seat:{seatId}:queue`, `booking:{bookingId}`.
- No backend events table or push bridge — Phase 2.

**Frontend**

- Stand-in: [`src/lib/realtime-channels.ts`](src/lib/realtime-channels.ts) exposes `POLL_INTERVAL_MS` constants per channel. [`src/hooks/use-polling.ts`](src/hooks/use-polling.ts) drives the polls.
- Views using polling: `superuser/dashboard.tsx` (`DashboardBody` + `QueuesView`), `orguser/live-queue.tsx`, `orguser/seat-claim.tsx`, `client/confirmation.tsx`, `client/status.tsx`.

**Status**: ✅ (as polling). 🔮 push-based realtime is Phase 2.

**Remaining work for Phase 1**: none. For Phase 2, three options on the table — see §4.3.

---

## 3. Gaps and remaining work

### 3.1 Mock views that should be wired or replaced

| View | Gap | Backend dependency | Priority |
|---|---|---|---|
| `orguser/dashboard.tsx → NotificationsView` | Hard-coded 3-item array | 🧱 `GET /secure/notifications` (small new endpoint) | High |
| `superuser/management.tsx → AnalyticsView` | All charts are mock data | 🔮 Phase 2 (Claude bottleneck analysis per `IMPLEMENTATION_PLAN.md §7.2`) | Phase 2 |
| `superuser/dashboard.tsx → BillingPlaceholder` | Cosmetic only | 🔮 Phase 2 / out of plan | Phase 2 |
| `orguser/dashboard.tsx → ProfileView` | Read-only display of `authStore` data | 🧱 `PATCH /secure/me/profile` | Low |
| `client/new-details.tsx` first-name / last-name / email / SMS-consent fields | Captured visually, not persisted | 🧱 `PATCH /api/client/me` | Low |
| `superuser/management.tsx → ClientLinksView` | Duplicate of `PortalLinksView`, dead code | 🗑️ delete | Low |

### 3.2 Backend additions required for full coverage

| Endpoint | Purpose | Consumer |
|---|---|---|
| `GET /secure/notifications` | List recent notifications for the org / caller. | `NotificationsView` |
| `PATCH /secure/me/profile` | Org-member updates their own `full_name`, `email`, `avatar_url`. | `ProfileView` |
| `PATCH /api/client/me` | Client updates their own `first_name`, `last_name`, `email`. | `client/new-details.tsx` + (future) "edit my details" inside the client portal |

Each is a small backend addition (≤ 50 lines of repo + service + controller per endpoint). The `PATCH /secure/me/profile` and `PATCH /api/client/me` are independent of each other and can ship piecemeal.

### 3.3 Phase 2 follow-ups (no Phase 1 frontend work)

- **Analytics**: `AnalyticsView` swap from mock charts to the Claude-drafted bottleneck-analysis report from `IMPLEMENTATION_PLAN.md §7.2`. Needs new backend.
- **Billing**: out of plan today; placeholder UI exists.
- **Push realtime**: replace `usePolling` with either (a) direct Supabase Realtime subscriptions (once RLS + token pass-through lands) or (b) a backend-side bridge (SignalR or similar). The channel names in `REALTIME_CHANNELS.md` are designed to survive this swap.

---

## 4. Recommended sequencing

### 4.1 Quick wins (frontend-only, no backend change)

1. **🗑️ Delete dead code in `superuser/management.tsx`.** Remove `ClientLinksView`, `PortalLink` interface, `LINKS` mock array. ~30 lines, ~5 minutes. Removes confusion for future readers.

### 4.2 Small Phase 1 hotfix (backend + frontend)

2. **Notifications**.
   - Backend: add `INotificationRepository.GetByOrgIdAsync(orgId, ...)`, `INotificationService` (or extend an existing service), and `GET /secure/notifications` controller action.
   - Frontend: `src/types/notificationTypes.ts`, `src/services/notificationApi.ts`, rewrite `NotificationsView`, add `POLL_INTERVAL_MS.notifications`.
   - Total: ~half a day end-to-end.

### 4.3 Phase 2 candidates (when business need arises)

3. **Profile editing** (org-member and client). Two small endpoints + minor edits to `ProfileView` and `client/new-details.tsx`. Skip until users complain about not being able to update their details.
4. **Push realtime**. Largest item by far. Two viable approaches, decision recorded in `REALTIME_CHANNELS.md`.
5. **Analytics + billing**. Both are out-of-scope today; revisit when product direction firms up.

---

## 5. Acceptance criteria for "Phase 1 frontend complete"

- ✅ Every M0–M8 endpoint listed above has a service-layer wrapper.
- ✅ Every major flow in `FRONTEND_ARCHITECTURE_GUIDE.md §11` ("View organisation") renders against live data — no remaining mock arrays inside the active routes.
- ⚠️ `NotificationsView` is the last mock inside an active route; closing §4.2 above clears it.
- 🗑️ `ClientLinksView` removed.
- 🔮 Analytics, billing, profile editing, and push realtime explicitly deferred with documented owners and triggers.

---

## 6. Out of scope for this plan

- Tests. The frontend has no test suite yet (`Backend.Tests` was deferred backend-side; the frontend mirrors that). Adding tests is a separate plan.
- Visual / UX polish beyond what each route currently looks like.
- Frontend deployment / CI. The frontend uses Vite's `npm run build`; a GitHub Actions workflow analogous to `.github/workflows/ci.yml` in the backend repo is a small future task.
