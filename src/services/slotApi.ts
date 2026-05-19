import api from './interceptor';
import type { SlotResponse, SlotSearchQuery } from '@/types';

export function searchSlots(query: SlotSearchQuery) {
  return api.request<SlotResponse[]>({
    url: '/api/client/slots',
    method: 'GET',
    params: query,
  });
}
