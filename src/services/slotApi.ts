import api from './interceptor';
import type { SlotSearchQuery, SlotSearchResponse } from '@/types';

export function searchSlots(query: SlotSearchQuery) {
  // Flatten additionalTimeslotTypeIds into a single CSV query param so the
  // backend's [FromQuery] string consumer sees one stable key. Default
  // Axios serialisation would emit a repeated key, which the backend
  // doesn't currently parse.
  const { additionalTimeslotTypeIds, ...rest } = query;
  const params: Record<string, string | undefined> = { ...rest };
  if (additionalTimeslotTypeIds && additionalTimeslotTypeIds.length > 0) {
    params.additionalTimeslotTypeIds = additionalTimeslotTypeIds.join(',');
  }
  return api.request<SlotSearchResponse>({
    url: '/api/client/slots',
    method: 'GET',
    params,
  });
}
