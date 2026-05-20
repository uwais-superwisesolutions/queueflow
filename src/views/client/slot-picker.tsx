/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Pill, SkeletonBox, Field, SelectInput } from '@/components/ui';
import { searchSlots } from '@/services/slotApi';
import { listClientConsultants, listClientTimeslotTypes } from '@/services/clientApi';
import { getApiErrorMessage } from '@/lib/api-error';
import type {
  ClientConsultantResponse,
  SlotResponse,
  TimeslotTypeResponse,
} from '@/types';

export interface SlotSelection {
  /** Original SlotResponse — handed off to the confirmation screen. */
  slot: SlotResponse;
  /** What we display to the user on confirm (short label). */
  label: string;
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

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function durationMin(slot: SlotResponse): number {
  return Math.round((new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60_000);
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
        });
        if (cancelled) return;
        // Sort ascending by start time so the grid + earliest-available read
        // chronologically.
        const sorted = [...resp.data].sort((a, b) => a.startAt.localeCompare(b.startAt));
        setSlots(sorted);
      } catch (err) {
        if (!cancelled) setSlotsError(getApiErrorMessage(err, 'Could not load slots.'));
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, timeslotTypeId, consultantId]);

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
      label: `${fmtTime(slot.startAt)} · ${durationMin(slot)} min`,
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
                onChange={(e) => setTimeslotTypeId(e.target.value)}
                options={timeslotTypeOptions}
              />
            )}
          </Field>

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
                  {durationMin(earliest)} min
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
          <div className="p-4 text-center text-[13px] text-ink-3 border border-line rounded-[10px] bg-surface">
            No openings for this combination. Try a different date or service.
          </div>
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
                <span className="text-[10px] text-ink-3">{durationMin(s)} min</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
