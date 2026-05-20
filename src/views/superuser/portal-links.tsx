/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Field,
  Modal,
  Pill,
  QRCode,
  SelectInput,
  SkeletonBox,
  SkeletonLine,
  TextInput,
  useConfirm,
} from '@/components/ui';
import { TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useCopy } from '@/hooks/use-copy';
import { listDepartments } from '@/services/departmentApi';
import { listSeats } from '@/services/seatApi';
import {
  createPortalLink,
  deletePortalLink,
  listPortalLinks,
} from '@/services/portalLinkApi';
import { getApiErrorMessage } from '@/lib/api-error';
import type {
  CreatePortalLinkPayload,
  DepartmentResponse,
  PortalLinkResponse,
  PortalLinkScope,
  SeatResponse,
} from '@/types';
import { EmptyState, SectionError } from './shared';

interface PortalLinksViewProps {
  onOpenClientPortal?: () => void;
}

function publicUrlForSlug(slug: string): string {
  if (typeof window === 'undefined') return `/client?slug=${slug}`;
  return `${window.location.origin}/client?slug=${slug}`;
}

export function PortalLinksView({ onOpenClientPortal }: PortalLinksViewProps = {}) {
  const [items, setItems] = useState<PortalLinkResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const confirm = useConfirm();

  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);
  const seatNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of seats) m.set(s.id, s.name);
    return m;
  }, [seats]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [linksRes, deptsRes, seatsRes] = await Promise.all([
        listPortalLinks(),
        listDepartments(),
        listSeats(),
      ]);
      setItems(
        [...linksRes.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
      setDepartments(deptsRes.data);
      setSeats(seatsRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load portal links.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this portal link?',
      body: 'Anyone with this URL will lose access. You can always generate another.',
      confirmLabel: 'Delete link',
      tone: 'danger',
    });
    if (!ok) return;
    setError(null);
    try {
      await deletePortalLink(id);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete link.'));
    }
  };

  const renderScope = (link: PortalLinkResponse): string => {
    if (link.scopeType === 'org') return 'Whole org';
    if (link.scopeType === 'department') {
      const name = link.scopeId ? deptNameById.get(link.scopeId) : null;
      return `Department · ${name ?? 'unknown'}`;
    }
    const name = link.scopeId ? seatNameById.get(link.scopeId) : null;
    return `Seat · ${name ?? 'unknown'}`;
  };

  return (
    <>
      <TopBar
        title="Client portal links"
        subtitle="QR codes and shareable URLs for joining your queue."
        right={
          <Button variant="primary" icon="plus" onClick={() => setShowCreate(true)}>
            Generate new link
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        <SectionError message={error} />
        {loading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} style={{ padding: 14, overflow: 'hidden' }}>
                <div className="flex items-start gap-3">
                  <SkeletonBox w={72} h={72} />
                  <div className="flex-1 min-w-0">
                    <SkeletonLine w="70%" h={13} />
                    <SkeletonLine w="90%" h={10} className="mt-2" />
                    <SkeletonLine w="50%" h={16} className="mt-2" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-line">
                  <SkeletonLine w="40%" h={11} />
                  <div className="flex gap-2 justify-end mt-2">
                    <SkeletonBox w={64} h={28} />
                    <SkeletonBox w={56} h={28} />
                    <SkeletonBox w={68} h={28} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="qr"
            title="No portal links yet"
            body="Generate the first link to give clients a way into your queue."
            action={
              <Button variant="primary" icon="plus" onClick={() => setShowCreate(true)}>
                Generate new link
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {items.map((l) => (
              <LinkCard
                key={l.id}
                link={l}
                scopeLabel={renderScope(l)}
                onDelete={() => handleDelete(l.id)}
                onOpenClientPortal={onOpenClientPortal}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePortalLinkModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => {
          setShowCreate(false);
          await reload();
        }}
        departments={departments}
        seats={seats}
      />
    </>
  );
}

function LinkCard({
  link,
  scopeLabel,
  onDelete,
  onOpenClientPortal,
}: {
  link: PortalLinkResponse;
  scopeLabel: string;
  onDelete: () => void;
  onOpenClientPortal?: () => void;
}) {
  const { copy, copied } = useCopy();
  const url = publicUrlForSlug(link.slug);
  const displayUrl = url.replace(/^https?:\/\//, '');

  return (
    <Card hover style={{ padding: 14, overflow: 'hidden' }}>
      <div className="flex items-start gap-3 min-w-0">
        <QRCode size={72} value={url} />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-medium truncate">{link.name}</div>
          <div className="mono text-[11px] text-ink-3 mt-[2px] leading-[1.4] break-all">
            {displayUrl}
          </div>
          <Pill tone="neutral" className="mt-2">
            {scopeLabel}
          </Pill>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-line">
        <div className="flex items-center gap-[6px] min-w-0 mb-2">
          <span className="tnum text-[13px] font-medium">{link.scanCount.toLocaleString()}</span>
          <span className="text-[11.5px] text-ink-3">scans</span>
          <span className="text-[11.5px] text-ink-4 truncate">
            · {new Date(link.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {!link.isActive && <Pill tone="coral" className="ml-1">Inactive</Pill>}
        </div>
        <div className="flex items-center flex-wrap gap-[6px] justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon={copied ? 'check' : 'copy'}
            onClick={() => void copy(url)}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon="trash"
            onClick={onDelete}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconRight="arrowR"
            onClick={onOpenClientPortal}
          >
            Open
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CreatePortalLinkModal({
  open,
  onClose,
  onCreated,
  departments,
  seats,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  departments: DepartmentResponse[];
  seats: SeatResponse[];
}) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState<PortalLinkScope>('org');
  const [scopeId, setScopeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setScope('org');
      setScopeId('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Link name is required.');
      return;
    }
    if (scope !== 'org' && !scopeId) {
      setError(`Pick a ${scope === 'department' ? 'department' : 'seat'}.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreatePortalLinkPayload = {
        name: name.trim(),
        scopeType: scope,
        scopeId: scope === 'org' ? null : scopeId,
      };
      await createPortalLink(payload);
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create link.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate a new link"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="link" onClick={submit} disabled={submitting}>
            {submitting ? 'Generating…' : 'Generate link'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[14px]">
        <Field label="Link name" hint="Where will you post this?">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Main entrance QR" autoFocus />
        </Field>
        <Field label="Scope">
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {([
              { id: 'org', label: 'Whole org' },
              { id: 'department', label: 'Department' },
              { id: 'seat', label: 'Specific seat' },
            ] as { id: PortalLinkScope; label: string }[]).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setScope(o.id);
                  setScopeId('');
                }}
                className={cn(
                  'px-3 py-[10px] rounded-[8px] cursor-pointer text-left text-[12.5px] font-medium',
                  'border transition-[background,border-color,color] duration-100',
                  scope === o.id
                    ? 'bg-teal-tint border-teal text-teal-ink'
                    : 'bg-surface border-line-2 text-ink hover:bg-surface-2',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        {scope === 'department' && (
          <Field label="Department">
            <SelectInput
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              options={[
                { value: '', label: '— Pick a department' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </Field>
        )}
        {scope === 'seat' && (
          <Field label="Seat">
            <SelectInput
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              options={[
                { value: '', label: '— Pick a seat' },
                ...seats.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </Field>
        )}
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
