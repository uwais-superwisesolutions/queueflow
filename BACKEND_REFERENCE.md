# QueueFlow Backend Reference

Complete reference for the .NET 8 backend at `c:\Dev\SWSAIWeek\umar-uwais-ai-week-backend\`. Covers HTTP endpoints, background services, business services, repositories, domain model, infrastructure, and configuration.

| Layer | Project | Purpose |
|---|---|---|
| API surface | `Backend.API` | Controllers, middleware, background services, `Program.cs` |
| Business logic | `Backend.Business` | Services, state machines, orchestrators |
| Data access | `Backend.Repos` | Supabase PostgREST repositories |
| Domain model | `Backend.Domain` | DTOs, enums, models, exceptions |
| Infrastructure | `Backend.Services` | SMS sender, client token signer, Supabase admin client, delay-message drafter |

---

## Table of contents

1. [Architecture & request flow](#1-architecture--request-flow)
2. [Authentication & authorization](#2-authentication--authorization)
3. [HTTP endpoints](#3-http-endpoints)
   - [3.1 Org-member auth](#31-org-member-auth)
   - [3.2 Client auth](#32-client-auth)
   - [3.3 Client portal entry (anonymous)](#33-client-portal-entry-anonymous)
   - [3.4 Organisation & members](#34-organisation--members)
   - [3.5 Org-member profile](#35-org-member-profile)
   - [3.6 Departments](#36-departments)
   - [3.7 Seats & sessions](#37-seats--sessions)
   - [3.8 Timeslot types](#38-timeslot-types)
   - [3.9 Availability — patterns & exceptions](#39-availability--patterns--exceptions)
   - [3.10 Public holidays](#310-public-holidays)
   - [3.11 Portal links](#311-portal-links)
   - [3.12 Bookings — staff queue](#312-bookings--staff-queue)
   - [3.13 Bookings — client](#313-bookings--client)
   - [3.14 Slot search](#314-slot-search)
   - [3.15 Notifications](#315-notifications)
   - [3.16 Client profile & catalogs](#316-client-profile--catalogs)
   - [3.17 Health](#317-health)
4. [Background services](#4-background-services)
5. [Business services](#5-business-services)
6. [State machines](#6-state-machines)
7. [Repositories](#7-repositories)
8. [Domain model](#8-domain-model)
9. [Infrastructure (Backend.Services)](#9-infrastructure-backendservices)
10. [DI registration & middleware pipeline](#10-di-registration--middleware-pipeline)
11. [Configuration (appsettings.json)](#11-configuration-appsettingsjson)
12. [Known issues & workarounds](#12-known-issues--workarounds)

---

## 1. Architecture & request flow

```
HTTP request
  │
  ▼
Backend.API ── Program.cs
  ├─ UseRouting
  ├─ UseCors("corsapp")
  ├─ UseAuthentication                       ◀── Supabase JWKS (ES256) for /secure/*
  ├─ UseAuthorization
  ├─ UseWhen(/secure/*)  → JwtAuthorizationMiddleware  (API-key OR Supabase JWT)
  ├─ UseWhen(/api/client/* minus anonymous) → ClientAuthMiddleware  (HS256 per-tenant)
  ├─ UseMiddleware<UserContextMiddleware>    ◀── populates HttpContext.Items["UserContext"]
  └─ MapControllers + MapGet("/health")
        │
        ▼
   Controller (Backend.API/Controllers/*)
        │ — translates HTTP to a Service call, returns Result/ActionResult
        ▼
   Service (Backend.Business/Services/*)
        │ — orchestrates business rules, calls repos
        ▼
   Repository (Backend.Repos/Repositories/*)
        │ — Supabase PostgREST via Supabase C# client
        ▼
   Postgres (Supabase)
```

Background services (`Backend.API/BackgroundServices/`) run independently of HTTP — they drain queues, expire holds, detect delays, etc.

---

## 2. Authentication & authorization

Three authentication realms enforced by middleware:

| Realm | Token | Issued by | Header | Used on |
|---|---|---|---|---|
| **Org-member** | Supabase ES256 JWT | `/api/auth/login`, `/api/auth/signup` | `Authorization: Bearer <jwt>` | All `/secure/*` |
| **Client** | App-issued HS256 JWT | `/api/client/phone/confirm` | `Authorization: Bearer <jwt>` | All `/api/client/*` (with exemptions) |
| **System** | Pre-shared API key | configured value | `X-Api-Key: <key>` | All `/secure/*` (background callers) |

### `/secure/*` (org-member realm)

Gated by `JwtAuthorizationMiddleware`. Accept if:
1. `X-Api-Key` header matches `Configuration["ApiKey"]`, **or**
2. `User.Identity.IsAuthenticated` (Supabase JWT validated by `UseAuthentication`).

Otherwise → 401.

### `/api/client/*` (client realm)

Gated by `ClientAuthMiddleware`. Validates HS256 token signed with the org's `signing_secret`:
1. Extract `Authorization: Bearer <token>`.
2. Read `org_id` claim.
3. Look up `organisations.signing_secret` and verify HS256 signature.
4. On success, replace `HttpContext.User` with claims for `clientId`, `orgId`, `scope=client`.

### Anonymous exemptions

Explicitly skipped from `ClientAuthMiddleware` in `Program.cs`:
- `POST /api/client/phone/verify`, `POST /api/client/phone/confirm`
- `POST /api/client/portal-links/{slug}/scan`
- `GET /api/client/orgs/{orgId}`

Also anonymous (no middleware at all):
- `POST /api/auth/signup`, `login`, `refresh`, `forgot-password`
- `GET /health`

### User context

`UserContextMiddleware` runs after auth and writes a `UserContext` record to `HttpContext.Items["UserContext"]`. Controllers access it via `BaseService.GetUserContext()` to derive org id, scope, role, client/member id.

---

## 3. HTTP endpoints

68 endpoints total. All `/secure/*` require org-member or system auth. All `/api/client/*` require client JWT unless marked anonymous.

### 3.1 Org-member auth

File: `Backend.API/Controllers/AuthController.cs`, `Backend.API/Controllers/SecureAuthController.cs`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/auth/signup` | Anonymous | `SignUpRequest` | `AuthResponse` |
| POST | `/api/auth/login` | Anonymous | `LoginRequest` | `AuthResponse` |
| POST | `/api/auth/refresh` | Anonymous | `RefreshTokenRequest` | `AuthResponse` |
| POST | `/api/auth/forgot-password` | Anonymous | `ForgotPasswordRequest` | `{ message }` |
| POST | `/secure/auth/update-password` | Org-member | `UpdatePasswordRequest` | `{ message }` |

### 3.2 Client auth

File: `Backend.API/Controllers/ClientAuthController.cs`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/client/phone/verify` | Anonymous | `PhoneVerifyRequest` | `{ message }` |
| POST | `/api/client/phone/confirm` | Anonymous | `PhoneConfirmRequest` | `{ token, clientId, isNewClient, orgId }` |

### 3.3 Client portal entry (anonymous)

Files: `Backend.API/Controllers/ClientOrgInfoController.cs`, `Backend.API/Controllers/PortalScanController.cs`

| Method | Path | Auth | Params | Returns |
|---|---|---|---|---|
| GET | `/api/client/orgs/{orgId}` | Anonymous | path: `orgId: Guid` | `ClientOrgInfoResponse` |
| POST | `/api/client/portal-links/{slug}/scan` | Anonymous | path: `slug: string` | `PortalScanResponse` |

The scan endpoint mutates state (increments scan counter), hence POST.

### 3.4 Organisation & members

File: `Backend.API/Controllers/OrganisationController.cs`. Route prefix: `/secure/organisations`.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/secure/organisations` | `CreateOrganisationRequest` | `OrganisationResponse` |
| GET | `/secure/organisations` | — | `OrganisationResponse` |
| PATCH | `/secure/organisations/branding` | `UpdateBrandingRequest` | `OrganisationResponse` |
| PATCH | `/secure/organisations/onboarding-step` | `UpdateOnboardingStepRequest` | `OrganisationResponse` |
| POST | `/secure/organisations/complete-onboarding` | — | `OrganisationResponse` |
| GET | `/secure/organisations/members` | — | `MemberResponse[]` |
| POST | `/secure/organisations/invite` | `InviteUserRequest` | `{ message }` |
| POST | `/secure/organisations/accept-invite` | `AcceptInviteRequest` | `{ message }` |
| GET | `/secure/organisations/invitations` | — | `InvitationResponse[]` |
| DELETE | `/secure/organisations/members/{orgMemberId}` | — | `{ message }` |

### 3.5 Org-member profile

File: `Backend.API/Controllers/MeController.cs`. Route prefix: `/secure/me`.

| Method | Path | Body | Returns |
|---|---|---|---|
| PATCH | `/secure/me/profile` | `UpdateMyProfileRequest` | `MyProfileResponse` |
| POST | `/secure/me/heartbeat` | — | `{ lastSeenAt }` |
| POST | `/secure/me/end-shift` | — | `{ message }` |
| GET | `/secure/me/seat-assignment` | — | `SeatAssignmentResponse` \| 404 |

Other `/secure/me/*` routes are documented under [§3.8 Timeslot types](#38-timeslot-types) and [§3.9 Availability](#39-availability--patterns--exceptions).

### 3.6 Departments

File: `Backend.API/Controllers/DepartmentController.cs`.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/secure/departments` | — | `DepartmentResponse[]` |
| GET | `/secure/departments/{id}` | — | `DepartmentResponse` |
| POST | `/secure/departments` | `CreateDepartmentRequest` | `DepartmentResponse` |
| PUT | `/secure/departments/{id}` | `UpdateDepartmentRequest` | `DepartmentResponse` |
| DELETE | `/secure/departments/{id}` | — | `{ message }` |

### 3.7 Seats & sessions

Files: `Backend.API/Controllers/SeatController.cs`, `Backend.API/Controllers/SessionController.cs`.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/secure/seats` | — | `SeatResponse[]` |
| GET | `/secure/seats/{id}` | — | `SeatResponse` |
| GET | `/secure/departments/{departmentId}/seats` | — | `SeatResponse[]` |
| POST | `/secure/seats` | `CreateSeatRequest` | `SeatResponse` |
| PUT | `/secure/seats/{id}` | `UpdateSeatRequest` | `SeatResponse` |
| DELETE | `/secure/seats/{id}` | — | `{ message }` |
| POST | `/secure/seats/{id}/claim` | — | `SeatAssignmentResponse` |
| GET | `/secure/sessions/active` | — | `ActiveSessionsResponse` |

### 3.8 Timeslot types

Files: `Backend.API/Controllers/TimeslotTypeController.cs`, `Backend.API/Controllers/MeController.cs`.

**Org-wide:**

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/secure/timeslot-types` | — | `TimeslotTypeResponse[]` |
| GET | `/secure/timeslot-types/{id}` | — | `TimeslotTypeResponse` |
| POST | `/secure/timeslot-types` | `CreateTimeslotTypeRequest` | `TimeslotTypeResponse` |
| PUT | `/secure/timeslot-types/{id}` | `UpdateTimeslotTypeRequest` | `TimeslotTypeResponse` |
| PATCH | `/secure/timeslot-types/{id}/active` | `SetTimeslotTypeActiveRequest` | `TimeslotTypeResponse` |
| DELETE | `/secure/timeslot-types/{id}` | — | `{ message }` |

**Per-member opt-out:**

| Method | Path | Returns |
|---|---|---|
| GET | `/secure/me/timeslot-types` | `TimeslotTypeResponse[]` |
| POST | `/secure/me/timeslot-types/{id}/opt-in` | `{ message }` |
| DELETE | `/secure/me/timeslot-types/{id}/opt-in` | `{ message }` |

**Semantics**: a row in `org_user_timeslot_types` means **opted OUT** (semantics flipped from original). Every active member offers every active service by default. The API verbs (`opt-in`) are legacy labels.

### 3.9 Availability — patterns & exceptions

File: `Backend.API/Controllers/MeController.cs`.

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/secure/me/availability/patterns` | — | `PatternsResponse` |
| PUT | `/secure/me/availability/patterns` | `ReplacePatternsRequest` + `?force=bool` | `PatternsResponse` (200) or `PatternConflictResponse` (409) |
| GET | `/secure/me/availability/exceptions` | `?from=YYYY-MM-DD&to=YYYY-MM-DD` | `ExceptionResponse[]` |
| POST | `/secure/me/availability/exceptions` | `CreateExceptionRequest` | `ExceptionResponse` |
| DELETE | `/secure/me/availability/exceptions/{id}` | — | `{ message }` |

When `force=false`, the PUT returns 409 with a list of conflicting bookings; the client re-submits with `force=true` to override.

### 3.10 Public holidays

File: `Backend.API/Controllers/PublicHolidayController.cs`.

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/secure/public-holidays` | `?year=2026` | `PublicHolidayResponse[]` |
| POST | `/secure/public-holidays` | `CreatePublicHolidayRequest` | `PublicHolidayResponse` |
| DELETE | `/secure/public-holidays/{id}` | — | `{ message }` |

### 3.11 Portal links

Files: `Backend.API/Controllers/PortalLinkController.cs`, `Backend.API/Controllers/PortalScanController.cs`.

**Managed (org-member):**

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/secure/portal-links` | — | `PortalLinkResponse[]` |
| POST | `/secure/portal-links` | `CreatePortalLinkRequest` | `PortalLinkResponse` |
| DELETE | `/secure/portal-links/{id}` | — | `{ message }` |

**Public (anonymous):** see [§3.3](#33-client-portal-entry-anonymous).

### 3.12 Bookings — staff queue

File: `Backend.API/Controllers/QueueBookingController.cs`. Route prefix: `/secure/bookings`.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/secure/bookings` | — | `QueueResponse` |
| POST | `/secure/bookings/{id}/decision` | `BookingDecisionRequest` | `BookingResponse` |
| POST | `/secure/bookings/{id}/check-in` | `TransitionRequest?` | `BookingResponse` |
| POST | `/secure/bookings/{id}/start` | `TransitionRequest?` | `BookingResponse` |
| POST | `/secure/bookings/{id}/complete` | `TransitionRequest?` | `BookingResponse` |
| POST | `/secure/bookings/{id}/cancel` | `TransitionRequest?` | `BookingResponse` |
| POST | `/secure/bookings/{id}/no-show` | `TransitionRequest?` | `BookingResponse` |

State transitions are validated by [`BookingStateMachine`](#6-state-machines).

### 3.13 Bookings — client

File: `Backend.API/Controllers/ClientBookingController.cs`.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/client/bookings` | `CreateBookingRequest` | `BookingResponse` |
| GET | `/api/client/bookings/me` | — | `BookingResponse[]` |
| POST | `/api/client/bookings/{id}/cancel` | `CancelBookingRequest?` | `BookingResponse` |

**Booking creation** runs the full validation chain in `ClientBookingService.CreateAsync`:
1. Future datetime check.
2. Service active check.
3. Org-member exists in same org.
4. Seat resolution (explicit `seatId` or auto-resolve from active assignment).
5. Service opt-out check.
6. Effective availability check (patterns + exceptions + holidays merged).
7. No-overlap with existing concurrent bookings on the consultant.

Initial status is `pending_approval` if `seat.requires_approval = true`, otherwise `scheduled`. A 15-min soft-hold (`held_until`) is set on `pending_approval`.

### 3.14 Slot search

File: `Backend.API/Controllers/SlotController.cs`.

| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/api/client/slots` | `from: DateOnly`, `to: DateOnly`, `timeslotTypeId?: Guid`, `orgMemberId?: Guid` | `SlotSearchResponse` |

**`SlotSearchResponse`** has `Slots: SlotResponse[]` plus optional `EmptyReasons: EmptyReason[]` when zero slots are returned. Reasons are privacy-safe (first name only, no exception detail).

Priority of empty reasons (in `SlotSearchService.ClassifyEmpty`):
`Past(0) > PublicHoliday(1) > ServiceNotOffered(2) > FullyBooked(3) > ServiceTooLong(4) > Blocked(5) > OffToday(6) > NoEligibleMembers(7)`.

### 3.15 Notifications

Files: `Backend.API/Controllers/NotificationController.cs` (org-member), `Backend.API/Controllers/ClientNotificationController.cs` (client).

| Method | Path | Auth | Query | Returns |
|---|---|---|---|---|
| GET | `/secure/notifications` | Org-member | `status?`, `from?`, `to?`, `limit?` | `NotificationResponse[]` |
| GET | `/api/client/notifications` | Client | `bookingId?`, `limit?` | `NotificationResponse[]` |

### 3.16 Client profile & catalogs

File: `Backend.API/Controllers/ClientController.cs`. Client auth.

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/api/client/me` | — | `ClientProfileResponse` |
| PATCH | `/api/client/me` | `UpdateClientProfileRequest` | `ClientProfileResponse` |
| GET | `/api/client/timeslot-types` | — | `TimeslotTypeResponse[]` |
| GET | `/api/client/org-members` | `?timeslotTypeId=<guid>` | `ClientConsultantResponse[]` |

`listConsultants` mirrors `SlotSearchService` filter semantics: when `timeslotTypeId` is supplied, only members not opted-out of that service are returned.

### 3.17 Health

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/health` | Anonymous | `200 OK` |

Defined as a minimal API in `Program.cs`.

---

## 4. Background services

Six hosted services run in `Backend.API/BackgroundServices/`, registered via `AddHostedService<T>()` in `Program.cs`. All catch & log exceptions per tick (no crash on transient failure) and have no retry.

| Service | Cadence | Purpose | Repos / services | Side effects | Config |
|---|---|---|---|---|---|
| **NotificationDispatcher** | 30 s | Polls pending notifications (batch 50), resolves recipient phone, sends via `ISmsSender`, marks sent/failed. | `INotificationRepository`, `IClientRepository`, `ISmsSender` | Updates `notifications.status` / `sent_at` / `failed_reason`. Terminal failure (no auto-retry). | None |
| **DelayDetector** | 60 s | 3-phase tick: (1) in-service overrun → enqueue Waiting + Basic for client in service + up to N cascade for downstream bookings; (2) late-start scheduled → enqueue LateStart; (3) wait-extended checked-in → enqueue WaitExtended. Members from phase 1 are excluded from phases 2–3 to prevent duplicates. | `IBookingRepository`, `INotificationEnqueuer` | Enqueues 5 delay notification types. Dedup per booking + type via `Delay:DedupWindowMin`. | `Delay:*` (see §11) |
| **OtpCleanupService** | 1 h | Deletes `client_otp_codes` rows older than 24 h (OTPs have a 10-min lifetime; this is a hygiene sweep). | `IClientOtpCodeRepository` | Removes stale OTP rows. | None |
| **SoftHoldExpirer** | 60 s | Transitions `pending_approval` bookings whose `held_until` has passed to `expired`. Frees the partial-unique-index slot for new bookings. | `IBookingRepository`, `IBookingService` | Updates booking status to `expired`. | None |
| **NoShowTimer** | 60 s | Auto-marks `scheduled` bookings as `no_show` once `scheduled_start_at` is 15+ min in the past. Org users can manually mark earlier. | `IBookingRepository`, `IBookingService` | Updates booking status to `no_show`. | None (15-min grace hardcoded) |
| **SeatHeartbeatChecker** | 60 s | Ends `seat_assignments` whose `last_seen_at` is more than 5 min stale. Frees the per-seat unique index for another member. | `ISeatAssignmentRepository` | Sets `ended_at` on stale assignments. | None (5-min stale window hardcoded) |

All six are registered as `AddHostedService<T>()` in `Program.cs`. They run as singletons but resolve scoped dependencies via `IServiceScopeFactory` per tick.

---

## 5. Business services

Located in `Backend.Business/Services/`. Each implements an interface in `Backend.Business/Interfaces/`.

| Interface | Purpose |
|---|---|
| `IAuthService` | Org-member signup, login, token refresh, password update. |
| `IClientAuthService` | Client OTP request + confirm, issues HS256 client token. |
| `IOrganisationService` | Org CRUD, branding, onboarding, members, invitations, public info lookup. |
| `IOrgMemberService` | Org-member profile updates. |
| `IClientService` | Client profile + catalog (timeslot types, consultants). |
| `IDepartmentService` | Department CRUD. |
| `ISeatService` | Seat CRUD. |
| `ISeatAssignmentService` | Claim seat, heartbeat, end shift, list active sessions. |
| `ITimeslotTypeService` | Service type CRUD + per-member opt-in/opt-out. |
| `IPublicHolidayService` | Holiday CRUD, list by year. |
| `IAvailabilityService` | Patterns get/replace, exceptions list/create/delete, effective availability merge. |
| `IBookingService` | Pure booking creation (`BookingCreationInput`), status transitions, reschedule. Used by both client + queue services. |
| `IClientBookingService` | Client-facing booking: create, list mine, cancel. |
| `IQueueBookingService` | Staff queue state machine: decide, check-in, start, complete, cancel, no-show. |
| `ISlotSearchService` | Open-slot search; returns `SlotSearchResponse` with empty-reason taxonomy. |
| `INotificationService` | List notifications (org-member + client views). |
| `INotificationEnqueuer` | Enqueue SMS rows on booking events (approve, reject, check-in, call-next, 5 delay flavors). |
| `IPortalLinkService` | Portal link CRUD + scan. |

### Availability merging

`AvailabilityService.GetEffectiveAvailabilityAsync` produces `DayAvailability` (date + merged `TimeWindow[]`) for each day in range. Algorithm:

1. Start from recurring `availability_patterns` for the member, filtered by day-of-week.
2. **Subtract** `availability_exceptions` of type `blocked` and `break`.
3. **Union** `availability_exceptions` of type `extra_hours`.
4. If the date is a `public_holidays` row, clear all windows for that day.

`TimeWindowMerger` provides the interval arithmetic (`Merge`, `Union`, `Subtract`) over half-open `[Start, End)` windows.

---

## 6. State machines

### `BookingStateMachine`

File: `Backend.Business/Services/BookingStateMachine.cs`. The single source of truth for booking transitions; called from `BookingService.TransitionAsync`.

```csharp
public static void EnsureValidTransition(string from, string to, string actorType);
```

Allowed `(From, To, Actor)` triples:

| From | To | Actor |
|---|---|---|
| `pending_approval` | `scheduled` | `org_user` |
| `pending_approval` | `rejected` | `org_user` |
| `pending_approval` | `cancelled` | `client` / `org_user` |
| `pending_approval` | `expired` | `system` |
| `scheduled` | `checked_in` | `org_user` |
| `scheduled` | `cancelled` | `client` / `org_user` |
| `scheduled` | `no_show` | `system` / `org_user` |
| `checked_in` | `in_service` | `org_user` |
| `checked_in` | `cancelled` | `org_user` |
| `checked_in` | `no_show` | `org_user` |
| `in_service` | `completed` | `org_user` |
| `in_service` | `cancelled` | `org_user` |
| `in_service` | `no_show` | `org_user` |

Any other transition throws `ConflictException` (409). Terminal states (`completed`, `rejected`, `cancelled`, `no_show`, `expired`) reject all further transitions.

`in_service → no_show` is unusual but legitimate: the org user started by mistake, or the client walked out mid-session. `actualStart` is preserved (audit trail) and no SMS fires (`no_show` has no enqueue mapping).

---

## 7. Repositories

Located in `Backend.Repos/Repositories/`. Each implements an interface in `Backend.Repos/Interfaces/`. All use the Supabase C# client over PostgREST.

| Repository | Purpose |
|---|---|
| `IOrganisationRepository` | Orgs CRUD + invitations (create, get pending, list, mark accepted, delete). |
| `IOrgMemberRepository` | Staff members CRUD, lookup by Supabase auth user id. |
| `IDepartmentRepository` | Departments CRUD by org. |
| `ISeatRepository` | Seats CRUD by org / department. |
| `ISeatAssignmentRepository` | Claim, end, heartbeat-touch, list active, cleanup stale. |
| `ITimeslotTypeRepository` | Service types CRUD + active flag. |
| `IOrgUserTimeslotTypeRepository` | Per-member opt-out rows (presence = opted OUT). |
| `IAvailabilityPatternRepository` | Recurring patterns by member; bulk replace. |
| `IAvailabilityExceptionRepository` | Blocked/break/extra-hours exceptions. |
| `IPublicHolidayRepository` | Holiday dates per org. |
| `IClientRepository` | Clients per org: create, get, update profile, touch last-seen. |
| `IClientOtpCodeRepository` | OTP codes: create, get active, mark consumed, increment attempts, cleanup. |
| `IBookingRepository` | Bookings: create, get by id/org/member, list active/expired/overrun, late check-ins, reschedule, transition. |
| `IBookingStateHistoryRepository` | Audit log of transitions. |
| `IPortalLinkRepository` | Portal links: CRUD, get by slug, increment scan count. |
| `INotificationRepository` | Notifications: create, list pending/recent/by booking/by client, mark sent/failed. |

All repos derive from a base class providing the Supabase client + common scaffolding.

---

## 8. Domain model

Located in `Backend.Domain/`.

### Request DTOs

`SignUpRequest`, `LoginRequest`, `RefreshTokenRequest`, `UpdatePasswordRequest`, `ForgotPasswordRequest`, `PhoneVerifyRequest`, `PhoneConfirmRequest`, `UpdateClientProfileRequest`, `CreateBookingRequest`, `CancelBookingRequest`, `BookingDecisionRequest`, `TransitionRequest`, `CreateDepartmentRequest`, `UpdateDepartmentRequest`, `CreateSeatRequest`, `UpdateSeatRequest`, `CreateTimeslotTypeRequest`, `UpdateTimeslotTypeRequest`, `SetTimeslotTypeActiveRequest`, `CreatePublicHolidayRequest`, `CreateExceptionRequest`, `ReplacePatternsRequest`, `CreatePortalLinkRequest`, `CreateOrganisationRequest`, `UpdateBrandingRequest`, `UpdateOnboardingStepRequest`, `InviteUserRequest`, `AcceptInviteRequest`, `UpdateMyProfileRequest`, `SlotSearchRequest`.

### Response DTOs

`AuthResponse`, `ClientProfileResponse`, `ClientConsultantResponse`, `NotificationResponse`, `BookingResponse`, `QueueResponse`, `DepartmentResponse`, `SeatResponse`, `SeatAssignmentResponse`, `ActiveSessionResponse`, `ActiveSessionsResponse`, `TimeslotTypeResponse`, `PublicHolidayResponse`, `ExceptionResponse`, `PatternsResponse`, `PatternConflictResponse`, `ReplacePatternsResult`, `PortalLinkResponse`, `PortalScanResponse`, `OrganisationResponse`, `MemberResponse`, `InvitationResponse`, `ClientOrgInfoResponse`, `MyProfileResponse`, `SlotResponse`, `SlotSearchResponse`, `EmptyReason`.

### Enums (static string classes)

Values are the database-side strings used in queries.

| Class | Constants |
|---|---|
| `ActorType` | `Client` = `"client"`, `OrgUser` = `"org_user"`, `System` = `"system"` |
| `AuthScope` | `OrgMember` = `"OrgMember"`, `Client` = `"Client"` |
| `AvailabilityExceptionType` | `Blocked` = `"blocked"`, `Break` = `"break"`, `ExtraHours` = `"extra_hours"` |
| `BookingStatus` | `PendingApproval` = `"pending_approval"`, `Scheduled` = `"scheduled"`, `CheckedIn` = `"checked_in"`, `InService` = `"in_service"`, `Completed` = `"completed"`, `Rejected` = `"rejected"`, `Cancelled` = `"cancelled"`, `NoShow` = `"no_show"`, `Expired` = `"expired"`. **Active set:** `{PendingApproval, Scheduled, CheckedIn, InService}`. **Terminal set:** `{Completed, Rejected, Cancelled, NoShow, Expired}` |
| `MemberRole` | `SuperUser` = `"super_user"`, `OrgUser` = `"org_user"` |
| `NotificationChannel` | `Sms` = `"sms"`, `Whatsapp` = `"whatsapp"` |
| `NotificationStatus` | `Pending` = `"pending"`, `Sent` = `"sent"`, `Failed` = `"failed"` |
| `NotificationType` | `Approved` = `"approved"`, `Rejected` = `"rejected"`, `CheckedIn` = `"checked_in"`, `CallNext` = `"call_next"`, `DelayBasic` = `"delay_basic"`, `DelayWaiting` = `"delay_waiting"`, `DelayCascade` = `"delay_cascade"`, `DelayLateStart` = `"delay_late_start"`, `DelayWaitExtended` = `"delay_wait_extended"` |
| `PortalLinkScopeType` | `Org` = `"org"`, `Department` = `"department"`, `Seat` = `"seat"` |
| `EmptyReasonType` | `Past`, `PublicHoliday`, `OffToday`, `Blocked`, `ServiceTooLong`, `FullyBooked`, `NoEligibleMembers`, `ServiceNotOffered` |

### C# enum

| Enum | Values |
|---|---|
| `DelayKind` | `Basic`, `Waiting`, `Cascade`, `LateStart`, `WaitExtended` |

### Models

| Class | Purpose |
|---|---|
| `ActorContext` | Record: who performed an action (type + optional id). |
| `UserContext` | Authenticated user state: sub claim, scope, org id, role, client/member id. |
| `TimeWindow` | Read-only struct: half-open `[Start, End)` time-of-day window with overlap/contains checks. |
| `DayAvailability` | Date + merged `TimeWindow[]` after patterns/exceptions/holidays applied. |
| `OrganisationSettings` | JSON-shaped settings (`onboarding_step`, `onboarding_complete`). |
| `DelayMessageContext` | Input for SMS drafting: `DelayKind`, names, times, delay minutes. |
| `BookingCreationInput` | Input bag for `BookingService.CreateAsync`. |

### Exceptions

All in `Backend.Domain/Exceptions/`. The API maps each to its HTTP status code via a global exception filter.

| Class | HTTP |
|---|---|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `TooManyRequestsException` | 429 |
| `InternalServerErrorException` | 500 |
| `BadGatewayException` | 502 |
| `ServiceException` | Generic service-layer error |

---

## 9. Infrastructure (Backend.Services)

The `Backend.Services` project holds cross-cutting infrastructure that has no business knowledge.

### `Auth/`

- **`IClientTokenService` / `ClientTokenService`** — HS256 JWT signer for client tokens. Issues tokens containing `org_id`, `client_id`, `scope = "client"`. Decodes the per-org `signing_secret` (base64 or UTF-8) and validates incoming tokens.

### `Sms/`

- **`ISmsSender`** — `Task SendAsync(string phone, string body, CancellationToken ct)`.
- **`LoggingSmsSender`** (default) — logs to console; used when Twilio is not configured.
- **`TwilioSmsSender`** — Twilio implementation; activated when `Twilio:AccountSid` is present in config.

### `Supabase/`

- **`ISupabaseAdminClient` / `SupabaseAdminClient`** — HTTP wrapper around Supabase admin endpoints (service-role key). Methods: `UpdateUserMetadataAsync`, `UpdatePasswordAsync`, `DeleteUserAsync`, `RefreshSessionAsync`.

### `Notifications/`

- **`IDelayMessageDrafter`** — generates SMS body text from a `DelayMessageContext`.
- **`TemplateDelayMessageDrafter`** — template implementation that branches on `DelayKind` (Basic / Waiting / Cascade / LateStart / WaitExtended). Planned upgrade path: swap in a Claude-backed drafter behind the same interface.

### Registration

`Backend.Services/ServiceCollectionExtensions.cs` exposes `AddServices()`, which wires:
- `IClientTokenService` (singleton)
- `ISmsSender` → `LoggingSmsSender` (singleton)
- `ISupabaseAdminClient` (scoped)
- `IDelayMessageDrafter` → `TemplateDelayMessageDrafter` (singleton)
- HttpClient factory for typed clients.

---

## 10. DI registration & middleware pipeline

File: `Backend.API/Program.cs`.

### Service registration extensions

| Extension | Defined in | Registers |
|---|---|---|
| `AddServices()` | `Backend.Services/ServiceCollectionExtensions.cs` | Infrastructure (SMS, client token, Supabase admin, delay drafter) |
| `AddRepositories()` | `Backend.Repos/ServiceCollectionExtensions.cs` | All 16 `I*Repository` (scoped) |
| `AddBusinessServices()` | `Backend.Business/ServiceCollectionExtensions.cs` | All 18 `I*Service` (scoped) |

### Hosted services

```
AddHostedService<NotificationDispatcher>()
AddHostedService<DelayDetector>()
AddHostedService<OtpCleanupService>()
AddHostedService<SoftHoldExpirer>()
AddHostedService<NoShowTimer>()
AddHostedService<SeatHeartbeatChecker>()
```

### Middleware pipeline (in order)

1. `UseSwagger()`
2. `UseSwaggerUI()`
3. `UseRouting()`
4. `UseCors("corsapp")` — allow-all CORS (origins, methods, headers, credentials).
5. `UseAuthentication()` — Supabase JWKS (ES256).
6. `UseAuthorization()`
7. `UseWhen(/secure/*)` → `JwtAuthorizationMiddleware.AuthorizeAsync` — accepts API key OR Supabase JWT.
8. `UseWhen(/api/client/* minus exemptions)` → `ClientAuthMiddleware` — per-tenant HS256.
9. `UseMiddleware<UserContextMiddleware>()` — builds `UserContext` from claims.
10. `MapControllers()`
11. `MapGet("/health")` (minimal API).

---

## 11. Configuration (appsettings.json)

| Key | Purpose |
|---|---|
| `EnvironmentName` | Deployment environment label (local, staging, prod). |
| `Logging:LogLevel:Default` | Default log level. |
| `Logging:LogLevel:Microsoft.AspNetCore` | ASP.NET Core log level override. |
| `AllowedHosts` | Host filter for ASP.NET Core. |
| `SupabaseUrl` | Supabase project URL — used for JWKS + Supabase client. |
| `SupabaseKey` | Supabase anonymous key (public). |
| `SupabaseJwtSecret` | Legacy JWT signing secret (not used in JWKS flow). |
| `SupabaseServiceRoleKey` | Service-role key for `SupabaseAdminClient` (private). |
| `ApiKey` | Pre-shared system API key used by `JwtAuthorizationMiddleware`. |
| `InviteRedirectUrl` | Frontend URL the invite email links to. |
| `PasswordResetRedirectUrl` | Frontend URL the password-reset email links to. |
| `ClientPortalBaseUrl` | Client portal origin used for SMS deep links + CORS. |
| `Delay:InServiceOverrunMin` | Minutes overrun before head-of-queue delay notification (default 10). |
| `Delay:LateStartMin` | Minutes past scheduled start → late-start (default 5). |
| `Delay:LateCheckedInMin` | Minutes past scheduled start for checked-in clients → wait-extended (default 5). |
| `Delay:CascadeLookaheadMin` | Lookahead window for cascade notifications (default 90). |
| `Delay:CascadeMaxBookings` | Max downstream bookings to notify per overrun (default 10). |
| `Delay:DedupWindowMin` | Dedup window for booking + notification-type pair (default 1). |

When `Twilio:AccountSid` and related keys are present, `TwilioSmsSender` is selected over `LoggingSmsSender`.

---

## 12. Known issues & workarounds

### Postgrest LINQ-visitor 3+ clause bug (PGRST100)

Multi-clause `.Where(a == X && b == Y && c == Z)` with **3 or more conjuncts** serializes to `and.(...)` with a stray dot and is rejected by PostgREST as error `PGRST100`. Workaround is a flat `.Filter()` chain.

Repositories that use the workaround:
- `BookingRepository.GetActiveByOrgMemberAsync`
- `BookingRepository.GetNextScheduledForMemberAsync`
- `BookingRepository.GetExpiredHoldsAsync`
- `NotificationRepository.GetRecentByBookingAndTypeAsync`
- `NotificationRepository.GetByClientIdAsync`
- `AvailabilityExceptionRepository.GetByIdAsync`
- `AvailabilityExceptionRepository.DeleteAsync`

Apply the same pattern to any new repo query with 3+ predicates.

### Notification dispatcher has no retry

Failures are terminal — the `notifications` row is marked `failed` with a reason and never re-sent. A future ops endpoint will allow re-queueing.

### RLS deferred

Supabase Row-Level Security is intentionally deferred to a single pass once the feature surface stabilizes. The Supabase client is constructed with the anon key + user JWT (not service-role) from day 1, so enabling RLS later narrows access without breaking existing code. Service-role access is confined to `ISupabaseAdminClient`.
