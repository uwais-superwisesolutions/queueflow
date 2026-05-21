import type { NotificationType } from '@/types';

export type NotificationTone = 'coral' | 'amber' | 'blue';

export interface NotificationDescription {
  tone: NotificationTone;
  title: string;
}

/**
 * Shared display mapping for backend NotificationType strings. Used by both
 * the full notifications page (`orguser/dashboard.tsx → NotificationsView`)
 * and the compact panel on the live queue (`orguser/live-queue.tsx →
 * NotificationPanel`) so the two surfaces never disagree on labels.
 */
export function describeNotification(type: NotificationType): NotificationDescription {
  switch (type) {
    case 'approved':
      return { tone: 'blue', title: 'Booking approved' };
    case 'rejected':
      return { tone: 'coral', title: 'Booking rejected' };
    case 'checked_in':
      return { tone: 'blue', title: 'Client checked in' };
    case 'call_next':
      return { tone: 'amber', title: 'Client called next' };
    case 'delay_basic':
      return { tone: 'coral', title: 'Delay alert sent' };
    case 'delay_waiting':
      return { tone: 'amber', title: 'Waiting-room delay alert' };
    case 'delay_cascade':
      return { tone: 'amber', title: 'Downstream delay notice' };
    case 'delay_late_start':
      return { tone: 'coral', title: 'Late-start alert sent' };
    case 'delay_wait_extended':
      return { tone: 'coral', title: 'Extended-wait apology sent' };
    default:
      return { tone: 'blue', title: 'Notification' };
  }
}
