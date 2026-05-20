/**
 * Channel-name builders for the QueueFlow realtime contract.
 *
 * Defined in `REALTIME_CHANNELS.md` (backend repo). Phase 1 uses polling — the
 * channel names here are the stable identifiers we'll feed to `supabase-js`
 * once Phase 2 lands RLS + token pass-through.
 *
 * Today they're useful as:
 *   - cache keys
 *   - log identifiers
 *   - the `name` argument we'll pass to a future `useRealtimeChannel(name)`
 *
 * One place to edit when the swap happens.
 */

export function orgDashboardChannel(orgId: string): string {
  return `org:${orgId}:dashboard`;
}

export function seatQueueChannel(seatId: string): string {
  return `seat:${seatId}:queue`;
}

export function bookingChannel(bookingId: string): string {
  return `booking:${bookingId}`;
}

/**
 * Phase-1 poll intervals matching the lifecycle hooks each channel covers.
 * These are the same numbers used by the live screens — pull them from here
 * instead of re-declaring per file so we have one knob to tune.
 */
export const POLL_INTERVAL_MS = {
  orgDashboard: 30_000,
  seatQueue: 15_000,
  bookingStatus: 8_000,
  /** Seat heartbeat — backend's stale checker fires after 5 min of silence. */
  heartbeat: 30_000,
  /** NotificationDispatcher flushes every 30s — polling slower than that is fine. */
  notifications: 30_000,
} as const;
