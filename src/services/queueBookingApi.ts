import api from './interceptor';
import type {
  BookingDecisionPayload,
  BookingResponse,
  BookingTransitionPayload,
  QueueResponse,
} from '@/types';

export function getQueue() {
  return api.request<QueueResponse>({
    url: '/secure/bookings',
    method: 'GET',
  });
}

export function bookingDecision(id: string, payload: BookingDecisionPayload) {
  return api.request<BookingResponse>({
    url: `/secure/bookings/${id}/decision`,
    method: 'POST',
    data: payload,
  });
}

function transition(id: string, segment: string, payload?: BookingTransitionPayload) {
  return api.request<BookingResponse>({
    url: `/secure/bookings/${id}/${segment}`,
    method: 'POST',
    data: payload ?? {},
  });
}

export const checkInBooking = (id: string, p?: BookingTransitionPayload) => transition(id, 'check-in', p);
export const startBooking = (id: string, p?: BookingTransitionPayload) => transition(id, 'start', p);
export const completeBooking = (id: string, p?: BookingTransitionPayload) => transition(id, 'complete', p);
export const cancelBooking = (id: string, p?: BookingTransitionPayload) => transition(id, 'cancel', p);
export const noShowBooking = (id: string, p?: BookingTransitionPayload) => transition(id, 'no-show', p);
