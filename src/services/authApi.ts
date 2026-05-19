import axios from 'axios';
import api from './interceptor';
import type { AuthResponse, LoginPayload, RefreshTokenPayload, SignUpPayload } from '@/types';

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

/**
 * Refreshes the org-member session.
 *
 * Uses a raw axios call (not the shared `api` instance) so:
 *   - The request interceptor doesn't attach the expired Bearer.
 *   - A 401 from refresh itself doesn't recurse through the retry interceptor.
 */
export function refreshSession(payload: RefreshTokenPayload) {
  return axios.request<AuthResponse>({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    url: '/api/auth/refresh',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  });
}
