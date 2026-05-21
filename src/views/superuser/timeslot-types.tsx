/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Button, Card, Field, Icon, Modal, Pill, TextInput, useConfirm } from '@/components/ui';
import { TopBar } from '@/components/layout';
import type { TimeslotTypeResponse } from '@/types';
import {
  createTimeslotType,
  deleteTimeslotType,
  listTimeslotTypes,
  setTimeslotTypeActive,
  updateTimeslotType,
} from '@/services/timeslotTypeApi';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  DataGrid,
  EmptyState,
  SectionError,
  TableSkeleton,
  type DataGridColumn,
  type DataGridRow,
} from './shared';

const COLOR_SWATCHES = [
  { v: '#0f6e56', label: 'Teal' },
  { v: '#2a6fcc', label: 'Blue' },
  { v: '#7341a8', label: 'Plum' },
  { v: '#b6791f', label: 'Amber' },
  { v: '#d85a30', label: 'Coral' },
  { v: '#7a8336', label: 'Olive' },
];

export function TimeslotsView() {
  const [items, setItems] = useState<TimeslotTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const confirm = useConfirm();

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listTimeslotTypes();
      setItems([...resp.data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load timeslot types.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const toggleActive = async (t: TimeslotTypeResponse) => {
    setError(null);
    try {
      await setTimeslotTypeActive(t.id, { isActive: !t.isActive });
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not toggle service.'));
    }
  };

  const remove = async (t: TimeslotTypeResponse) => {
    const ok = await confirm({
      title: `Delete "${t.name}"?`,
      body: 'Org users will stop being able to offer this service. Existing bookings keep their type.',
      confirmLabel: 'Delete service',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    try {
      await deleteTimeslotType(t.id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete service.'));
    }
  };

  const columns: DataGridColumn[] = [
    { key: 'swatch', label: '', width: '44px' },
    { key: 'name', label: 'Name', width: 'minmax(0, 2fr)' },
    { key: 'duration', label: 'Duration', width: 'minmax(0, 1fr)' },
    { key: 'status', label: 'Status', width: 'minmax(0, 1fr)' },
    { key: 'actions', label: '', width: '120px' },
  ];

  const rows: DataGridRow[] = items.map((t) => ({
    key: t.id,
    swatch: (
      <span
        className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-white flex-none"
        style={{ background: t.color ?? '#0f6e56' }}
      >
        <Icon name="clock" size={11} />
      </span>
    ),
    name: <span className="text-[13.5px] font-medium truncate">{t.name}</span>,
    duration: <span className="mono tnum text-[13px]">{t.durationMinutes} min</span>,
    status: t.isActive ? (
      <Pill tone="success" dot>
        Active
      </Pill>
    ) : (
      <Pill tone="neutral">Hidden</Pill>
    ),
    actions: (
      <div className="flex gap-1 justify-end">
        <button
          aria-label={t.isActive ? 'Deactivate' : 'Activate'}
          title={t.isActive ? 'Deactivate' : 'Activate'}
          onClick={() => toggleActive(t)}
          className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
        >
          <Icon name={t.isActive ? 'check' : 'refresh'} size={14} />
        </button>
        <button
          aria-label="Edit"
          onClick={() => setModal({ mode: 'edit', item: t })}
          className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
        >
          <Icon name="pencil" size={14} />
        </button>
        <button
          aria-label="Delete"
          onClick={() => remove(t)}
          className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2"
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    ),
  }));

  return (
    <>
      <TopBar
        title="Timeslot types"
        subtitle="Configure the services clients can book."
        right={
          <Button variant="primary" icon="plus" onClick={() => setModal({ mode: 'create' })}>
            Add timeslot type
          </Button>
        }
      />
      <div className="flex-1 overflow-auto qf-page qf-scroll">
        <SectionError message={error} />
        <Card style={{ padding: 0 }}>
          {loading && items.length === 0 ? (
            <TableSkeleton
              rows={4}
              gridTemplate={columns.map((c) => c.width).join(' ')}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon="clock"
              title="No services configured yet"
              body="Add the first service clients can book."
              action={
                <Button variant="primary" icon="plus" onClick={() => setModal({ mode: 'create' })}>
                  Add timeslot type
                </Button>
              }
            />
          ) : (
            <DataGrid columns={columns} rows={rows} />
          )}
        </Card>
      </div>

      <TimeslotModal
        state={modal}
        onClose={() => setModal(null)}
        onSaved={async () => {
          setModal(null);
          await reload();
        }}
      />
    </>
  );
}

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; item: TimeslotTypeResponse };

function TimeslotModal({
  state,
  onClose,
  onSaved,
}: {
  state: ModalState | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [color, setColor] = useState<string>(COLOR_SWATCHES[0].v);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = state?.mode === 'edit';

  useEffect(() => {
    if (state?.mode === 'edit') {
      setName(state.item.name);
      setDuration(state.item.durationMinutes);
      setColor(state.item.color ?? COLOR_SWATCHES[0].v);
    } else {
      setName('');
      setDuration(30);
      setColor(COLOR_SWATCHES[0].v);
    }
    setError(null);
    setSubmitting(false);
  }, [state]);

  if (!state) return null;

  const submit = async () => {
    if (!name.trim()) {
      setError('Service name is required.');
      return;
    }
    if (duration <= 0) {
      setError('Duration must be at least 1 minute.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (state.mode === 'edit') {
        await updateTimeslotType(state.item.id, {
          name: name.trim(),
          durationMinutes: duration,
          color,
        });
      } else {
        await createTimeslotType({ name: name.trim(), durationMinutes: duration, color });
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save service.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit timeslot type' : 'Add timeslot type'}
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
        <Field label="Service name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Consult"
            autoFocus
          />
        </Field>
        <Field label="Duration" hint="Length of one session, in minutes.">
          <div className="flex items-center gap-2 bg-surface border border-line-2 rounded-[8px] px-2.5 h-[38px]">
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 0))}
              className="flex-1 h-full border-0 bg-transparent font-[inherit] text-ink outline-none w-12 min-w-0"
            />
            <span className="text-[12px] text-ink-3">min</span>
          </div>
        </Field>
        <Field label="Color" hint="Used for at-a-glance recognition in the queue.">
          <div className="flex flex-wrap gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c.v}
                onClick={() => setColor(c.v)}
                aria-label={c.label}
                className="border-0 cursor-pointer rounded-[6px]"
                style={{
                  width: 26,
                  height: 26,
                  background: c.v,
                  boxShadow:
                    color === c.v
                      ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)'
                      : 'inset 0 0 0 1px rgba(20,18,12,.06)',
                }}
              />
            ))}
          </div>
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
