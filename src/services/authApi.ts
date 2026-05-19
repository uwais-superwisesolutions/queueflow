import api from './interceptor';
import type { AuthResponse, LoginPayload, SignUpPayload } from '@/types';

export function signUp(payload: SignUpPayload) {
  return api.request<AuthResponse>({
    url: '/api/auth/signup',
    method: 'POST',
    data: payload,
  });
}

export function login(payload: LoginPayload) {
  return api.request<AuthResponse>({
    url: '/api/auth/login',
    method: 'POST',
    data: payload,
  });
}
