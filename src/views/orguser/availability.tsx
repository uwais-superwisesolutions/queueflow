/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Field,
  Icon,
  Modal,
  Pill,
  SelectInput,
  SkeletonBox,
  SkeletonLine,
  TextInput,
} from '@/components/ui';
import { TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import type {
  AvailabilityExceptionType,
  AvailabilityPattern,
  ExceptionResponse,
  PatternConflict,
  PatternConflictResponse,
  PatternsResponse,
  TimeslotTypeResponse,
} from '@/types';
import {
  createMyAvailabilityException,
  deleteMyAvailabilityException,
  getMyAvailabilityPatterns,
  listMyAvailabilityExceptions,
  replaceMyAvailabilityPatterns,
} from '@/services/availabilityApi';
import {
  listMyTimeslotTypes,
  listTimeslotTypes,
  optInTimeslotType,
  optOutTimeslotType,
} from '@/services/timeslotTypeApi';
import { getApiErrorMessage } from '@/lib/api-error';

// API uses 0 = Sunday, but the UI shows Monday-first.
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UI_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

interface PatternRow extends AvailabilityPattern {
  /** Local row key — server doesn't return pattern IDs. */
  uid: string;
}

let uidCounter = 0;
const nextUid = () => `p-${++uidCounter}`;

function toMinutes(time: string): number {
  // "HH:mm:ss" or "HH:mm"
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function toApiTime(uiTime: string): string {
  // input type="time" returns "HH:mm" — pad to "HH:mm:ss".
  return uiTime.length === 5 ? `${uiTime}:00` : uiTime;
}

function toUiTime(apiTime: string): string {
  return apiTime.slice(0, 5);
}

export function AvailabilityView() {
  return (
    <>
      <TopBar
        title="My availability"
        subtitle="Working hours, exceptions, and the services you offer."
        breadcrumb={['Dashboard', 'Availability']}
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <RecurringSchedule />
        <div className="h-5" />
        <Exceptions />
        <div className="h-5" />
        <MyServices />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────
// Recurring weekly schedule
// ─────────────────────────────────────────────────

function RecurringSchedule() {
  const [rows, setRows] = useState<PatternRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [conflicts, setConflicts] = useState<PatternConflict[] | null>(null);

  const loadPatterns = (data: PatternsResponse) => {
    setRows(data.patterns.map((p) => ({ ...p, uid: nextUid() })));
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getMyAvailabilityPatterns();
      loadPatterns(resp.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your schedule.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const addWindow = (dayOfWeek: number) =>
    setRows((prev) => [
      ...prev,
      { uid: nextUid(), dayOfWeek, startTime: '09:00:00', endTime: '17:00:00' },
    ]);

  const update = (uid: string, key: 'startTime' | 'endTime', uiValue: string) =>
    setRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, [key]: toApiTime(uiValue) } : r)),
    );

  const remove = (uid: string) => setRows((prev) => prev.filter((r) => r.uid !== uid));

  const validate = (): string | null => {
    for (const r of rows) {
      const start = toMinutes(r.startTime);
      const end = toMinutes(r.endTime);
      if (end <= start) {
        return `${DAY_NAMES[UI_DAY_ORDER.indexOf(r.dayOfWeek)] ?? 'A day'}: end time must be after start time.`;
      }
    }
    return null;
  };

  const save = async (force: boolean) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const payload = {
        patterns: rows.map(({ uid: _uid, ...rest }) => rest),
      };
      const resp = await replaceMyAvailabilityPatterns(payload, force);
      if (resp.status === 409) {
        const body = resp.data as PatternConflictResponse;
        setConflicts(body.conflicts);
      } else {
        loadPatterns(resp.data as PatternsResponse);
        setConflicts(null);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save your schedule.'));
    } finally {
      setSaving(false);
    }
  };

  const totalWindows = rows.length;

  return (
    <>
      <Card padding={0}>
        <div className="px-[18px] py-[14px] border-b border-line flex items-center gap-3">
          <Icon name="calendar" size={15} className="text-ink-3" />
          <h2 className="m-0 text-[14px] font-medium">Recurring weekly schedule</h2>
          <Pill tone="neutral">{totalWindows} window{totalWindows === 1 ? '' : 's'}</Pill>
          <span className="flex-1" />
          {saved && (
            <span className="text-[12.5px] text-success inline-flex items-center gap-1.5">
              <Icon name="check" size={12} /> Saved
            </span>
          )}
          <Button variant="primary" size="sm" onClick={() => save(false)} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save schedule'}
          </Button>
        </div>

        <div className="p-2">
          {error && (
            <div className="text-coral text-[12.5px] px-3 pt-2" role="alert">
              <Icon name="alert" size={12} /> {error}
            </div>
          )}
          {loading ? (
            <div>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="grid items-start gap-3 px-3 py-3 border-b border-line last:border-b-0"
                  style={{ gridTemplateColumns: '90px minmax(0, 1fr)' }}
                >
                  <SkeletonLine w={32} h={12} className="mt-2" />
                  <div className="flex items-center gap-2">
                    <SkeletonBox w={108} h={36} />
                    <SkeletonLine w={16} h={10} />
                    <SkeletonBox w={108} h={36} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            UI_DAY_ORDER.map((dayOfWeek) => {
              const dayRows = rows.filter((r) => r.dayOfWeek === dayOfWeek);
              return (
                <div
                  key={dayOfWeek}
                  className="grid items-start gap-3 px-3 py-3 border-b border-line last:border-b-0"
                  style={{ gridTemplateColumns: '90px minmax(0, 1fr)' }}
                >
                  <div className="text-[13px] font-medium pt-[10px] text-ink-2">
                    {DAY_NAMES[UI_DAY_ORDER.indexOf(dayOfWeek)]}
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayRows.length === 0 ? (
                      <div className="text-[12px] text-ink-3">Day off</div>
                    ) : (
                      dayRows.map((r) => (
                        <div key={r.uid} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={toUiTime(r.startTime)}
                            onChange={(e) => update(r.uid, 'startTime', e.target.value)}
                            className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[36px] text-[13px] outline-none"
                          />
                          <span className="text-[12px] text-ink-3">to</span>
                          <input
                            type="time"
                            value={toUiTime(r.endTime)}
                            onChange={(e) => update(r.uid, 'endTime', e.target.value)}
                            className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[36px] text-[13px] outline-none"
                          />
                          <button
                            aria-label="Remove window"
                            onClick={() => remove(r.uid)}
                            className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2 ml-1"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => addWindow(dayOfWeek)}
                      className="border-0 bg-transparent cursor-pointer text-teal-ink text-[12.5px] font-medium inline-flex items-center gap-1.5 self-start py-0.5"
                    >
                      <Icon name="plus" size={12} /> Add window
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <ConflictModal
        conflicts={conflicts}
        onCancel={() => setConflicts(null)}
        onForce={async () => {
          setConflicts(null);
          await save(true);
        }}
      />
    </>
  );
}

function ConflictModal({
  conflicts,
  onCancel,
  onForce,
}: {
  conflicts: PatternConflict[] | null;
  onCancel: () => void;
  onForce: () => void;
}) {
  if (!conflicts) return null;
  return (
    <Modal
      open
      onClose={onCancel}
      title={`${conflicts.length} booking${conflicts.length === 1 ? '' : 's'} would conflict`}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={onForce}>
            Save anyway
          </Button>
        </>
      }
    >
      <p className="m-0 mb-3 text-[13px] text-ink-2">
        These existing bookings fall outside your new working hours. Saving anyway will leave them
        scheduled — you'll need to reschedule or cancel each one manually in the bookings flow.
      </p>
      <div className="border border-line rounded-[8px] divide-y divide-line">
        {conflicts.map((c) => (
          <div key={c.bookingId} className="px-3 py-2.5 flex items-center gap-3">
            <Icon name="alert" size={14} className="text-coral flex-none" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">
                {c.clientName ?? 'Unnamed booking'}
              </div>
              <div className="mono text-[11.5px] text-ink-3">
                {new Date(c.scheduledStartAt).toLocaleString()} → {new Date(c.scheduledEndAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────
// Exceptions
// ─────────────────────────────────────────────────

function Exceptions() {
  const [items, setItems] = useState<ExceptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const resp = await listMyAvailabilityExceptions({ from: today });
      setItems([...resp.data].sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load exceptions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Delete this exception?')) return;
    setError(null);
    try {
      await deleteMyAvailabilityException(id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete exception.'));
    }
  };

  return (
    <Card padding={0}>
      <div className="px-[18px] py-[14px] border-b border-line flex items-center gap-3">
        <Icon name="calendar" size={15} className="text-ink-3" />
        <h2 className="m-0 text-[14px] font-medium">Upcoming exceptions</h2>
        <Pill tone="neutral">{items.length} active</Pill>
        <span className="flex-1" />
        <Button variant="primary" size="sm" icon="plus" onClick={() => setShowModal(true)}>
          Add exception
        </Button>
      </div>

      <div className="p-2">
        {error && (
          <div className="text-coral text-[12.5px] px-3 pt-2" role="alert">
            <Icon name="alert" size={12} /> {error}
          </div>
        )}
        {loading && items.length === 0 ? (
          <ListLoadingSkeleton rows={3} />
        ) : items.length === 0 ? (
          <div className="px-3 py-6 text-[13px] text-ink-3 text-center">
            No exceptions on the books. Add one to block a day, add a break, or schedule extra hours.
          </div>
        ) : (
          items.map((e, i) => (
            <div
              key={e.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5',
                i < items.length - 1 && 'border-b border-line',
              )}
            >
              <ExceptionTypeBadge type={e.exceptionType} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">
                  {new Date(e.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-[11.5px] text-ink-3">
                  {e.exceptionType === 'blocked'
                    ? 'All day blocked'
                    : `${toUiTime(e.startTime ?? '')} → ${toUiTime(e.endTime ?? '')}`}
                  {e.reason ? ` · ${e.reason}` : ''}
                </div>
              </div>
              <button
                aria-label="Delete"
                onClick={() => remove(e.id)}
                className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      <ExceptionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={async () => {
          setShowModal(false);
          await reload();
        }}
      />
    </Card>
  );
}

function ExceptionTypeBadge({ type }: { type: AvailabilityExceptionType }) {
  const map = {
    blocked: { tone: 'coral' as const, label: 'Blocked', icon: 'x' as const },
    break: { tone: 'amber' as const, label: 'Break', icon: 'clock' as const },
    extra_hours: { tone: 'success' as const, label: 'Extra hours', icon: 'plus' as const },
  };
  const m = map[type];
  return (
    <Pill tone={m.tone}>
      <Icon name={m.icon} size={10} /> {m.label}
    </Pill>
  );
}

function ExceptionModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState('');
  const [type, setType] = useState<AvailabilityExceptionType>('blocked');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setReason('');
      setType('blocked');
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().slice(0, 10));
    }
  }, [open]);

  const submit = async () => {
    if (!date) {
      setError('Pick a date.');
      return;
    }
    if (type !== 'blocked') {
      if (!startTime || !endTime) {
        setError('Set start and end times.');
        return;
      }
      if (toMinutes(startTime) >= toMinutes(endTime)) {
        setError('End time must be after start time.');
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      await createMyAvailabilityException({
        date,
        exceptionType: type,
        startTime: type === 'blocked' ? null : toApiTime(startTime),
        endTime: type === 'blocked' ? null : toApiTime(endTime),
        reason: reason.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save exception.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add availability exception"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Add'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Date">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Type">
          <SelectInput
            value={type}
            onChange={(e) => setType(e.target.value as AvailabilityExceptionType)}
            options={[
              { value: 'blocked', label: 'Blocked (all day)' },
              { value: 'break', label: 'Break (subtract a window)' },
              { value: 'extra_hours', label: 'Extra hours (add a window)' },
            ]}
          />
        </Field>
        {type !== 'blocked' && (
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="From">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[38px] text-[13px] outline-none w-full"
              />
            </Field>
            <Field label="To">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[38px] text-[13px] outline-none w-full"
              />
            </Field>
          </div>
        )}
        <Field label="Reason" hint="Optional — visible only to you.">
          <TextInput
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Conference"
          />
        </Field>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────
// My services (timeslot opt-ins)
// ─────────────────────────────────────────────────

function MyServices() {
  const [all, setAll] = useState<TimeslotTypeResponse[]>([]);
  const [mine, setMine] = useState<TimeslotTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRes, mineRes] = await Promise.all([listTimeslotTypes(), listMyTimeslotTypes()]);
      setAll(allRes.data);
      setMine(mineRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load services.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const mineIds = useMemo(() => new Set(mine.map((t) => t.id)), [mine]);

  const toggle = async (t: TimeslotTypeResponse) => {
    setError(null);
    setPendingId(t.id);
    try {
      if (mineIds.has(t.id)) {
        await optOutTimeslotType(t.id);
      } else {
        await optInTimeslotType(t.id);
      }
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update service.'));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Card padding={0}>
      <div className="px-[18px] py-[14px] border-b border-line flex items-center gap-3">
        <Icon name="clock" size={15} className="text-ink-3" />
        <h2 className="m-0 text-[14px] font-medium">My services</h2>
        <span className="text-[12px] text-ink-3">Toggle which services you personally offer.</span>
      </div>
      <div className="p-2">
        {error && (
          <div className="text-coral text-[12.5px] px-3 pt-2" role="alert">
            <Icon name="alert" size={12} /> {error}
          </div>
        )}
        {loading && all.length === 0 ? (
          <ListLoadingSkeleton rows={3} />
        ) : all.length === 0 ? (
          <div className="px-3 py-6 text-[13px] text-ink-3 text-center">
            Your super user hasn't added any services yet.
          </div>
        ) : (
          all.map((t, i) => {
            const isOn = mineIds.has(t.id);
            return (
              <div
                key={t.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5',
                  i < all.length - 1 && 'border-b border-line',
                )}
              >
                <span
                  className="w-7 h-7 rounded-[8px] inline-flex items-center justify-center text-white flex-none"
                  style={{ background: t.color ?? '#0f6e56' }}
                >
                  <Icon name="clock" size={12} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{t.name}</div>
                  <div className="mono text-[11.5px] text-ink-3">{t.durationMinutes} min</div>
                </div>
                {!t.isActive && <Pill tone="neutral">Hidden</Pill>}
                <Button
                  variant={isOn ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggle(t)}
                  disabled={pendingId === t.id}
                  icon={isOn ? 'check' : 'plus'}
                >
                  {isOn ? 'Offering' : 'Offer this'}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// ListLoadingSkeleton — used by Exceptions and MyServices.
// ─────────────────────────────────────────────────

function ListLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5',
            i < rows - 1 && 'border-b border-line',
          )}
        >
          <SkeletonBox w={56} h={20} />
          <div className="flex-1 min-w-0">
            <SkeletonLine w={`${45 + (i % 3) * 12}%`} h={12} />
            <SkeletonLine w={`${30 + (i % 2) * 14}%`} h={10} className="mt-1.5" />
          </div>
          <SkeletonBox w={84} h={28} />
        </div>
      ))}
    </div>
  );
}
