import { AxiosError } from 'axios';
import type { ApiErrorBody } from '@/types';

/**
 * Extract a human-readable message from a backend error.
 * The backend returns one of:
 *   { message: "..." }                          (standard exception filter)
 *   { displayMessage: "...", errorCode: "..." } (Supabase auth errors)
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.displayMessage) return body.displayMessage;
    if (body?.message) return body.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
