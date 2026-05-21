/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Field, Icon, Modal, Pill, TextInput } from '@/components/ui';
import { TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import type { DepartmentResponse, SeatResponse } from '@/types';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '@/services/departmentApi';
import { createSeat, deleteSeat, listSeats, updateSeat } from '@/services/seatApi';
import { getApiErrorMessage } from '@/lib/api-error';
import { SkeletonBox, SkeletonLine, useConfirm } from '@/components/ui';
import { EmptyState, SeatGridSkeleton, SectionError } from './shared';

const DEPT_PALETTE = ['var(--teal)', 'var(--blue)', 'var(--amber)', 'var(--coral)', 'var(--success)'];

export function SeatsView() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);

  const [deptModal, setDeptModal] = useState<DeptModalState | null>(null);
  const [seatModal, setSeatModal] = useState<SeatModalState | null>(null);
  const confirm = useConfirm();

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptsRes, seatsRes] = await Promise.all([listDepartments(), listSeats()]);
      const sortedDepts = [...deptsRes.data].sort((a, b) => a.displayOrder - b.displayOrder);
      setDepartments(sortedDepts);
      setSeats([...seatsRes.data].sort((a, b) => a.displayOrder - b.displayOrder));
      setActiveDeptId((cur) => cur ?? sortedDepts[0]?.id ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load seats.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const activeDept = useMemo(
    () => departments.find((d) => d.id === activeDeptId) ?? null,
    [departments, activeDeptId],
  );
  const activeSeats = useMemo(
    () => seats.filter((s) => s.departmentId === activeDeptId),
    [seats, activeDeptId],
  );
  const seatCountByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of seats) m.set(s.departmentId, (m.get(s.departmentId) ?? 0) + 1);
    return m;
  }, [seats]);

  const onDepartmentDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this department?',
      body: 'All seats inside it will be deleted too. Active bookings on those seats lose their seat assignment.',
      confirmLabel: 'Delete department',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    try {
      await deleteDepartment(id);
      if (activeDeptId === id) setActiveDeptId(null);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete department.'));
    }
  };

  const onSeatDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this seat?',
      body: 'Active bookings on this seat will lose their seat assignment.',
      confirmLabel: 'Delete seat',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    try {
      await deleteSeat(id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete seat.'));
    }
  };

  return (
    <>
      <TopBar
        title="Seats & departments"
        subtitle="Manage your physical and logical resources."
        right={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon="plus"
              onClick={() => setDeptModal({ mode: 'create' })}
            >
              Add department
            </Button>
            <Button
              variant="primary"
              icon="plus"
              disabled={!activeDept}
              onClick={() => activeDept && setSeatModal({ mode: 'create', departmentId: activeDept.id })}
            >
              Add seat
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto lg:overflow-hidden qf-page-tight flex flex-col lg:flex-row gap-[18px] min-h-0">
        <Card
          className="w-full lg:w-[260px] lg:flex-none"
          style={{
            padding: 0,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '100%',
          }}
        >
          <div className="px-[14px] py-3 border-b border-line flex items-center gap-2">
            <span className="text-[12px] font-medium">Departments</span>
            <Pill tone="neutral" className="ml-auto">
              {departments.length}
            </Pill>
          </div>
          <div className="p-1 overflow-auto qf-scroll max-h-[220px] lg:max-h-none">
            {loading && departments.length === 0 ? (
              <div className="p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-[10px] px-[10px] py-2">
                    <SkeletonBox w={8} h={8} />
                    <SkeletonLine w={`${50 + (i % 3) * 14}%`} h={11} />
                    <span className="flex-1" />
                    <SkeletonLine w={14} h={10} />
                  </div>
                ))}
              </div>
            ) : departments.length === 0 ? (
              <div className="px-3 py-4 text-[12px] text-ink-3">
                No departments yet. Add one to get started.
              </div>
            ) : (
              departments.map((d, i) => {
                const sel = activeDeptId === d.id;
                const color = DEPT_PALETTE[i % DEPT_PALETTE.length];
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDeptId(d.id)}
                    className={cn(
                      'w-full flex items-center gap-[10px] px-[10px] py-2',
                      'border-0 rounded-[6px] text-left cursor-pointer relative',
                      'transition-[background] duration-100',
                      sel ? 'bg-surface-2 text-ink' : 'bg-transparent text-ink',
                    )}
                  >
                    {sel && (
                      <span className="absolute left-0 top-[6px] bottom-[6px] w-[2px] bg-teal rounded-full" />
                    )}
                    <span
                      className="w-2 h-2 rounded-[2px] flex-none"
                      style={{ background: color }}
                    />
                    <span className={cn('flex-1 text-[13px] truncate', sel ? 'font-medium' : 'font-normal')}>
                      {d.name}
                    </span>
                    <span className="text-[11px] text-ink-3">{seatCountByDept.get(d.id) ?? 0}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="p-2 border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              icon="plus"
              full
              onClick={() => setDeptModal({ mode: 'create' })}
            >
              Add department
            </Button>
          </div>
        </Card>

        <div className="flex-1 min-w-0 overflow-visible lg:overflow-auto qf-scroll">
          <SectionError message={error} />

          {loading && !activeDept ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <SkeletonLine w={160} h={14} />
                <SkeletonBox w={56} h={18} />
              </div>
              <SeatGridSkeleton tiles={4} />
            </>
          ) : !activeDept ? (
            <EmptyState
              icon="building"
              title="Select a department"
              body="Pick a department from the left to see its seats."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center mb-3 gap-[10px]">
                <h2 className="m-0 text-[16px] font-medium tracking-[-0.01em]">{activeDept.name}</h2>
                <Pill tone="neutral">
                  {activeSeats.length} seat{activeSeats.length === 1 ? '' : 's'}
                </Pill>
                <span className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  icon="pencil"
                  onClick={() => setDeptModal({ mode: 'edit', department: activeDept })}
                >
                  Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  onClick={() => onDepartmentDelete(activeDept.id)}
                >
                  Delete
                </Button>
              </div>

              {activeSeats.length === 0 ? (
                <EmptyState
                  icon="chair"
                  title="No seats here yet"
                  body={`Add the first seat to ${activeDept.name}.`}
                  action={
                    <Button
                      variant="primary"
                      icon="plus"
                      onClick={() => setSeatModal({ mode: 'create', departmentId: activeDept.id })}
                    >
                      Add seat
                    </Button>
                  }
                />
              ) : (
                <div className="qf-card-grid gap-3">
                  {activeSeats.map((s) => (
                    <Card key={s.id} hover style={{ padding: 14 }}>
                      <div className="flex items-center gap-[10px]">
                        <span className="w-8 h-8 rounded-[8px] bg-surface-2 text-ink-3 inline-flex items-center justify-center flex-none">
                          <Icon name="chair" size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] font-medium truncate">{s.name}</div>
                          {s.description && (
                            <div className="text-[11.5px] text-ink-3 truncate">{s.description}</div>
                          )}
                        </div>
                        <button
                          aria-label="Edit"
                          onClick={() => setSeatModal({ mode: 'edit', seat: s })}
                          className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
                        >
                          <Icon name="pencil" size={13} />
                        </button>
                        <button
                          aria-label="Delete"
                          onClick={() => onSeatDelete(s.id)}
                          className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                      <div className="border-t border-line mt-3 pt-3 flex items-center gap-2">
                        <Pill tone={s.requiresApproval ? 'amber' : 'success'}>
                          {s.requiresApproval ? 'Manual approval' : 'Auto approve'}
                        </Pill>
                      </div>
                    </Card>
                  ))}
                  <button
                    onClick={() => setSeatModal({ mode: 'create', departmentId: activeDept.id })}
                    className="p-[14px] rounded-[12px] bg-transparent cursor-pointer text-ink-3 flex items-center justify-center gap-2 text-[13px] font-medium min-h-[110px]"
                    style={{ border: '1.5px dashed var(--line-2)' }}
                  >
                    <Icon name="plus" size={14} />
                    Add seat to {activeDept.name}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DeptModal
        state={deptModal}
        nextDisplayOrder={departments.length}
        onClose={() => setDeptModal(null)}
        onSaved={async (savedId) => {
          setDeptModal(null);
          await reload();
          if (savedId) setActiveDeptId(savedId);
        }}
      />

      <SeatModal
        state={seatModal}
        nextDisplayOrder={activeSeats.length}
        onClose={() => setSeatModal(null)}
        onSaved={async () => {
          setSeatModal(null);
          await reload();
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────
// Department modal
// ─────────────────────────────────────────────────

type DeptModalState =
  | { mode: 'create' }
  | { mode: 'edit'; department: DepartmentResponse };

function DeptModal({
  state,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  state: DeptModalState | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: (savedId?: string) => void;
}) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = state?.mode === 'edit';

  useEffect(() => {
    if (state?.mode === 'edit') setName(state.department.name);
    else setName('');
    setError(null);
    setSubmitting(false);
  }, [state]);

  if (!state) return null;

  const submit = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (state.mode === 'edit') {
        const resp = await updateDepartment(state.department.id, {
          name: name.trim(),
          displayOrder: state.department.displayOrder,
        });
        onSaved(resp.data.id);
      } else {
        const resp = await createDepartment({ name: name.trim(), displayOrder: nextDisplayOrder });
        onSaved(resp.data.id);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save department.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Rename department' : 'Add department'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <Field label="Department name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. General Practice"
          autoFocus
        />
      </Field>
      {error && (
        <div className="text-coral text-[12.5px] mt-2" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────
// Seat modal
// ─────────────────────────────────────────────────

type SeatModalState =
  | { mode: 'create'; departmentId: string }
  | { mode: 'edit'; seat: SeatResponse };

function SeatModal({
  state,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  state: SeatModalState | null;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = state?.mode === 'edit';

  useEffect(() => {
    if (state?.mode === 'edit') {
      setName(state.seat.name);
      setDescription(state.seat.description ?? '');
      setRequiresApproval(state.seat.requiresApproval);
    } else {
      setName('');
      setDescription('');
      setRequiresApproval(true);
    }
    setError(null);
    setSubmitting(false);
  }, [state]);

  if (!state) return null;

  const submit = async () => {
    if (!name.trim()) {
      setError('Seat name is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (state.mode === 'edit') {
        await updateSeat(state.seat.id, {
          departmentId: state.seat.departmentId,
          name: name.trim(),
          description: description.trim() || null,
          requiresApproval,
          displayOrder: state.seat.displayOrder,
        });
      } else {
        await createSeat({
          departmentId: state.departmentId,
          name: name.trim(),
          description: description.trim() || null,
          requiresApproval,
          displayOrder: nextDisplayOrder,
        });
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save seat.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit seat' : 'Add seat'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Consultation room 3"
            autoFocus
          />
        </Field>
        <Field label="Description" hint="Optional internal note for staff.">
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Refurbished Q1 2026"
          />
        </Field>
        <label className="flex items-center gap-2.5 text-[13px] text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
          />
          <span>
            Require manual approval for new bookings
            <span className="block text-[11.5px] text-ink-3">
              Turn off to auto-approve every incoming request on this seat.
            </span>
          </span>
        </label>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
