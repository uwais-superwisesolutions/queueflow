import api from './interceptor';
import type { ListNotificationsQuery, NotificationResponse } from '@/types';

export function listNotifications(query: ListNotificationsQuery = {}) {
  return api.request<NotificationResponse[]>({
    url: '/secure/notifications',
    method: 'GET',
    params: query,
  });
}
