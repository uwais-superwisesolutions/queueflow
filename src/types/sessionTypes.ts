import type { MemberRole } from './authTypes';

export interface SeatAssignmentResponse {
  id: string;
  seatId: string;
  orgMemberId: string;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
}

export interface ActiveSessionResponse {
  assignmentId: string;
  seatId: string;
  seatName: string;
  orgMemberId: string;
  memberName: string;
  memberRole: MemberRole;
  startedAt: string;
  lastSeenAt: string;
}

export interface ActiveSessionsResponse {
  sessions: ActiveSessionResponse[];
}
