import api from './interceptor';
import type {
  ClientConsultantResponse,
  ClientProfileResponse,
  TimeslotTypeResponse,
  UpdateClientProfilePayload,
} from '@/types';

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
