import api from './interceptor';
import type { AIBookingPayload, AIBookingResponse } from '@/types';

export function postAIPrompt(payload: AIBookingPayload) {
  return api.request<AIBookingResponse>({
    url: '/api/client/ai/book',
    method: 'POST',
    data: payload,
  });
}
