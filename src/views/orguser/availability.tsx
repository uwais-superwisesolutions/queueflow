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
import { getApiErrorMessage } from '@/lib/api-error';
import { fmtDate, fmtDateTime, fmtTime, todayInTz } from '@/lib/date';

// API uses 0 = Sunday, but the UI shows Monday-first.
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const UI_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

type ViewMode = 'day' | 'week' | 'month';

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

// ── Date helpers ─────────────────────────────────────────────────────────
// All work on local-time Date instances. We never persist these — patterns
// are recurring by day-of-week, so the calendar only uses dates for display
// and navigation.

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function startOfWeek(d: Date): Date {
  // Monday-anchored week (UI is Mon-first).
  const out = new Date(d);
  const dow = out.getDay(); // 0=Sun..6=Sat
  const back = (dow + 6) % 7; // Mon→0, Sun→6
  out.setDate(out.getDate() - back);
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfMonth(d: Date): Date {
  const out = new Date(d);
  out.setDate(1);
  out.setHours(0, 0, 0, 0);
  return out;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function weekDates(anchor: Date): Date[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function monthGridDates(anchor: Date): Date[] {
  // 6 rows × 7 cols, starting at the Monday on/before the 1st.
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

function monthLabel(d: Date): string {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function weekRangeLabel(anchor: Date): string {
  const days = weekDates(anchor);
  const start = days[0];
  const end = days[6];
  const sameMonth = start.getMonth() === end.getMonth();
  const startStr = start.toLocaleDateString(undefined, {
    day: 'numeric',
    ...(sameMonth ? {} : { month: 'short' }),
  });
  const endStr = end.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startStr} — ${endStr}`;
}

function rangeLabel(view: ViewMode, anchor: Date): string {
  if (view === 'day') return dayLabel(anchor);
  if (view === 'month') return monthLabel(anchor);
  return weekRangeLabel(anchor);
}

export function AvailabilityView() {
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const shift = (direction: 1 | -1) => {
    if (viewMode === 'day') setAnchorDate((d) => addDays(d, direction));
    else if (viewMode === 'week') setAnchorDate((d) => addDays(d, 7 * direction));
    else setAnchorDate((d) => addMonths(d, direction));
  };

  const today = () => setAnchorDate(new Date());
  const todayLabel =
    viewMode === 'day' ? 'Today' : viewMode === 'month' ? 'This month' : 'This week';

  return (
    <>
      <TopBar
        title="My availability"
        subtitle="Working hours and exceptions for your week."
        breadcrumb={['Dashboard', 'Availability']}
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              icon="chevronL"
              onClick={() => shift(-1)}
              aria-label="Previous"
            />
            <Button variant="secondary" size="sm" onClick={today}>
              {todayLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon="chevronR"
              onClick={() => shift(1)}
              aria-label="Next"
            />
          </div>
          <span className="text-[13.5px] font-medium">{rangeLabel(viewMode, anchorDate)}</span>
          <span className="flex-1" />
          <div className="flex items-center gap-1.5">
            <Button
              variant={viewMode === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>
        </div>

        <RecurringSchedule viewMode={viewMode} anchorDate={anchorDate} />
        <div className="h-5" />
        <Exceptions />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────
// Recurring weekly schedule
// ─────────────────────────────────────────────────

interface RecurringScheduleProps {
  viewMode: ViewMode;
  anchorDate: Date;
}

function RecurringSchedule({ viewMode, anchorDate }: RecurringScheduleProps) {
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

  const addWindows = (daysOfWeek: number[], startTime: string, endTime: string) =>
    setRows((prev) => [
      ...prev,
      ...daysOfWeek.map((dayOfWeek) => ({
        uid: nextUid(),
        dayOfWeek,
        startTime,
        endTime,
      })),
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
          ) : viewMode === 'month' ? (
            <MonthGrid rows={rows} anchorDate={anchorDate} />
          ) : (
            <WeekGrid
              rows={rows}
              anchorDate={anchorDate}
              singleDay={viewMode === 'day'}
              editingDay={editingDay}
              onSelectDay={(d) => setEditingDay(d)}
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
      onSubmit={(days, startTime, endTime) => {
        addWindows(days, startTime, endTime);
        if (days.length > 0) setEditingDay(days[0]);
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
  anchorDate,
  singleDay,
  editingDay,
  onSelectDay,
  onEditWindow,
}: {
  rows: PatternRow[];
  anchorDate: Date;
  /** Day view: render only the column for the day-of-week of anchorDate. */
  singleDay?: boolean;
  editingDay: number | null;
  onSelectDay: (dayOfWeek: number) => void;
  onEditWindow: (uid: string, dayOfWeek: number) => void;
}) {
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return out;
  }, []);

  const today = useMemo(() => new Date(), []);

  // Dates and day-of-week values to render: 1 column for day view, 7 for week.
  const visibleDates = useMemo<Date[]>(() => {
    if (singleDay) return [anchorDate];
    return weekDates(anchorDate);
  }, [anchorDate, singleDay]);

  const visibleDays = useMemo(
    () => visibleDates.map((d) => d.getDay()),
    [visibleDates],
  );

  const dayRows = useMemo(() => {
    const m = new Map<number, PatternRow[]>();
    for (const d of UI_DAY_ORDER) m.set(d, []);
    for (const r of rows) {
      if (!m.has(r.dayOfWeek)) m.set(r.dayOfWeek, []);
      m.get(r.dayOfWeek)!.push(r);
    }
    return m;
  }, [rows]);

  const cols = visibleDates.length;
  const gridTemplateColumns = `56px repeat(${cols}, 1fr)`;

  return (
    <Card padding={0} className="overflow-hidden">
      <div
        className="grid border-b border-line bg-surface-2"
        style={{ gridTemplateColumns }}
      >
        <div />
        {visibleDates.map((date, i) => {
          const dow = visibleDays[i];
          const isToday = isSameDay(date, today);
          return (
            <div
              key={date.toISOString()}
              className="px-3 py-2 border-l border-line flex items-baseline gap-2"
            >
              <span className="text-[11.5px] text-ink-3 font-medium">
                {DAY_NAMES[UI_DAY_ORDER.indexOf(dow)]}
              </span>
              <span
                className={cn(
                  'tnum text-[14px] font-medium',
                  isToday ? 'text-teal' : 'text-ink',
                )}
              >
                {date.getDate()}
              </span>
              {!dayRows.get(dow)?.length && (
                <Pill tone="neutral" className="ml-auto" style={{ fontSize: 10 }}>
                  Off
                </Pill>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns }}>
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

        {visibleDates.map((date, colIdx) => {
          const d = visibleDays[colIdx];
          const windows = dayRows.get(d) ?? [];
          const isWithin = (slotIdx: number) => {
            const minute = 8 * 60 + slotIdx * 30;
            return windows.some((w) => minute >= toMinutes(w.startTime) && minute < toMinutes(w.endTime));
          };
          return (
            <div
              key={date.toISOString()}
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

function MonthGrid({
  rows,
  anchorDate,
}: {
  rows: PatternRow[];
  anchorDate: Date;
}) {
  const today = useMemo(() => new Date(), []);
  const dates = useMemo(() => monthGridDates(anchorDate), [anchorDate]);
  const currentMonth = anchorDate.getMonth();

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
        style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
      >
        {UI_DAY_ORDER.map((d, i) => (
          <div
            key={d}
            className="px-3 py-2 border-l border-line first:border-l-0 text-[11.5px] text-ink-3 font-medium"
          >
            {DAY_NAMES[i]}
          </div>
        ))}
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(96px, auto)' }}
      >
        {dates.map((date, idx) => {
          const dow = date.getDay();
          const windows = dayRows.get(dow) ?? [];
          const inMonth = date.getMonth() === currentMonth;
          const isToday = isSameDay(date, today);
          return (
            <div
              key={idx}
              className={cn(
                'border-l border-t border-line p-2 flex flex-col gap-1',
                idx % 7 === 0 && 'border-l-0',
                !inMonth && 'bg-surface-2/60',
              )}
            >
              <span
                className={cn(
                  'tnum text-[12px] font-medium',
                  isToday ? 'text-teal' : inMonth ? 'text-ink' : 'text-ink-4',
                )}
              >
                {date.getDate()}
              </span>
              {windows.length === 0 ? (
                <span className="text-[10.5px] text-ink-4">Off</span>
              ) : (
                windows.map((w) => (
                  <div
                    key={w.uid}
                    className="rounded-[4px] px-1.5 py-[2px] text-[10px] leading-tight"
                    style={{
                      background: 'var(--teal-tint)',
                      color: 'var(--teal-ink)',
                      borderLeft: '2px solid var(--teal)',
                    }}
                    title={`${toUiTime(w.startTime)} → ${toUiTime(w.endTime)}`}
                  >
                    {toUiTime(w.startTime)}–{toUiTime(w.endTime)}
                  </div>
                ))
              )}
            </div>
          );
        })}
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
  /** Adds one window per selected day-of-week with the same time range. */
  onSubmit: (daysOfWeek: number[], startTime: string, endTime: string) => void;
}) {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(() => new Set([defaultDay]));
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
      setSelectedDays(new Set([defaultDay]));
      setStartTime(startOptions[0]?.value ?? '09:00');
      setEndTime(endOptions[0]?.value ?? '17:00');
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

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const submit = () => {
    if (selectedDays.size === 0) {
      setError('Pick at least one day.');
      return;
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      setError('End time must be after start time.');
      return;
    }
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    // Find any day where the new window would overlap an existing one — call
    // it out by name so the user knows which selection to revisit.
    const overlappingDays: number[] = [];
    for (const day of selectedDays) {
      const dayRows = rows.filter((r) => r.dayOfWeek === day);
      const overlaps = dayRows.some((r) => {
        const rs = toMinutes(r.startTime);
        const re = toMinutes(r.endTime);
        return start < re && end > rs;
      });
      if (overlaps) overlappingDays.push(day);
    }

    if (overlappingDays.length > 0) {
      const names = overlappingDays
        .map((d) => DAY_NAMES[UI_DAY_ORDER.indexOf(d)])
        .join(', ');
      setError(`This window overlaps an existing one on ${names}.`);
      return;
    }

    setError(null);
    onSubmit(
      Array.from(selectedDays),
      toApiTime(startTime),
      toApiTime(endTime),
    );
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
        <Field label="Days" hint="Pick one or more days to apply this time range to.">
          <div className="flex flex-wrap gap-1.5">
            {UI_DAY_ORDER.map((d, i) => {
              const on = selectedDays.has(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={cn(
                    'px-3 py-[7px] rounded-[8px] cursor-pointer text-[12.5px] font-medium',
                    'border transition-[background,border-color,color] duration-100',
                    on
                      ? 'bg-teal-tint border-teal text-teal-ink'
                      : 'bg-surface border-line-2 text-ink hover:bg-surface-2',
                  )}
                  aria-pressed={on}
                >
                  {DAY_NAMES[i]}
                </button>
              );
            })}
          </div>
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
                {fmtDateTime(c.scheduledStartAt)} → {fmtTime(c.scheduledEndAt)}
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
      const today = todayInTz();
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
                  {fmtDate(e.date)}
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
