/**
 * Mirrors NotificationResponse / NotificationStatus / NotificationType /
 * NotificationChannel on the backend (see Backend.Domain/Enums/Notification*.cs
 * and Backend.Domain/DTOs/NotificationDtos.cs).
 *
 * Status / channel / type are open string unions: the backend keeps them as
 * plain strings to avoid migration friction, so the frontend stays loose too.
 */

export type NotificationStatus = 'pending' | 'sent' | 'failed' | (string & {});
export type NotificationChannel = 'sms' | 'whatsapp' | (string & {});
export type NotificationType =
  | 'approved'
  | 'rejected'
  | 'call_next'
  | 'delay_basic'
  | (string & {});

export interface NotificationResponse {
  id: string;
  orgId: string;
  bookingId: string | null;
  clientId: string | null;
  channel: NotificationChannel;
  notificationType: NotificationType;
  body: string;
  status: NotificationStatus;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ListNotificationsQuery {
  status?: NotificationStatus;
  /** ISO-8601 datetime. */
  from?: string;
  /** ISO-8601 datetime. */
  to?: string;
  /** Backend clamps to [1, 200]; default 50. */
  limit?: number;
}
