export type BookingStatus =
  | 'pending_approval'
  | 'scheduled'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'no_show'
  | 'expired';

export interface BookingResponse {
  id: string;
  orgId: string;
  clientId: string | null;
  orgMemberId: string | null;
  seatId: string | null;
  timeslotTypeId: string | null;
  scheduledStartAt: string;
  scheduledEndAt: string;
  status: BookingStatus;
  heldUntil: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  rejectionReason: string | null;
  staffNotes: string | null;
  clientReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  /**
   * Optional. Provide when the client entered via a seat-scoped portal link.
   * When omitted, the backend resolves the seat from the chosen member's
   * currently active seat assignment.
   */
  seatId?: string | null;
  orgMemberId: string;
  timeslotTypeId: string;
  scheduledStartAt: string; // ISO-8601
  clientReason?: string | null;
}

export interface CancelBookingPayload {
  reason?: string | null;
}

// ---------- Org user queue ----------

export interface QueueResponse {
  pendingApproval: BookingResponse[];
  scheduled: BookingResponse[];
  checkedIn: BookingResponse[];
  inService: BookingResponse[];
}

export interface BookingDecisionPayload {
  decision: 'approve' | 'reject';
  reason?: string | null;
}

export interface BookingTransitionPayload {
  reason?: string | null;
}
