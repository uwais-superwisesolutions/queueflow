export * from './authTypes';
export * from './organisationTypes';

export type Tone = 'neutral' | 'teal' | 'amber' | 'blue' | 'coral' | 'success';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'outline' | 'teal-tint';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconName =
  | 'search' | 'chevronR' | 'chevronD' | 'chevronL' | 'chevronU'
  | 'plus' | 'minus' | 'check' | 'x'
  | 'user' | 'users' | 'bell' | 'calendar' | 'clock' | 'settings'
  | 'grid' | 'list' | 'trash' | 'pencil' | 'link' | 'qr' | 'copy'
  | 'arrowR' | 'arrowL' | 'phone' | 'shield' | 'zap' | 'send'
  | 'building' | 'chair' | 'sparkles' | 'alert' | 'info'
  | 'dotsH' | 'filter' | 'download' | 'refresh' | 'logout' | 'qDots';

export interface Department {
  id: string;
  name: string;
}

export interface Seat {
  id: string;
  name: string;
  departmentId: string;
  claimedBy?: string;
  isActive: boolean;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  seatId?: string;
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string;
}

export interface TimeslotType {
  id: string;
  name: string;
  durationMinutes: number;
  color: string;
  usageCount: number;
}

export type BookingStatus =
  | 'pending_approval'
  | 'approved'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'no_show';

export interface Booking {
  id: string;
  clientName: string;
  clientPhone?: string;
  timeslotType: string;
  reason?: string;
  status: BookingStatus;
  seatId: string;
  position: number;
  requestedAt: string;
  approvedAt?: string;
  checkedInAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  heldUntil?: string;
  estimatedDuration: number;
}

export interface QueueState {
  inService: Booking | null;
  checkedIn: Booking[];
  pending: Booking[];
  scheduled: Booking[];
}

export interface DailyStats {
  served: number;
  avgWait: number;
  avgService: number;
  noShows: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  count?: number;
  heading?: string;
}

export interface SidebarNavItem {
  id?: string;
  label?: string;
  icon?: IconName;
  count?: number;
  heading?: string;
}

export interface ClientPortalLink {
  id: string;
  label: string;
  scope: string;
  url: string;
  qrSeed: string;
  usageCount: number;
  createdAt: string;
}

export interface AnalyticsDataPoint {
  date: string;
  bookings: number;
}

export interface WeekAvailability {
  dayIndex: number;
  startHour: number;
  endHour: number;
  hasConflict?: boolean;
}

export interface Notification {
  id: string;
  type: 'approval' | 'checkin' | 'cancellation' | 'system';
  message: string;
  time: string;
  read: boolean;
}

export interface Palette {
  label: string;
  '--teal': string;
  '--teal-2': string;
  '--teal-tint': string;
  '--teal-ink': string;
}
