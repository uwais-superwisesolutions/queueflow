import api from './interceptor';
import type { CreatePublicHolidayPayload, PublicHolidayResponse } from '@/types';

export function listPublicHolidays(year?: number) {
  return api.request<PublicHolidayResponse[]>({
    url: '/secure/public-holidays',
    method: 'GET',
    params: year ? { year } : undefined,
  });
}

export function createPublicHoliday(payload: CreatePublicHolidayPayload) {
  return api.request<PublicHolidayResponse>({
    url: '/secure/public-holidays',
    method: 'POST',
    data: payload,
  });
}

export function deletePublicHoliday(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/public-holidays/${id}`,
    method: 'DELETE',
  });
}
