import api from './interceptor';
import type { ClientProfileResponse, UpdateClientProfilePayload } from '@/types';

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
