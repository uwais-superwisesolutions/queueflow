import api from './interceptor';
import type {
  CreateExceptionPayload,
  ExceptionResponse,
  PatternConflictResponse,
  PatternsResponse,
  ReplacePatternsPayload,
} from '@/types';

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

export function getMyAvailabilityPatterns() {
  return api.request<PatternsResponse>({
    url: '/secure/me/availability/patterns',
    method: 'GET',
  });
}

/**
 * Returns either the freshly written patterns (200) or a conflict list (409).
 * The caller inspects `response.status` to differentiate.
 */
export function replaceMyAvailabilityPatterns(
  payload: ReplacePatternsPayload,
  force = false,
) {
  return api.request<PatternsResponse | PatternConflictResponse>({
    url: '/secure/me/availability/patterns',
    method: 'PUT',
    params: { force },
    data: payload,
    // Don't throw on 409 — we want to surface the conflicts to the UI.
    validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
  });
}

// ---------------------------------------------------------------------------
// Exceptions
// ---------------------------------------------------------------------------

export function listMyAvailabilityExceptions(params?: { from?: string; to?: string }) {
  return api.request<ExceptionResponse[]>({
    url: '/secure/me/availability/exceptions',
    method: 'GET',
    params,
  });
}

export function createMyAvailabilityException(payload: CreateExceptionPayload) {
  return api.request<ExceptionResponse>({
    url: '/secure/me/availability/exceptions',
    method: 'POST',
    data: payload,
  });
}

export function deleteMyAvailabilityException(id: string) {
  return api.request<{ message: string }>({
    url: `/secure/me/availability/exceptions/${id}`,
    method: 'DELETE',
  });
}
