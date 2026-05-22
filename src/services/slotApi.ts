import api from './interceptor';
import type { SlotSearchQuery, SlotSearchResponse } from '@/types';

export function searchSlots(query: SlotSearchQuery) {
  return api.request<SlotSearchResponse>({
    url: '/api/client/slots',
    method: 'GET',
    params: query,
  });
}
