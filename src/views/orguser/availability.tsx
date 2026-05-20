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
  useConfirm,
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
} from '@/types';
import {
  createMyAvailabilityException,
  deleteMyAvailabilityException,
  getMyAvailabilityPatterns,
  listMyAvailabilityExceptions,
  replaceMyAvailabilityPatterns,
} from '@/services/availabilityApi';
import { listTimeslotTypes } from '@/services/timeslotTypeApi';
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

function toMeridiem(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr ?? '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function AvailabilityView() {
  return (
    <>
      <TopBar
        title="My availability"
        subtitle="Working hours and exceptions for your week."
        breadcrumb={['Dashboard', 'Availability']}
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <div
          className="flex items-center gap-[10px] px-3.5 py-[10px] rounded-[10px] border mb-4"
          style={{
            background: 'var(--coral-tint)',
            borderColor: 'color-mix(in oklab, var(--coral) 30%, transparent)',
          }}
          role="note"
        >
          <Icon name="alert" size={14} className="text-coral" />
          <span className="text-[12.5px] text-coral-2 flex-1">
            <b className="font-semibold">3 scheduled bookings</b> fall in newly-blocked hours.
          </span>
          <Button variant="secondary" size="sm">Review</Button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" icon="chevronL" />
            <Button variant="secondary" size="sm">This week</Button>
            <Button variant="ghost" size="sm" icon="chevronR" />
          </div>
          <span className="text-[13.5px] font-medium">18 — 24 May 2026</span>
          <span className="flex-1" />
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm">Day</Button>
            <Button variant="secondary" size="sm">Week</Button>
            <Button variant="ghost" size="sm">Month</Button>
          </div>
        </div>

        <RecurringSchedule />
        <div className="h-5" />
        <Exceptions />
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
  const [editingDay, setEditingDay] = useState<number | null>(UI_DAY_ORDER[0]);
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);
  const [showAddWindow, setShowAddWindow] = useState(false);

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

  const addWindow = (dayOfWeek: number, startTime = '09:00:00', endTime = '17:00:00') =>
    setRows((prev) => [
      ...prev,
      { uid: nextUid(), dayOfWeek, startTime, endTime },
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
          <Button
            variant="secondary"
            size="sm"
            icon="plus"
            onClick={() => setShowAddWindow(true)}
            disabled={loading}
          >
            Add window
          </Button>
          {saved && (
            <span className="text-[12.5px] text-success inline-flex items-center gap-1.5">
              <Icon name="check" size={12} /> Saved
            </span>
          )}
          <Button variant="primary" size="sm" onClick={() => save(false)} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save schedule'}
          </Button>
        </div>

        <div className="p-0">
          {error && (
            <div className="text-coral text-[12.5px] px-3 pt-2" role="alert">
              <Icon name="alert" size={12} /> {error}
            </div>
          )}
          {loading ? (
            <div className="p-3">
              <ListLoadingSkeleton rows={6} />
            </div>
          ) : (
            <WeekGrid
              rows={rows}
              editingDay={editingDay}
              onSelectDay={(d) => setEditingDay(d)}
              onAddDay={(d) => addWindow(d)}
              onEditWindow={(uid, day) => {
                setEditingDay(day);
                setEditingWindowId(uid);
              }}
            />
          )}
        </div>
      </Card>

    <AddWindowModal
      open={showAddWindow}
      defaultDay={editingDay ?? UI_DAY_ORDER[0]}
      rows={rows}
      onClose={() => setShowAddWindow(false)}
      onSubmit={(day, startTime, endTime) => {
        addWindow(day, startTime, endTime);
        setEditingDay(day);
        setShowAddWindow(false);
      }}
    />

    <WindowEditModal
      uid={editingWindowId}
      rows={rows}
      onClose={() => setEditingWindowId(null)}
      onRemove={remove}
      onChange={update}
    />

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

function WeekGrid({
  rows,
  editingDay,
  onSelectDay,
  onAddDay,
  onEditWindow,
}: {
  rows: PatternRow[];
  editingDay: number | null;
  onSelectDay: (dayOfWeek: number) => void;
  onAddDay: (dayOfWeek: number) => void;
  onEditWindow: (uid: string, dayOfWeek: number) => void;
}) {
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return out;
  }, []);
  const dates = [18, 19, 20, 21, 22, 23, 24];

  const dayRows = useMemo(() => {
    const m = new Map<number, PatternRow[]>();
    for (const d of UI_DAY_ORDER) m.set(d, []);
    for (const r of rows) {
      if (!m.has(r.dayOfWeek)) m.set(r.dayOfWeek, []);
      m.get(r.dayOfWeek)!.push(r);
    }
    return m;
  }, [rows]);

  return (
    <Card padding={0} className="overflow-hidden">
      <div
        className="grid border-b border-line bg-surface-2"
        style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}
      >
        <div />
        {UI_DAY_ORDER.map((d, i) => (
          <div
            key={d}
            className="px-3 py-2 border-l border-line flex items-baseline gap-2"
          >
            <span className="text-[11.5px] text-ink-3 font-medium">{DAY_NAMES[i]}</span>
            <span className={cn(
              'tnum text-[14px] font-medium',
              i === 0 ? 'text-teal' : 'text-ink',
            )}>{dates[i]}</span>
            {!dayRows.get(d)?.length && <Pill tone="neutral" className="ml-auto" style={{ fontSize: 10 }}>Off</Pill>}
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div>
          {slots.map((s, i) => (
            <div
              key={s}
              className="text-[10.5px] text-ink-4 px-2"
              style={{
                height: 24,
                textAlign: 'right',
                borderBottom: i < slots.length - 1 ? '1px solid var(--line)' : 'none',
                position: 'relative',
              }}
            >
              {s.endsWith(':00') && <span className="mono" style={{ position: 'relative', top: -4 }}>{s}</span>}
            </div>
          ))}
        </div>

        {UI_DAY_ORDER.map((d, dayIdx) => {
          const windows = dayRows.get(d) ?? [];
          const isWithin = (slotIdx: number) => {
            const minute = 8 * 60 + slotIdx * 30;
            return windows.some((w) => minute >= toMinutes(w.startTime) && minute < toMinutes(w.endTime));
          };
          return (
            <div
              key={d}
              onClick={() => onSelectDay(d)}
              className={cn('relative border-l border-line', editingDay === d && 'bg-surface-2/40')}
            >
              {slots.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 24,
                    borderBottom: i < slots.length - 1 ? '1px solid var(--line)' : 'none',
                    background: windows.length === 0 || !isWithin(i) ? 'var(--surface-2)' : 'transparent',
                  }}
                />
              ))}
              {windows.map((w) => {
                const start = toMinutes(w.startTime);
                const end = toMinutes(w.endTime);
                const top = Math.max(0, (start - 8 * 60) / 30) * 24;
                const height = Math.max(1, (end - start) / 30) * 24;
                return (
                  <button
                    key={w.uid}
                    className="absolute left-1.5 right-1.5 rounded-[6px] border text-left px-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWindow(w.uid, d);
                    }}
                    style={{
                      top,
                      height,
                      background: 'var(--surface)',
                      border: '1px solid var(--line-2)',
                      borderLeft: '3px solid var(--teal)',
                      boxShadow: 'var(--shadow-sm)',
                      paddingTop: 3,
                      paddingBottom: 3,
                    }}
                  >
                    <div className="text-[11px] font-medium">Working hours</div>
                    <div className="text-[10.5px] text-ink-3">{toUiTime(w.startTime)} → {toUiTime(w.endTime)}</div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DayEditorPanel({
  dayOfWeek,
  rows,
  onAdd,
  onRemove,
  onChange,
}: {
  dayOfWeek: number | null;
  rows: PatternRow[];
  onAdd: () => void;
  onRemove: (uid: string) => void;
  onChange: (uid: string, key: 'startTime' | 'endTime', uiValue: string) => void;
}) {
  if (dayOfWeek == null) return null;
  const label = DAY_NAMES[UI_DAY_ORDER.indexOf(dayOfWeek)];
  const dayRows = rows.filter((r) => r.dayOfWeek === dayOfWeek);

  return (
    <Card padding={0}>
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <Icon name="calendar" size={14} className="text-ink-3" />
        <span className="text-[13px] font-medium">{label}</span>
        <span className="ml-auto text-[11.5px] text-ink-3">{dayRows.length} window{dayRows.length === 1 ? '' : 's'}</span>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {dayRows.length === 0 ? (
          <div className="text-[12.5px] text-ink-3">No working windows yet.</div>
        ) : (
          dayRows.map((r) => (
            <div key={r.uid} className="flex items-center gap-2">
              <input
                type="time"
                value={toUiTime(r.startTime)}
                onChange={(e) => onChange(r.uid, 'startTime', e.target.value)}
                className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[36px] text-[13px] outline-none"
              />
              <span className="text-[12px] text-ink-3">to</span>
              <input
                type="time"
                value={toUiTime(r.endTime)}
                onChange={(e) => onChange(r.uid, 'endTime', e.target.value)}
                className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[36px] text-[13px] outline-none"
              />
              <button
                aria-label="Remove window"
                onClick={() => onRemove(r.uid)}
                className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2 ml-1"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          ))
        )}
        <Button variant="secondary" size="sm" icon="plus" onClick={onAdd}>
          Add window
        </Button>
      </div>
    </Card>
  );
}

function WeekSummaryCard() {
  return (
    <Card padding={14}>
      <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold">
        Week summary
      </div>
      <div className="grid gap-3 mt-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div className="text-[11.5px] text-ink-3">Total windows</div>
          <div className="tnum text-[20px] font-medium">14</div>
        </div>
        <div>
          <div className="text-[11.5px] text-ink-3">Exceptions</div>
          <div className="tnum text-[20px] font-medium">2</div>
        </div>
        <div>
          <div className="text-[11.5px] text-ink-3">Bookings</div>
          <div className="tnum text-[20px] font-medium">18</div>
        </div>
        <div>
          <div className="text-[11.5px] text-ink-3">Conflicts</div>
          <div className="tnum text-[20px] font-medium text-coral-2">3</div>
        </div>
      </div>
    </Card>
  );
}

function AddWindowModal({
  open,
  defaultDay,
  rows,
  onClose,
  onSubmit,
}: {
  open: boolean;
  defaultDay: number;
  rows: PatternRow[];
  onClose: () => void;
  onSubmit: (dayOfWeek: number, startTime: string, endTime: string) => void;
}) {
  const [day, setDay] = useState(String(defaultDay));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState<string | null>(null);

  const times = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m > 0) continue;
        out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return out;
  }, []);

  const dayRows = useMemo(
    () => rows.filter((r) => r.dayOfWeek === Number(day)),
    [rows, day],
  );

  const isFreeRange = (start: number, end: number) =>
    !dayRows.some((r) => {
      const rs = toMinutes(r.startTime);
      const re = toMinutes(r.endTime);
      return start < re && end > rs;
    });

  const startOptions = useMemo(() =>
    times.map((t) => ({ value: t, label: toMeridiem(t) })),
    [times],
  );

  const endOptions = useMemo(() =>
    times.map((t) => ({ value: t, label: toMeridiem(t) })),
    [times],
  );

  useEffect(() => {
    if (open) {
      setDay(String(defaultDay));
      const firstStart = startOptions.find((o) => !o.disabled)?.value ?? '09:00';
      const firstEnd = endOptions.find((o) => !o.disabled)?.value ?? '17:00';
      setStartTime(firstStart);
      setEndTime(firstEnd);
      setError(null);
    }
  }, [open, defaultDay, startOptions, endOptions]);

  useEffect(() => {
    if (!open) return;
    if (!startOptions.find((o) => o.value === startTime)) {
      setStartTime(startOptions[0]?.value ?? '09:00');
    }
  }, [open, startOptions, startTime]);

  useEffect(() => {
    if (!open) return;
    if (!endOptions.find((o) => o.value === endTime)) {
      setEndTime(endOptions[0]?.value ?? '17:00');
    }
  }, [open, endOptions, endTime]);

  const submit = () => {
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      setError('End time must be after start time.');
      return;
    }
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    const overlap = dayRows.some((r) => {
      const rs = toMinutes(r.startTime);
      const re = toMinutes(r.endTime);
      return start < re && end > rs;
    });
    if (overlap) {
      setError('This window overlaps an existing one.');
      return;
    }
    setError(null);
    onSubmit(Number(day), toApiTime(startTime), toApiTime(endTime));
  };

  if (!open) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add window"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Day">
          <SelectInput
            value={day}
            onChange={(e) => setDay(e.target.value)}
            options={UI_DAY_ORDER.map((d, i) => ({
              value: String(d),
              label: DAY_NAMES[i],
            }))}
          />
        </Field>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Field label="From">
            <SelectInput
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              options={startOptions}
            />
          </Field>
          <Field label="To">
            <SelectInput
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              options={endOptions}
            />
          </Field>
        </div>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

function WindowEditModal({
  uid,
  rows,
  onClose,
  onRemove,
  onChange,
}: {
  uid: string | null;
  rows: PatternRow[];
  onClose: () => void;
  onRemove: (uid: string) => void;
  onChange: (uid: string, key: 'startTime' | 'endTime', uiValue: string) => void;
}) {
  if (!uid) return null;
  const row = rows.find((r) => r.uid === uid);
  if (!row) return null;
  const label = DAY_NAMES[UI_DAY_ORDER.indexOf(row.dayOfWeek)];

  return (
    <Modal
      open
      onClose={onClose}
      title={`${label} window`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Done</Button>
          <Button variant="danger" onClick={() => onRemove(uid)} icon="trash">Remove</Button>
        </>
      }
    >
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={toUiTime(row.startTime)}
          onChange={(e) => onChange(uid, 'startTime', e.target.value)}
          className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[36px] text-[13px] outline-none"
        />
        <span className="text-[12px] text-ink-3">to</span>
        <input
          type="time"
          value={toUiTime(row.endTime)}
          onChange={(e) => onChange(uid, 'endTime', e.target.value)}
          className="bg-surface border border-line-2 rounded-[8px] px-2.5 h-[36px] text-[13px] outline-none"
        />
      </div>
    </Modal>
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
  const confirm = useConfirm();

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
    const ok = await confirm({
      title: 'Delete this exception?',
      body: 'Your availability for that date returns to your recurring weekly pattern.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
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
