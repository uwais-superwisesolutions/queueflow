import api from './interceptor';
import type { BookingResponse, CancelBookingPayload, CreateBookingPayload } from '@/types';

export function createClientBooking(payload: CreateBookingPayload) {
  return api.request<BookingResponse>({
    url: '/api/client/bookings',
    method: 'POST',
    data: payload,
  });
}

export function listMyClientBookings() {
  return api.request<BookingResponse[]>({
    url: '/api/client/bookings/me',
    method: 'GET',
  });
}

export function cancelMyClientBooking(id: string, payload?: CancelBookingPayload) {
  return api.request<BookingResponse>({
    url: `/api/client/bookings/${id}/cancel`,
    method: 'POST',
    data: payload ?? {},
  });
}
