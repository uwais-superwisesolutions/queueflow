/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Card, Field, Icon, Modal, Pill, SelectInput, TextInput, useConfirm } from '@/components/ui';
import { TopBar } from '@/components/layout';
import type { InvitationResponse, MemberResponse, MemberRole, SeatResponse } from '@/types';
import { deleteMember, getInvitations, getMembers, inviteUser } from '@/services/organisationApi';
import { listSeats } from '@/services/seatApi';
import { getApiErrorMessage } from '@/lib/api-error';
import { fmtDate } from '@/lib/date';
import {
  DataGrid,
  EmptyState,
  SectionError,
  StatusBadge,
  TableSkeleton,
  Tabs,
  type DataGridColumn,
  type DataGridRow,
  type MemberStatus,
  type TabItem,
} from './shared';

type OrgTab = 'all' | 'members' | 'invited';

interface UnifiedRow {
  key: string;
  email: string;
  fullName: string;
  role: MemberRole;
  status: MemberStatus;
  lastActivity: string;
  isInvite: boolean;
  orgMemberId: string | null;
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return fmtDate(iso);
}

export function OrgUsersView() {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [invitations, setInvitations] = useState<InvitationResponse[]>([]);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<OrgTab>('all');
  const [query, setQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, iRes, sRes] = await Promise.all([
        getMembers(),
        getInvitations(),
        listSeats().catch(() => ({ data: [] as SeatResponse[] })),
      ]);
      setMembers(mRes.data);
      setInvitations(iRes.data);
      setSeats(sRes.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your team.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo<UnifiedRow[]>(() => {
    const memberRows: UnifiedRow[] = members.map((m) => ({
      key: `m:${m.orgMemberId}`,
      email: m.email,
      fullName: m.fullName,
      role: m.role,
      status: (m.status === 'suspended' ? 'suspended' : 'active') as MemberStatus,
      lastActivity: m.joinedAt,
      isInvite: false,
      orgMemberId: m.orgMemberId,
    }));

    const inviteRows: UnifiedRow[] = invitations
      .filter((i) => !members.some((m) => m.email.toLowerCase() === i.email.toLowerCase()))
      .map((i) => ({
        key: `i:${i.id}`,
        email: i.email,
        fullName: i.email.split('@')[0],
        role: i.role,
        status: (i.accepted ? 'accepted' : 'invited') as MemberStatus,
        lastActivity: i.createdAt,
        isInvite: true,
        orgMemberId: null,
      }));

    return [...memberRows, ...inviteRows].sort((a, b) => a.email.localeCompare(b.email));
  }, [members, invitations]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === 'members' && r.isInvite) return false;
      if (tab === 'invited' && !r.isInvite) return false;
      if (query && !`${r.fullName} ${r.email}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [rows, tab, query]);

  const tabItems: TabItem[] = [
    { id: 'all', label: 'All', count: rows.length },
    { id: 'members', label: 'Members', count: rows.filter((r) => !r.isInvite).length },
    { id: 'invited', label: 'Invited', count: rows.filter((r) => r.isInvite).length },
  ];

  const handleDelete = async (row: UnifiedRow) => {
    if (!row.orgMemberId) return;
    const ok = await confirm({
      title: `Remove ${row.fullName}?`,
      body: `${row.email} will lose access to this organisation immediately. This cannot be undone.`,
      confirmLabel: 'Remove member',
      cancelLabel: 'Keep them',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingId(row.orgMemberId);
    try {
      await deleteMember(row.orgMemberId);
      await reload();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not remove member.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: DataGridColumn[] = [
    { key: 'name', label: 'Person', width: 'minmax(0, 2fr)' },
    { key: 'role', label: 'Role', width: 'minmax(0, 1fr)' },
    { key: 'last', label: 'Joined / invited', width: 'minmax(0, 1.2fr)' },
    { key: 'status', label: 'Status', width: 'minmax(0, 1fr)' },
    { key: 'actions', label: '', width: '40px' },
  ];

  const gridRows: DataGridRow[] = filtered.map((r) => ({
    key: r.key,
    name: (
      <span className="flex items-center gap-[10px]">
        <Avatar name={r.fullName} size={28} active={!r.isInvite} />
        <span className="min-w-0">
          <span className="block text-[13px] font-medium truncate">{r.fullName}</span>
          <span className="text-[11.5px] text-ink-3 truncate block">{r.email}</span>
        </span>
      </span>
    ),
    role: <Pill tone={r.role === 'super_user' ? 'teal' : 'neutral'}>{roleLabel(r.role)}</Pill>,
    last: <span className="text-[12px] text-ink-3">{relativeTime(r.lastActivity)}</span>,
    status: <StatusBadge status={r.status} />,
    actions: r.orgMemberId ? (
      <RowMenu
        disabled={deletingId === r.orgMemberId}
        onDelete={() => handleDelete(r)}
      />
    ) : null,
  }));

  return (
    <>
      <TopBar
        title="Org users"
        subtitle={`${members.length} member${members.length === 1 ? '' : 's'} · ${invitations.filter((i) => !i.accepted).length} pending invite${invitations.filter((i) => !i.accepted).length === 1 ? '' : 's'}`}
        right={
          <Button variant="primary" icon="plus" onClick={() => setShowInvite(true)}>
            Invite new
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        <SectionError message={error} />

        <div className="flex items-center gap-3 mb-3">
          <Tabs value={tab} onChange={(id) => setTab(id as OrgTab)} items={tabItems} />
          <span className="flex-1" />
          <TextInput
            icon="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            wrapClassName="w-[240px]"
          />
          <Button variant="ghost" size="sm" icon="refresh" onClick={reload} disabled={loading}>
            Refresh
          </Button>
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {loading && rows.length === 0 ? (
            <TableSkeleton
              rows={5}
              gridTemplate={columns.map((c) => c.width).join(' ')}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="users"
              title={query ? 'No matches' : 'No team yet'}
              body={query ? `No people matching "${query}".` : 'Invite your first colleague to get started.'}
              action={
                !query && (
                  <Button variant="primary" icon="plus" onClick={() => setShowInvite(true)}>
                    Invite new
                  </Button>
                )
              }
            />
          ) : (
            <DataGrid columns={columns} rows={gridRows} />
          )}
        </Card>
      </div>

      <InviteModal
        open={showInvite}
        seats={seats}
        onClose={() => setShowInvite(false)}
        onSent={async () => {
          setShowInvite(false);
          await reload();
        }}
      />
    </>
  );
}

function roleLabel(role: MemberRole): string {
  return role === 'super_user' ? 'Super user' : 'Org user';
}

function RowMenu({ onDelete, disabled }: { onDelete: () => void; disabled?: boolean }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const open = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = btnRef.current!.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  };

  return (
    <div className="flex items-center justify-end">
      <button
        ref={btnRef}
        className="w-7 h-7 rounded-[6px] flex items-center justify-center text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors border-0 bg-transparent cursor-pointer"
        onClick={open}
        disabled={disabled}
        aria-label="More options"
      >
        <Icon name="dotsH" size={14} />
      </button>

      {pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPos(null)} />
          <div
            className="fixed z-50 rounded-[10px] border border-line bg-surface shadow-md py-1"
            style={{ top: pos.top, right: pos.right, minWidth: 148 }}
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-[12.5px] text-coral hover:bg-surface-2 transition-colors border-0 bg-transparent cursor-pointer text-left"
              onClick={() => { setPos(null); onDelete(); }}
            >
              <Icon name="trash" size={13} />
              Remove member
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface InviteModalProps {
  open: boolean;
  seats: SeatResponse[];
  onClose: () => void;
  onSent: () => void;
}

function InviteModal({ open, seats, onClose, onSent }: InviteModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('org_user');
  const [preferredSeat, setPreferredSeat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFullName('');
      setEmail('');
      setRole('org_user');
      setPreferredSeat('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const send = async () => {
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await inviteUser({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        preferredSeat: preferredSeat || null,
      });
      onSent();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send invite.'));
    } finally {
      setSubmitting(false);
    }
  };

  const seatOptions = [
    { value: '', label: '— No preferred seat' },
    ...seats.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite org user"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="send" onClick={send} disabled={submitting}>
            {submitting ? 'Sending…' : 'Send invite'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Full name" hint="Shown to clients and on the queue.">
          <TextInput
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autoFocus
          />
        </Field>
        <Field label="Email" hint="They'll get a magic-link sign-in.">
          <TextInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@clinic.com"
            type="email"
          />
        </Field>
        <Field label="Role">
          <SelectInput
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            options={[
              { value: 'org_user', label: 'Org user' },
              { value: 'super_user', label: 'Super user' },
            ]}
          />
        </Field>
        <Field label="Preferred seat" hint="Optional — they can also pick one at login.">
          <SelectInput
            value={preferredSeat}
            onChange={(e) => setPreferredSeat(e.target.value)}
            options={seatOptions}
          />
        </Field>
        {error && (
          <div className="text-coral text-[12.5px]" role="alert">
            <Icon name="alert" size={12} /> {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
