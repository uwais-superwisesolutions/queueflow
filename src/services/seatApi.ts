import api from './interceptor';
import type { CreateSeatPayload, SeatResponse, UpdateSeatPayload } from '@/types';

export function listSeats() {
  return api.request<SeatResponse[]>({
    url: '/secure/seats',
    method: 'GET',
  });
}

export function listSeatsByDepartment(departmentId: string) {
  return api.request<SeatResponse[]>({
    url: `/secure/departments/${departmentId}/seats`,
    method: 'GET',
  });
}

export function getSeat(id: string) {
  return api.request<SeatResponse>({
    url: `/secure/seats/${id}`,
    method: 'GET',
  });
}

export function createSeat(payload: CreateSeatPayload) {
  return api.request<SeatResponse>({
    url: '/secure/seats',
    method: 'POST',
    data: payload,
  });
}

export function updateSeat(id: string, payload: UpdateSeatPayload) {
  return api.request<SeatResponse>({
    url: `/secure/seats/${id}`,
    method: 'PUT',
    data: payload,
  });
}

export function deleteSeat(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/seats/${id}`,
    method: 'DELETE',
  });
}
