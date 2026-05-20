import api from './interceptor';
import type { MyProfileResponse, UpdateMyProfilePayload } from '@/types';

export function updateMyProfile(payload: UpdateMyProfilePayload) {
  return api.request<MyProfileResponse>({
    url: '/secure/me/profile',
    method: 'PATCH',
    data: payload,
  });
}
