/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Pill, SkeletonBox, Field, SelectInput } from '@/components/ui';
import { searchSlots } from '@/services/slotApi';
import { listClientConsultants, listClientTimeslotTypes } from '@/services/clientApi';
import { fmtTime, durationMinutes } from '@/lib/date';
import { getApiErrorMessage } from '@/lib/api-error';
import type {
  ClientConsultantResponse,
  EmptyReason,
  SlotResponse,
  TimeslotTypeResponse,
} from '@/types';

export interface SlotSelection {
  /** Original SlotResponse — handed off to the confirmation screen. */
  slot: SlotResponse;
  /** What we display to the user on confirm (short label). */
  label: string;
  /** Extra services chosen on the slot picker; forwarded into createClientBooking. */
  additionalTimeslotTypeIds?: string[];
}

interface ClientSlotPickerScreenProps {
  onSelect: (sel: SlotSelection) => void;
  onBack: () => void;
}

const ANY_CONSULTANT = '';

function isoDate(d: Date): string {
  // Use local-time YYYY-MM-DD so picking "today" doesn't drift to "yesterday"
  // in timezones west of UTC, where toISOString() rolls back.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtFriendlyDate(isoDateString: string): string {
  // YYYY-MM-DD → "22 May 2026" using the user's locale ordering.
  const [y, m, d] = isoDateString.split('-').map(Number);
  if (!y || !m || !d) return isoDateString;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface EmptyCopy {
  tone: 'coral' | 'amber';
  title: string;
  body: string;
}

/**
 * Maps an EmptyReason into rendered copy. When the consultant filter is
 * "Anyone" we soften the message — naming a specific consultant doesn't
 * make sense when the user explicitly asked the system to pick. For all
 * other reasons we use the first-name from the backend (which only ever
 * sends a first name, never a full name or exception detail).
 */
function describeEmptyReason(
  reason: EmptyReason,
  options: { consultantSelected: boolean; serviceName: string | null },
): EmptyCopy {
  const dateLabel = fmtFriendlyDate(reason.date);
  const name = reason.orgMemberFirstName ?? 'Your consultant';
  const service = options.serviceName ?? 'this service';

  if (reason.reason === 'past') {
    return {
      tone: 'coral',
      title: 'Date is in the past',
      body: 'Pick today or a future date.',
    };
  }

  if (reason.reason === 'public_holiday') {
    return {
      tone: 'amber',
      title: 'Public holiday',
      body: `Closed for the public holiday on ${dateLabel}.`,
    };
  }

  // For Anyone mode, the reason rolled up across all eligible consultants —
  // naming one of them is misleading. Use a generic message.
  if (!options.consultantSelected) {
    if (reason.reason === 'no_eligible_members') {
      return {
        tone: 'amber',
        title: 'No consultants offer this yet',
        body: `${service} isn't offered by any consultant right now.`,
      };
    }
    return {
      tone: 'amber',
      title: 'No openings',
      body: `No consultants are available for ${service} on ${dateLabel}. Try a different date.`,
    };
  }

  switch (reason.reason) {
    case 'service_not_offered':
      return {
        tone: 'coral',
        title: `${name} doesn't offer ${service}`,
        body: `${name} doesn't offer ${service}. Pick another consultant or a different service.`,
      };
    case 'blocked':
      return {
        tone: 'coral',
        title: `${name} is unavailable`,
        body: `${name} isn't available on ${dateLabel}. Try a different date or pick another consultant.`,
      };
    case 'off_today':
      return {
        tone: 'amber',
        title: `${name} isn't working`,
        body: `${name} isn't working on ${dateLabel}. Try a different date or pick another consultant.`,
      };
    case 'service_too_long':
      return {
        tone: 'coral',
        title: "Service doesn't fit",
        body: `${name}'s working hours on ${dateLabel} are too short for a ${service} (${reason.detail ?? 'long appointment'}).`,
      };
    case 'fully_booked':
      return {
        tone: 'amber',
        title: `${name} is fully booked`,
        body: `${name} is fully booked on ${dateLabel}. Try a different date or pick another consultant.`,
      };
    case 'no_eligible_members':
      return {
        tone: 'amber',
        title: 'No consultants',
        body: `${service} isn't offered by any consultant right now.`,
      };
    default:
      return {
        tone: 'amber',
        title: 'No openings',
        body: 'Try a different date or service.',
      };
  }
}

export function ClientSlotPickerScreen({ onSelect, onBack }: ClientSlotPickerScreenProps) {
  const today = useMemo(() => isoDate(new Date()), []);
  const horizonMax = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return isoDate(d);
  }, []);

  // Filters
  const [date, setDate] = useState(today);
  const [timeslotTypeId, setTimeslotTypeId] = useState<string>('');
  // Extra services stacked back-to-back on top of the primary. UI is
  // opt-in — the default flow stays single-service.
  const [additionalIds, setAdditionalIds] = useState<string[]>([]);
  const [consultantId, setConsultantId] = useState<string>(ANY_CONSULTANT);

  // Catalog (timeslot types + consultants for the org)
  const [timeslotTypes, setTimeslotTypes] = useState<TimeslotTypeResponse[]>([]);
  const [consultants, setConsultants] = useState<ClientConsultantResponse[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Slots
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  // Backend explains *why* there are no slots when the result is empty. We
  // keep just the first reason (the backend sorts them by priority — most
  // actionable first).
  const [emptyReason, setEmptyReason] = useState<EmptyReason | null>(null);

  // Load timeslot types once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const typesRes = await listClientTimeslotTypes();
        if (cancelled) return;
        setTimeslotTypes(typesRes.data);
        // Auto-select the only timeslot type if there's one — saves a click.
        if (typesRes.data.length === 1) {
          setTimeslotTypeId(typesRes.data[0].id);
        }
      } catch (err) {
        if (!cancelled) setCatalogError(getApiErrorMessage(err, 'Could not load services.'));
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch consultants whenever the chosen service changes. With no service,
  // we load the full org member list so the dropdown is populated as soon as
  // the user picks one. With a service, the list narrows to opted-in members.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listClientConsultants(timeslotTypeId || undefined);
        if (cancelled) return;
        setConsultants(res.data);
        // If the previously-chosen consultant isn't in the narrowed list, drop
        // back to "Anyone available" so the slot search doesn't 404 on them.
        if (consultantId && !res.data.some((c) => c.orgMemberId === consultantId)) {
          setConsultantId(ANY_CONSULTANT);
        }
      } catch {
        // Non-fatal — keep the dropdown empty rather than blocking the screen.
        if (!cancelled) setConsultants([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // consultantId intentionally excluded — we only refetch on service change.
  }, [timeslotTypeId]);

  // Reload slots whenever the filter set is complete.
  useEffect(() => {
    if (!timeslotTypeId) {
      setSlots([]);
      setEmptyReason(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const resp = await searchSlots({
          from: date,
          to: date,
          timeslotTypeId,
          orgMemberId: consultantId || undefined,
          additionalTimeslotTypeIds: additionalIds.length > 0 ? additionalIds : undefined,
        });
        if (cancelled) return;
        // Sort ascending by start time so the grid + earliest-available read
        // chronologically.
        const sorted = [...resp.data.slots].sort((a, b) => a.startAt.localeCompare(b.startAt));
        setSlots(sorted);
        setEmptyReason(resp.data.emptyReasons?.[0] ?? null);
      } catch (err) {
        if (!cancelled) setSlotsError(getApiErrorMessage(err, 'Could not load slots.'));
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, timeslotTypeId, consultantId, additionalIds]);

  // When "Anyone" is selected, the backend returns one slot per (consultant,
  // time) pair — collapse to one tile per time. We retain the first available
  // consultant for that time and forward that slot to the confirmation screen.
  const visibleSlots = useMemo(() => {
    if (consultantId) return slots;
    const seen = new Set<string>();
    const deduped: SlotResponse[] = [];
    for (const s of slots) {
      if (seen.has(s.startAt)) continue;
      seen.add(s.startAt);
      deduped.push(s);
    }
    return deduped;
  }, [slots, consultantId]);

  const earliest = visibleSlots[0];

  const handleSelect = (slot: SlotResponse) => {
    onSelect({
      slot,
      label: `${fmtTime(slot.startAt)} · ${durationMinutes(slot.startAt, slot.endAt)} min`,
      additionalTimeslotTypeIds:
        additionalIds.filter(Boolean).length > 0 ? additionalIds.filter(Boolean) : undefined,
    });
  };

  const timeslotTypeOptions = useMemo(
    () => [
      { value: '', label: 'Select a service…', disabled: true },
      ...timeslotTypes.map((t) => ({
        value: t.id,
        label: `${t.name} · ${t.durationMinutes} min`,
      })),
    ],
    [timeslotTypes],
  );

  const durationByTypeId = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of timeslotTypes) map.set(t.id, t.durationMinutes);
    return map;
  }, [timeslotTypes]);

  // Sum of (primary + extras) durations, used in the "Total: X min" label
  // and to gate the "+ Add another service" affordance once nothing more
  // could possibly fit.
  const totalMinutes = useMemo(() => {
    if (!timeslotTypeId) return 0;
    let sum = durationByTypeId.get(timeslotTypeId) ?? 0;
    for (const id of additionalIds) sum += durationByTypeId.get(id) ?? 0;
    return sum;
  }, [timeslotTypeId, additionalIds, durationByTypeId]);

  // Services that are still selectable as an *additional* row — exclude the
  // primary and any already-picked extras to keep one service per slot.
  const optionsForExtra = (excludeId?: string): { value: string; label: string; disabled?: boolean }[] => {
    const used = new Set<string>([timeslotTypeId, ...additionalIds].filter(Boolean));
    if (excludeId) used.delete(excludeId);
    return [
      { value: '', label: 'Pick a service…', disabled: true },
      ...timeslotTypes
        .filter((t) => !used.has(t.id))
        .map((t) => ({ value: t.id, label: `${t.name} · ${t.durationMinutes} min` })),
    ];
  };

  const canAddAnother =
    !!timeslotTypeId &&
    timeslotTypes.length > 1 + additionalIds.length &&
    // last row must have been filled before adding a new one
    additionalIds.every((id) => id);

  const consultantOptions = useMemo(
    () => [
      { value: ANY_CONSULTANT, label: 'Anyone available' },
      ...consultants.map((c) => ({ value: c.orgMemberId, label: c.fullName })),
    ],
    [consultants],
  );

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-4"
        >
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 className="m-0 mb-1.5 text-[22px] font-medium tracking-[-0.02em]">
          Choose how you'd like to be seen.
        </h1>
        <p className="m-0 mb-[18px] text-ink-3 text-[13.5px]">
          Pick a date and the kind of appointment — open slots appear below.
        </p>

        {/* Filter card */}
        <div className="border border-line rounded-[12px] bg-surface p-3.5 mb-3.5 flex flex-col gap-2.5">
          <Field label="Date">
            <input
              type="date"
              value={date}
              min={today}
              max={horizonMax}
              onChange={(e) => setDate(e.target.value || today)}
              className="bg-surface border border-line-2 rounded-[8px] px-[10px] h-[38px] text-ink outline-none focus:border-teal"
            />
          </Field>

          <Field label="Service">
            {catalogLoading ? (
              <SkeletonBox w="100%" h={38} />
            ) : (
              <SelectInput
                value={timeslotTypeId}
                onChange={(e) => {
                  const next = e.target.value;
                  setTimeslotTypeId(next);
                  // Changing the primary may clash with an extra of the
                  // same id — drop any extra that now duplicates it.
                  setAdditionalIds((curr) => curr.filter((id) => id !== next));
                }}
                options={timeslotTypeOptions}
              />
            )}
          </Field>

          {/* Optional additional services. Each row is a separate select;
              an empty value lets the user open the dropdown without
              committing. Removing rows is per-row via the × button. */}
          {!catalogLoading && additionalIds.map((id, idx) => (
            <div key={`extra-${idx}`} className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <Field label={idx === 0 ? 'Then also' : 'Then also'}>
                  <SelectInput
                    value={id}
                    onChange={(e) => {
                      const next = e.target.value;
                      setAdditionalIds((curr) => {
                        const out = [...curr];
                        out[idx] = next;
                        return out;
                      });
                    }}
                    options={optionsForExtra(id)}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setAdditionalIds((curr) => curr.filter((_, i) => i !== idx))}
                className="h-[38px] w-[38px] rounded-[8px] border border-line-2 bg-surface text-ink-3 cursor-pointer hover:bg-surface-2 flex items-center justify-center flex-none"
                aria-label="Remove this service"
                title="Remove"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}

          {!catalogLoading && (
            <div className="flex items-center justify-between mt-0.5">
              <button
                type="button"
                onClick={() => setAdditionalIds((curr) => [...curr, ''])}
                disabled={!canAddAnother}
                className="inline-flex items-center gap-1 text-[12.5px] text-teal-ink bg-transparent border-0 p-0 cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                <Icon name="plus" size={12} />
                Add another service
              </button>
              {totalMinutes > 0 && additionalIds.length > 0 && (
                <span className="text-[11.5px] text-ink-3">
                  Total: <span className="mono tnum text-ink">{totalMinutes} min</span>
                </span>
              )}
            </div>
          )}

          {consultants.length > 0 && (
            <Field label="Consultant" hint="Optional — leave on Anyone for the earliest slot.">
              <SelectInput
                value={consultantId}
                onChange={(e) => setConsultantId(e.target.value)}
                options={consultantOptions}
              />
            </Field>
          )}

          {catalogError && (
            <div className="text-coral text-[12.5px]" role="alert">
              <Icon name="alert" size={12} /> {catalogError}
            </div>
          )}
        </div>

        {/* Earliest-available highlight */}
        {earliest && !slotsLoading && (
          <div
            className="p-4 rounded-[12px] mb-3.5"
            style={{
              background: 'var(--teal-tint)',
              border: '1px solid color-mix(in oklab, var(--teal) 25%, transparent)',
            }}
          >
            <Pill tone="teal" dot>
              Earliest available
            </Pill>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">
                  {fmtTime(earliest.startAt)}
                </div>
                <div className="text-[11.5px] text-ink-3 truncate">
                  {durationMinutes(earliest.startAt, earliest.endAt)} min
                </div>
              </div>
              <div className="mono tnum text-[18px] font-medium text-teal-ink">
                {fmtTime(earliest.startAt)}
              </div>
            </div>
            <Button
              variant="primary"
              full
              className="mt-3.5 h-[48px]"
              onClick={() => handleSelect(earliest)}
            >
              Take this slot
            </Button>
          </div>
        )}

        {slotsError && (
          <div className="text-coral text-[12.5px] mb-3" role="alert">
            <Icon name="alert" size={12} /> {slotsError}
          </div>
        )}

        {!timeslotTypeId ? (
          <div className="p-4 text-center text-[13px] text-ink-3 border border-dashed border-line rounded-[10px] bg-surface">
            Select a service above to see open slots.
          </div>
        ) : slotsLoading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonBox key={i} w="100%" h={52} />
            ))}
          </div>
        ) : visibleSlots.length === 0 ? (
          <EmptyState
            reason={emptyReason}
            consultantSelected={Boolean(consultantId)}
            serviceName={
              timeslotTypes.find((t) => t.id === timeslotTypeId)?.name ?? null
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {visibleSlots.map((s) => (
              <button
                key={`${s.orgMemberId}-${s.startAt}`}
                onClick={() => handleSelect(s)}
                className="py-2.5 px-1 bg-surface border border-line-2 rounded-[8px] cursor-pointer flex flex-col items-center gap-0.5 hover:border-teal transition-colors duration-150"
              >
                <span className="mono tnum text-[14px] font-medium">
                  {fmtTime(s.startAt)}
                </span>
                <span className="text-[10px] text-ink-3">{durationMinutes(s.startAt, s.endAt)} min</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function EmptyState({
  reason,
  consultantSelected,
  serviceName,
}: {
  reason: EmptyReason | null;
  consultantSelected: boolean;
  serviceName: string | null;
}) {
  // No reason from the backend (e.g. an older deployment, or a partial
  // network error) — fall back to the previous generic copy so the screen
  // never looks broken.
  if (!reason) {
    return (
      <div className="p-4 text-center text-[13px] text-ink-3 border border-line rounded-[10px] bg-surface">
        No openings for this combination. Try a different date or service.
      </div>
    );
  }

  const copy = describeEmptyReason(reason, { consultantSelected, serviceName });
  const tint = copy.tone === 'coral' ? 'var(--coral-tint)' : 'var(--amber-tint)';
  const border =
    copy.tone === 'coral'
      ? 'color-mix(in oklab, var(--coral) 30%, transparent)'
      : 'color-mix(in oklab, var(--amber) 30%, transparent)';
  const iconColor = copy.tone === 'coral' ? 'text-coral' : 'text-amber';

  return (
    <div
      className="p-4 rounded-[10px] flex items-start gap-2.5"
      style={{ background: tint, border: `1px solid ${border}` }}
      role="status"
    >
      <Icon name="alert" size={14} className={`${iconColor} mt-[2px] flex-none`} />
      <div className="flex-1 text-[12.5px] leading-relaxed">
        <div className="font-semibold">{copy.title}</div>
        <div className="text-ink-2 mt-0.5">{copy.body}</div>
      </div>
    </div>
  );
}
