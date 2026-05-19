export type AvailabilityExceptionType = 'blocked' | 'break' | 'extra_hours';

export interface AvailabilityPattern {
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  startTime: string; // "HH:mm:ss"
  endTime: string;
}

export interface ReplacePatternsPayload {
  patterns: AvailabilityPattern[];
}

export interface PatternsResponse {
  patterns: AvailabilityPattern[];
}

export interface PatternConflict {
  bookingId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  clientName: string | null;
}

export interface PatternConflictResponse {
  conflicts: PatternConflict[];
}

export interface CreateExceptionPayload {
  date: string; // "YYYY-MM-DD"
  exceptionType: AvailabilityExceptionType;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
}

export interface ExceptionResponse {
  id: string;
  date: string;
  exceptionType: AvailabilityExceptionType;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
}
