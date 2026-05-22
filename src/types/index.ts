export * from './authTypes';
export * from './organisationTypes';
export * from './departmentTypes';
export * from './seatTypes';
export * from './timeslotTypeTypes';
export * from './availabilityTypes';
export * from './publicHolidayTypes';
export * from './clientTypes';
export * from './slotTypes';
export * from './bookingTypes';
export * from './sessionTypes';
export * from './portalLinkTypes';
export * from './notificationTypes';
export * from './aiBookingTypes';

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

// UI nav model
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

// Mock/decorative types that the unwired analytics + dashboard widgets still rely on.
// These are NOT API shapes — they'll go away once analytics is wired.
export interface DailyStats {
  served: number;
  avgWait: number;
  avgService: number;
  noShows: number;
}

export interface AnalyticsDataPoint {
  date: string;
  bookings: number;
}

export interface Palette {
  label: string;
  '--teal': string;
  '--teal-2': string;
  '--teal-tint': string;
  '--teal-ink': string;
}
