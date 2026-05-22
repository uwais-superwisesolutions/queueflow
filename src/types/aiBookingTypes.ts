import type { EmptyReason } from './slotTypes';

export type AIBookingKind = 'proposal' | 'clarification' | 'no_match' | 'error';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIBookingProposal {
  timeslotTypeId: string;
  timeslotTypeName: string;
  orgMemberId: string;
  orgMemberFirstName: string;
  orgMemberLastName: string;
  scheduledStartAt: string; // ISO-8601
  durationMinutes: number;
  summary: string;
}

export interface AIBookingClarification {
  question: string;
  suggestions?: string[] | null;
}

export interface AIBookingNoMatch {
  reasons: EmptyReason[];
  suggestion?: string | null;
}

export interface AIBookingPayload {
  prompt: string;
  /** 0 = first turn. 1 = answer to a clarification. */
  turnIndex: 0 | 1;
  history?: AIMessage[];
  conversationId?: string;
}

export interface AIBookingResponse {
  kind: AIBookingKind;
  proposal?: AIBookingProposal | null;
  clarification?: AIBookingClarification | null;
  noMatch?: AIBookingNoMatch | null;
  conversationId: string;
  history: AIMessage[];
  /** Populated only when kind === 'error'. */
  error?: string | null;
}
