export interface SlotSearchQuery {
  from: string; // "YYYY-MM-DD"
  to: string;
  orgMemberId?: string;
  timeslotTypeId?: string;
}

export interface SlotResponse {
  orgMemberId: string;
  timeslotTypeId: string;
  startAt: string;
  endAt: string;
}

// Mirrors backend EmptyReasonType (Backend.Domain/DTOs/SlotDtos.cs). Open
// union so a new backend value renders as a generic empty state instead of
// breaking compile.
export type EmptyReasonType =
  | 'past'
  | 'public_holiday'
  | 'off_today'
  | 'blocked'
  | 'service_too_long'
  | 'fully_booked'
  | 'no_eligible_members'
  | 'service_not_offered'
  | (string & {});

export interface EmptyReason {
  date: string; // "YYYY-MM-DD"
  orgMemberId: string | null;
  orgMemberFirstName: string | null;
  reason: EmptyReasonType;
  detail: string | null;
}

export interface SlotSearchResponse {
  slots: SlotResponse[];
  emptyReasons: EmptyReason[] | null;
}
