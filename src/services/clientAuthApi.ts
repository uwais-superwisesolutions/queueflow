import api from './interceptor';
import type {
  PhoneConfirmPayload,
  PhoneConfirmResponse,
  PhoneVerifyPayload,
} from '@/types';

export function requestClientOtp(payload: PhoneVerifyPayload) {
  return api.request<{ message: string }>({
    url: '/api/client/phone/verify',
    method: 'POST',
    data: payload,
  });
}

export function confirmClientOtp(payload: PhoneConfirmPayload) {
  return api.request<PhoneConfirmResponse>({
    url: '/api/client/phone/confirm',
    method: 'POST',
    data: payload,
  });
}
