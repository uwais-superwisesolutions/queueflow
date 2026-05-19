import api from './interceptor';
import type {
  CreateTimeslotTypePayload,
  SetTimeslotTypeActivePayload,
  TimeslotTypeResponse,
  UpdateTimeslotTypePayload,
} from '@/types';

// ---------------------------------------------------------------------------
// Catalogue (super_user mutates)
// ---------------------------------------------------------------------------

export function listTimeslotTypes() {
  return api.request<TimeslotTypeResponse[]>({
    url: '/secure/timeslot-types',
    method: 'GET',
  });
}

export function getTimeslotType(id: string) {
  return api.request<TimeslotTypeResponse>({
    url: `/secure/timeslot-types/${id}`,
    method: 'GET',
  });
}

export function createTimeslotType(payload: CreateTimeslotTypePayload) {
  return api.request<TimeslotTypeResponse>({
    url: '/secure/timeslot-types',
    method: 'POST',
    data: payload,
  });
}

export function updateTimeslotType(id: string, payload: UpdateTimeslotTypePayload) {
  return api.request<TimeslotTypeResponse>({
    url: `/secure/timeslot-types/${id}`,
    method: 'PUT',
    data: payload,
  });
}

export function setTimeslotTypeActive(id: string, payload: SetTimeslotTypeActivePayload) {
  return api.request<TimeslotTypeResponse>({
    url: `/secure/timeslot-types/${id}/active`,
    method: 'PATCH',
    data: payload,
  });
}

export function deleteTimeslotType(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/timeslot-types/${id}`,
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Per-member opt-in
// ---------------------------------------------------------------------------

export function listMyTimeslotTypes() {
  return api.request<TimeslotTypeResponse[]>({
    url: '/secure/me/timeslot-types',
    method: 'GET',
  });
}

export function optInTimeslotType(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/me/timeslot-types/${id}/opt-in`,
    method: 'POST',
  });
}

export function optOutTimeslotType(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/me/timeslot-types/${id}/opt-in`,
    method: 'DELETE',
  });
}
