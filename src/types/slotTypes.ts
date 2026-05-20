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
