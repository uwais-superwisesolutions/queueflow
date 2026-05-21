import api from './interceptor';
import type {
  ClientConsultantResponse,
  ClientOrgInfoResponse,
  ClientProfileResponse,
  NotificationResponse,
  TimeslotTypeResponse,
  UpdateClientProfilePayload,
} from '@/types';

/**
 * Anonymous lookup — no client JWT required (path is in Program.cs's
 * ClientAuthMiddleware exemption list). Used to render org branding on a
 * cold SMS link before the user has OTP'd in.
 */
export function getClientOrgInfo(orgId: string) {
  return api.request<ClientOrgInfoResponse>({
    url: `/api/client/orgs/${orgId}`,
    method: 'GET',
  });
}

export function getClientMe() {
  return api.request<ClientProfileResponse>({
    url: '/api/client/me',
    method: 'GET',
  });
}

export function updateClientMe(payload: UpdateClientProfilePayload) {
  return api.request<ClientProfileResponse>({
    url: '/api/client/me',
    method: 'PATCH',
    data: payload,
  });
}

export function listClientTimeslotTypes() {
  return api.request<TimeslotTypeResponse[]>({
    url: '/api/client/timeslot-types',
    method: 'GET',
  });
}

export function listClientConsultants(timeslotTypeId?: string) {
  return api.request<ClientConsultantResponse[]>({
    url: '/api/client/org-members',
    method: 'GET',
    params: timeslotTypeId ? { timeslotTypeId } : undefined,
  });
}

/**
 * Notifications addressed to the currently-authenticated client. Backend
 * scopes by JWT ClientId — passing a bookingId narrows further to that
 * booking's updates only.
 */
export function listMyClientNotifications(query: { bookingId?: string; limit?: number } = {}) {
  return api.request<NotificationResponse[]>({
    url: '/api/client/notifications',
    method: 'GET',
    params: query,
  });
}
