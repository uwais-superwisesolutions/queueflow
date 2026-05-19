import api from './interceptor';
import type { ClientProfileResponse } from '@/types';

export function getClientMe() {
  return api.request<ClientProfileResponse>({
    url: '/api/client/me',
    method: 'GET',
  });
}
