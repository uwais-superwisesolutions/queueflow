import api from './interceptor';
import type { ActiveSessionsResponse, SeatAssignmentResponse } from '@/types';

// ---------- /secure/me/* (org user shift control) ----------

/** Returns the caller's active seat assignment, or null if not on shift. */
export function getMySeatAssignment() {
  return api.request<SeatAssignmentResponse | null>({
    url: '/secure/me/seat-assignment',
    method: 'GET',
  });
}

export function claimSeat(seatId: string) {
  return api.request<SeatAssignmentResponse>({
    url: `/secure/seats/${seatId}/claim`,
    method: 'POST',
  });
}

export function heartbeat() {
  return api.request<{ lastSeenAt: string }>({
    url: '/secure/me/heartbeat',
    method: 'POST',
  });
}

export function endShift() {
  return api.request<{ message: string }>({
    url: '/secure/me/end-shift',
    method: 'POST',
  });
}

export interface DelayPushResponse {
  shifted: number;
  notified: number;
}

/**
 * Org user pushes a manual delay onto their queue — every upcoming
 * scheduled/checked-in booking shifts forward by N minutes and each
 * affected client gets a delay SMS. Returns counts.
 */
export function pushDelay(minutes: number) {
  return api.request<DelayPushResponse>({
    url: '/secure/me/delay-push',
    method: 'POST',
    data: { minutes },
  });
}

// ---------- /secure/sessions/* (super user view) ----------

export function listActiveSessions() {
  return api.request<ActiveSessionsResponse>({
    url: '/secure/sessions/active',
    method: 'GET',
  });
}
