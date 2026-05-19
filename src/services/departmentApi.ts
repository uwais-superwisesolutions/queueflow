import api from './interceptor';
import type {
  CreateDepartmentPayload,
  DepartmentResponse,
  UpdateDepartmentPayload,
} from '@/types';

export function listDepartments() {
  return api.request<DepartmentResponse[]>({
    url: '/secure/departments',
    method: 'GET',
  });
}

export function getDepartment(id: string) {
  return api.request<DepartmentResponse>({
    url: `/secure/departments/${id}`,
    method: 'GET',
  });
}

export function createDepartment(payload: CreateDepartmentPayload) {
  return api.request<DepartmentResponse>({
    url: '/secure/departments',
    method: 'POST',
    data: payload,
  });
}

export function updateDepartment(id: string, payload: UpdateDepartmentPayload) {
  return api.request<DepartmentResponse>({
    url: `/secure/departments/${id}`,
    method: 'PUT',
    data: payload,
  });
}

export function deleteDepartment(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/departments/${id}`,
    method: 'DELETE',
  });
}
