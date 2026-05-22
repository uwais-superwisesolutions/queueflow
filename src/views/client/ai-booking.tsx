import { useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Button, Icon, Pill } from '@/components/ui';
import { postAIPrompt } from '@/services/aiBookingApi';
import { fmtTime, fmtDate, durationMinutes } from '@/lib/date';
import { describeEmptyReason } from '@/lib/empty-reason';
import { getApiErrorMessage } from '@/lib/api-error';
import type {
  AIBookingProposal,
  AIBookingResponse,
  AIMessage,
  SlotResponse,
} from '@/types';

interface ClientAIBookingScreenProps {
  /** Hand off a resolved slot to /client/confirm (same path as the manual picker). */
  onConfirmProposal: (slot: SlotResponse) => void;
  /** Drop back to the manual /client/slots picker. */
  onOpenManualPicker: () => void;
  onBack: () => void;
}

export function ClientAIBookingScreen({
  onConfirmProposal,
  onOpenManualPicker,
  onBack,
}: ClientAIBookingScreenProps) {
  const [prompt, setPrompt] = useState('');
  const [turnIndex, setTurnIndex] = useState<0 | 1>(0);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [history, setHistory] = useState<AIMessage[]>([]);
  const [response, setResponse] = useState<AIBookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!prompt.trim()) {
      setError('Type something to get started.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await postAIPrompt({
        prompt: prompt.trim(),
        turnIndex,
        history,
        conversationId,
      });
      setResponse(r.data);
      setHistory(r.data.history);
      setConversationId(r.data.conversationId);
      setPrompt(''); // clear so the user can answer a clarification cleanly
      if (r.data.kind === 'clarification') setTurnIndex(1);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reach the AI service.'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPrompt('');
    setTurnIndex(0);
    setConversationId(undefined);
    setHistory([]);
    setResponse(null);
    setError(null);
  };

  const handleConfirm = (proposal: AIBookingProposal) => {
    const start = proposal.scheduledStartAt;
    const endDt = new Date(new Date(start).getTime() + proposal.durationMinutes * 60_000);
    const slot: SlotResponse = {
      orgMemberId: proposal.orgMemberId,
      timeslotTypeId: proposal.timeslotTypeId,
      startAt: start,
      endAt: endDt.toISOString(),
    };
    onConfirmProposal(slot);
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-4"
        >
          <Icon name="chevronL" size={14} /> Back
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <Pill tone="teal" icon="sparkles">AI booking</Pill>
        </div>
        <h1 className="m-0 mb-1.5 text-[22px] font-medium tracking-[-0.02em]">
          {response?.kind === 'clarification'
            ? "Just one more thing."
            : "Tell us what you'd like to book."}
        </h1>
        <p className="m-0 mb-[18px] text-ink-3 text-[13.5px]">
          {response?.kind === 'clarification'
            ? response.clarification?.question ?? 'Could you clarify?'
            : 'Type it in plain English. We\'ll pick a real slot you can confirm.'}
        </p>

        {/* Proposal card */}
        {response?.kind === 'proposal' && response.proposal && (
          <ProposalCard
            proposal={response.proposal}
            onConfirm={() => handleConfirm(response.proposal!)}
            onTryAgain={reset}
          />
        )}

        {/* No-match panel */}
        {response?.kind === 'no_match' && (
          <NoMatchPanel
            reasons={response.noMatch?.reasons ?? []}
            suggestion={response.noMatch?.suggestion ?? null}
            onOpenManualPicker={onOpenManualPicker}
            onTryAgain={reset}
          />
        )}

        {/* Error banner (server / network errors). */}
        {response?.kind === 'error' && (
          <div
            className="rounded-[10px] border px-3.5 py-3 text-[12.5px] mb-3.5"
            role="alert"
            style={{
              background: 'var(--coral-tint)',
              borderColor: 'color-mix(in oklab, var(--coral) 30%, transparent)',
              color: 'var(--coral-2)',
            }}
          >
            {response.error ?? 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Prompt input — hidden once we have a non-clarification result; shown again on reset/clarification. */}
        {(response === null || response.kind === 'clarification' || response.kind === 'error') && (
          <>
            {response?.kind === 'clarification' && response.clarification?.suggestions?.length ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {response.clarification.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="border border-line-2 rounded-full px-2.5 py-1 text-[12px] bg-surface cursor-pointer hover:bg-surface-2 transition text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                response?.kind === 'clarification'
                  ? 'Type your answer…'
                  : 'e.g. Consult next Tuesday afternoon with Sarah'
              }
              rows={3}
              className="w-full bg-surface border border-line-2 rounded-[10px] px-3 py-2.5 text-[14px] text-ink outline-none resize-none focus:border-teal"
            />
            {error && (
              <div className="text-coral text-[12.5px] mt-1.5" role="alert">
                {error}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                variant="primary"
                onClick={submit}
                disabled={loading || !prompt.trim()}
                iconRight="arrowR"
                full
              >
                {loading ? 'Thinking…' : 'Send'}
              </Button>
            </div>
            <button
              type="button"
              onClick={onOpenManualPicker}
              className="mt-3 text-[12.5px] text-ink-3 bg-transparent border-0 p-0 cursor-pointer underline"
            >
              Use the manual picker instead
            </button>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

function ProposalCard({
  proposal,
  onConfirm,
  onTryAgain,
}: {
  proposal: AIBookingProposal;
  onConfirm: () => void;
  onTryAgain: () => void;
}) {
  const consultantName =
    `${proposal.orgMemberFirstName} ${proposal.orgMemberLastName}`.trim() ||
    'Your consultant';
  const start = proposal.scheduledStartAt;
  const endIso = new Date(new Date(start).getTime() + proposal.durationMinutes * 60_000).toISOString();

  return (
    <div className="border border-line rounded-[12px] bg-surface p-3.5 mb-3.5">
      <div className="text-[12px] text-ink-3 uppercase tracking-[0.04em] font-semibold mb-1.5">
        Suggested booking
      </div>
      <div className="text-[14.5px] font-medium leading-snug mb-1.5">
        {proposal.summary}
      </div>

      <div className="flex flex-col gap-1 text-[13px] text-ink-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Icon name="user" size={13} className="text-ink-3" />
          {consultantName}
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="clock" size={13} className="text-ink-3" />
          {proposal.timeslotTypeName} · {proposal.durationMinutes} min
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="calendar" size={13} className="text-ink-3" />
          {fmtDate(start)} · {fmtTime(start)}–{fmtTime(endIso)} ({durationMinutes(start, endIso)} min)
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={onConfirm} iconRight="arrowR" full>
          Confirm booking
        </Button>
      </div>
      <button
        type="button"
        onClick={onTryAgain}
        className="mt-2.5 text-[12.5px] text-ink-3 bg-transparent border-0 p-0 cursor-pointer underline"
      >
        Try a different prompt
      </button>
    </div>
  );
}

function NoMatchPanel({
  reasons,
  suggestion,
  onOpenManualPicker,
  onTryAgain,
}: {
  reasons: import('@/types').EmptyReason[];
  suggestion: string | null;
  onOpenManualPicker: () => void;
  onTryAgain: () => void;
}) {
  // Pick the first reason (the slot search returns one per (member, date)).
  // For Anyone-mode the consultant is rolled up — we don't know which the
  // user wanted, so render in non-consultant-selected mode.
  const reason = reasons[0];
  const copy = reason
    ? describeEmptyReason(reason, { consultantSelected: false, serviceName: null })
    : null;

  const tone = copy?.tone ?? 'amber';

  return (
    <div
      className="rounded-[10px] border px-3.5 py-3 text-[13px] mb-3.5"
      style={{
        background: tone === 'coral' ? 'var(--coral-tint)' : 'var(--amber-tint)',
        borderColor:
          tone === 'coral'
            ? 'color-mix(in oklab, var(--coral) 30%, transparent)'
            : 'color-mix(in oklab, var(--amber) 30%, transparent)',
      }}
    >
      <div className="font-medium mb-1">
        {copy?.title ?? "I couldn't find a slot"}
      </div>
      <div className="text-ink-2 mb-2.5">
        {copy?.body ?? suggestion ?? 'Try a different prompt or use the manual picker.'}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onOpenManualPicker}>
          Open manual picker
        </Button>
        <Button variant="ghost" size="sm" onClick={onTryAgain}>
          Try a different prompt
        </Button>
      </div>
    </div>
  );
}
