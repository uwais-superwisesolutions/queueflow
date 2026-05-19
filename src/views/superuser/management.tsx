// src/views/superuser/management.tsx
// All 5 super-user management views: OrgUsers, Seats, Timeslots, ClientLinks, Analytics

import { useState, useMemo, type ReactNode } from 'react';
import { Icon, Button, Card, Pill, Field, TextInput, SelectInput, Avatar, Modal, Kpi, QRPlaceholder } from '@/components/ui';
import { TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import type { Tone } from '@/types';

/* ─────────────────────────────────────────────────
   Local TypeScript interfaces for mock data
───────────────────────────────────────────────── */

interface OrgUserRow {
  id: number;
  name: string;
  email: string;
  role: 'Org user' | 'Super user';
  seat: string;
  lastActive: string;
  active: boolean;
  status: 'active' | 'owner' | 'invited' | 'suspended';
}

interface DeptRow {
  id: number;
  name: string;
  count: number;
  color: string;
}

interface SeatRow {
  id: number;
  name: string;
  desc: string;
  claimed: string | null;
}

interface TimeslotRow {
  id: number;
  name: string;
  duration: number;
  color: string;
  usedBy: number;
  isDefault: boolean;
}

interface PortalLink {
  id: number;
  name: string;
  url: string;
  scope: string;
  created: string;
  scans: number;
}

type WaitByDept = { name: string; min: number };
type SeatUtil = { name: string; util: number };

/* ─────────────────────────────────────────────────
   Mock data
───────────────────────────────────────────────── */

const ORG_USERS: OrgUserRow[] = [
  { id: 1, name: 'Amara Okonkwo',  email: 'amara@bryanstonfp.co.za',  role: 'Org user',   seat: 'Consultation room 1', lastActive: 'now',       active: true,  status: 'active' },
  { id: 2, name: 'Sipho Dlamini',  email: 'sipho@bryanstonfp.co.za',  role: 'Org user',   seat: 'Consultation room 2', lastActive: 'now',       active: true,  status: 'active' },
  { id: 3, name: 'Naledi Brown',   email: 'naledi@bryanstonfp.co.za', role: 'Org user',   seat: 'Dental chair A',      lastActive: '8 min ago',  active: true,  status: 'active' },
  { id: 4, name: 'Khaya Mthembu',  email: 'khaya@bryanstonfp.co.za',  role: 'Org user',   seat: 'Dental chair B',      lastActive: '23 min ago', active: true,  status: 'active' },
  { id: 5, name: 'Lerato Smith',   email: 'lerato@bryanstonfp.co.za', role: 'Org user',   seat: 'Triage desk',         lastActive: 'now',       active: true,  status: 'active' },
  { id: 6, name: 'Kefilwe Nkosi',  email: 'kefi@bryanstonfp.co.za',   role: 'Super user', seat: '—',                   lastActive: '2 h ago',    active: false, status: 'active' },
  { id: 7, name: 'Thandi Mbeki',   email: 'thandi@bryanstonfp.co.za', role: 'Super user', seat: '—',                   lastActive: 'now',       active: true,  status: 'owner' },
  { id: 8, name: 'Refilwe Tau',    email: 'refilwe@bryanstonfp.co.za',role: 'Org user',   seat: '—',                   lastActive: '—',         active: false, status: 'invited' },
  { id: 9, name: 'Mandla Sithole', email: 'mandla@bryanstonfp.co.za', role: 'Org user',   seat: '—',                   lastActive: '4 d ago',    active: false, status: 'suspended' },
];

const DEPTS: DeptRow[] = [
  { id: 1, name: 'General Practice', count: 4, color: 'var(--teal)' },
  { id: 2, name: 'Dental',           count: 2, color: 'var(--blue)' },
  { id: 3, name: 'Pediatrics',       count: 1, color: 'var(--amber)' },
];

const SEATS_BY_DEPT: Record<number, SeatRow[]> = {
  1: [
    { id: 1, name: 'Consultation room 1', desc: "Dr. Okonkwo's primary room", claimed: 'Amara Okonkwo' },
    { id: 2, name: 'Consultation room 2', desc: '',                            claimed: 'Sipho Dlamini' },
    { id: 3, name: 'Consultation room 3', desc: 'Refurbished Q1 2026',         claimed: null },
    { id: 4, name: 'Triage desk',         desc: 'Reception triage',            claimed: 'Lerato Smith' },
  ],
  2: [
    { id: 5, name: 'Dental chair A', desc: 'Hygiene + general',   claimed: 'Naledi Brown' },
    { id: 6, name: 'Dental chair B', desc: 'Restorative',         claimed: 'Khaya Mthembu' },
  ],
  3: [
    { id: 7, name: 'Peds room', desc: 'Pediatric wing, quieter', claimed: null },
  ],
};

const TIMESLOT_ROWS: TimeslotRow[] = [
  { id: 1, name: 'Consult',          duration: 30, color: '#0f6e56', usedBy: 5, isDefault: true },
  { id: 2, name: 'Follow-up',        duration: 15, color: '#2a6fcc', usedBy: 5, isDefault: true },
  { id: 3, name: 'Triage',           duration: 10, color: '#b6791f', usedBy: 1, isDefault: false },
  { id: 4, name: 'Extended consult', duration: 45, color: '#7341a8', usedBy: 2, isDefault: false },
  { id: 5, name: 'Vaccination',      duration: 10, color: '#1f8a5b', usedBy: 3, isDefault: false },
  { id: 6, name: 'Dental cleaning',  duration: 60, color: '#7a8336', usedBy: 2, isDefault: false },
];

const LINKS: PortalLink[] = [
  { id: 1, name: 'Main entrance QR',        url: 'queueflow.io/q/bryanstonfp',             scope: 'Whole org',               created: '12 Feb 2026', scans: 1842 },
  { id: 2, name: 'Reception desk handout',  url: 'queueflow.io/q/bryanstonfp?l=reception', scope: 'Whole org',               created: '14 Feb 2026', scans: 612 },
  { id: 3, name: 'Dental waiting area',     url: 'queueflow.io/q/bryanstonfp/dental',      scope: 'Department · Dental',     created: '03 Mar 2026', scans: 287 },
  { id: 4, name: 'Triage walk-in poster',   url: 'queueflow.io/q/bryanstonfp/triage',      scope: 'Seat · Triage desk',      created: '21 Apr 2026', scans: 96 },
  { id: 5, name: 'Pediatrics referral card',url: 'queueflow.io/q/bryanstonfp/peds',        scope: 'Department · Pediatrics', created: '08 May 2026', scans: 11 },
];

const BOOKINGS_30D: number[] = [62, 71, 68, 84, 78, 92, 88, 74, 80, 96, 102, 89, 95, 100, 87, 84, 110, 105, 98, 112, 108, 99, 116, 121, 104, 95, 108, 102, 118, 87];

const WAIT_BY_DEPT: WaitByDept[] = [
  { name: 'General Practice', min: 24 },
  { name: 'Dental',           min: 18 },
  { name: 'Pediatrics',       min: 31 },
  { name: 'Triage',           min: 12 },
];

const SEAT_UTIL: SeatUtil[] = [
  { name: 'Consultation room 1', util: 84 },
  { name: 'Consultation room 2', util: 78 },
  { name: 'Consultation room 3', util: 22 },
  { name: 'Dental chair A',      util: 91 },
  { name: 'Dental chair B',      util: 67 },
  { name: 'Triage desk',         util: 73 },
  { name: 'Peds room',           util: 14 },
];

/* ─────────────────────────────────────────────────
   Shared primitives
───────────────────────────────────────────────── */

type TabId = string;

interface TabItem {
  id: TabId;
  label: string;
  count?: number;
}

function Tabs({ value, onChange, items }: { value: TabId; onChange: (id: TabId) => void; items: TabItem[] }) {
  return (
    <div className="flex gap-[2px] bg-surface-2 p-[3px] rounded-[8px] border border-line">
      {items.map(it => {
        const sel = value === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              'px-[10px] py-[5px] border-0 rounded-[6px] text-[12.5px] font-medium cursor-pointer',
              'inline-flex items-center gap-[6px] transition-[background,color,box-shadow] duration-100',
              sel
                ? 'bg-surface text-ink shadow-sm'
                : 'bg-transparent text-ink-3 hover:text-ink-2',
            )}
          >
            {it.label}
            {it.count != null && (
              <span
                className={cn(
                  'tnum text-[10.5px] text-ink-3 rounded-[4px] px-[4px]',
                  sel ? 'bg-surface-2' : 'bg-transparent',
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface DataGridColumn {
  key: string;
  label: string;
  width: string;
}

interface DataGridRow {
  key: string | number;
  [col: string]: ReactNode | string | number;
}

function DataGrid({ columns, rows }: { columns: DataGridColumn[]; rows: DataGridRow[] }) {
  const gridTemplate = columns.map(c => c.width).join(' ');
  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
        className="px-4 py-[10px] border-b border-line bg-surface-2 text-[11px] text-ink-3 font-semibold uppercase tracking-[0.05em]"
      >
        {columns.map(c => <div key={c.key}>{c.label}</div>)}
      </div>
      <div>
        {rows.map((r, i) => (
          <div
            key={r.key as string | number}
            style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
            className={cn(
              'px-4 py-3 items-center transition-[background] duration-100 hover:bg-surface-2',
              i < rows.length - 1 ? 'border-b border-line' : '',
            )}
          >
            {columns.map(c => (
              <div key={c.key} className="min-w-0">{r[c.key] as ReactNode}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon = 'users', title, body }: { icon?: string; title: string; body: string }) {
  return (
    <div className="py-12 px-6 text-center text-ink-3">
      <span className="w-12 h-12 rounded-[12px] bg-surface-2 text-ink-3 inline-flex items-center justify-center mb-[14px]">
        <Icon name={icon as never} size={20} />
      </span>
      <h3 className="m-0 mb-[6px] text-[15px] font-medium text-ink">{title}</h3>
      <p className="m-0 text-[13px] text-ink-3 max-w-[320px] mx-auto">{body}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   StatusBadge
───────────────────────────────────────────────── */

type UserStatus = 'active' | 'owner' | 'invited' | 'suspended';

interface StatusConfig {
  tone: Tone;
  dot?: boolean;
  label: string;
}

const STATUS_MAP: Record<UserStatus, StatusConfig> = {
  active:    { tone: 'success', dot: true,  label: 'Active' },
  owner:     { tone: 'teal',    dot: true,  label: 'Owner' },
  invited:   { tone: 'amber',   dot: false, label: 'Invited' },
  suspended: { tone: 'coral',   dot: false, label: 'Suspended' },
};

function StatusBadge({ status }: { status: UserStatus }) {
  const m = STATUS_MAP[status] ?? { tone: 'neutral' as Tone, label: status };
  return <Pill tone={m.tone} dot={m.dot}>{m.label}</Pill>;
}

/* ─────────────────────────────────────────────────
   #11  OrgUsersView
───────────────────────────────────────────────── */

type OrgTab = 'all' | 'active' | 'invited' | 'suspended';

export function OrgUsersView() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<OrgTab>('all');

  const filtered = useMemo(() => {
    return ORG_USERS.filter(u => {
      if (tab === 'active'    && u.status !== 'active' && u.status !== 'owner') return false;
      if (tab === 'invited'   && u.status !== 'invited') return false;
      if (tab === 'suspended' && u.status !== 'suspended') return false;
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, tab]);

  const tabItems: TabItem[] = [
    { id: 'all',       label: 'All',       count: ORG_USERS.length },
    { id: 'active',    label: 'Active',    count: ORG_USERS.filter(u => u.status === 'active' || u.status === 'owner').length },
    { id: 'invited',   label: 'Invited',   count: ORG_USERS.filter(u => u.status === 'invited').length },
    { id: 'suspended', label: 'Suspended', count: ORG_USERS.filter(u => u.status === 'suspended').length },
  ];

  const columns: DataGridColumn[] = [
    { key: 'name',    label: 'Person',        width: '2fr' },
    { key: 'role',    label: 'Role',          width: '1fr' },
    { key: 'seat',    label: 'Assigned seat', width: '1.5fr' },
    { key: 'last',    label: 'Last active',   width: '1fr' },
    { key: 'status',  label: 'Status',        width: '1fr' },
    { key: 'actions', label: '',              width: '60px' },
  ];

  const rows: DataGridRow[] = filtered.map(u => ({
    key: u.id,
    name: (
      <span className="flex items-center gap-[10px]">
        <Avatar name={u.name} size={28} active={u.active} />
        <span className="min-w-0">
          <span className="block text-[13px] font-medium">{u.name}</span>
          <span className="text-[11.5px] text-ink-3">{u.email}</span>
        </span>
      </span>
    ),
    role: <Pill tone={u.role === 'Super user' ? 'teal' : 'neutral'}>{u.role}</Pill>,
    seat: u.seat === '—'
      ? <span className="text-ink-4">—</span>
      : (
        <span className="inline-flex items-center gap-[6px]">
          <Icon name="chair" size={12} className="text-ink-3" />
          <span className="text-[12.5px]">{u.seat}</span>
        </span>
      ),
    last:    <span className="text-[12px] text-ink-3">{u.lastActive}</span>,
    status:  <StatusBadge status={u.status} />,
    actions: (
      <button className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2">
        <Icon name="dotsH" size={14} />
      </button>
    ),
  }));

  return (
    <>
      <TopBar
        title="Org users"
        subtitle={`${ORG_USERS.length} people across your organization`}
        right={
          <div className="flex gap-2">
            <Button variant="secondary" icon="download">Export</Button>
            <Button variant="primary" icon="plus">Invite new</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-3">
          <Tabs value={tab} onChange={id => setTab(id as OrgTab)} items={tabItems} />
          <span className="flex-1" />
          <TextInput
            icon="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name or email"
            wrapClassName="w-[240px]"
          />
        </div>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <DataGrid columns={columns} rows={rows} />
        </Card>

        {filtered.length === 0 && (
          <EmptyState icon="users" title="No matches" body={`No users matching "${q}".`} />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────
   #12  SeatsView
───────────────────────────────────────────────── */

export function SeatsView() {
  const [activeDept, setActiveDept] = useState<number>(1);
  const seats = SEATS_BY_DEPT[activeDept] ?? [];
  const dept = DEPTS.find(d => d.id === activeDept)!;

  return (
    <>
      <TopBar
        title="Seats & departments"
        subtitle="Manage your physical and logical resources."
        right={
          <div className="flex gap-2">
            <Button variant="secondary" icon="plus">Add department</Button>
            <Button variant="primary" icon="plus">Add seat</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-hidden px-6 pt-4 pb-6 flex gap-[18px] min-h-0">
        {/* Left pane */}
        <Card
          style={{ padding: 0, width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}
        >
          <div className="px-[14px] py-3 border-b border-line flex items-center gap-2">
            <span className="text-[12px] font-medium">Departments</span>
            <Pill tone="neutral" className="ml-auto">{DEPTS.length}</Pill>
          </div>
          <div className="p-1 overflow-auto qf-scroll">
            {DEPTS.map(d => {
              const sel = activeDept === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDept(d.id)}
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
                    style={{ background: d.color }}
                  />
                  <span className={cn('flex-1 text-[13px]', sel ? 'font-medium' : 'font-normal')}>
                    {d.name}
                  </span>
                  <span className="text-[11px] text-ink-3">{d.count}</span>
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t border-line">
            <Button variant="ghost" size="sm" icon="plus" full>Add department</Button>
          </div>
        </Card>

        {/* Right pane */}
        <div className="flex-1 min-w-0 overflow-auto qf-scroll">
          <div className="flex items-center mb-3 gap-[10px]">
            <h2 className="m-0 text-[16px] font-medium tracking-[-0.01em]">{dept.name}</h2>
            <Pill tone="neutral">{seats.length} seats</Pill>
            <span className="text-[12px] text-ink-3">Drag to reorder</span>
            <span className="flex-1" />
            <Button variant="ghost" size="sm" icon="pencil">Rename</Button>
            <Button variant="ghost" size="sm" icon="trash">Delete</Button>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {seats.map(s => (
              <Card key={s.id} hover style={{ padding: 14 }}>
                <div className="flex items-center gap-[10px]">
                  <span className="text-ink-4 cursor-grab">
                    <Icon name="list" size={14} />
                  </span>
                  <span className="w-8 h-8 rounded-[8px] bg-surface-2 text-ink-3 inline-flex items-center justify-center flex-none">
                    <Icon name="chair" size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium">{s.name}</div>
                    {s.desc && <div className="text-[11.5px] text-ink-3">{s.desc}</div>}
                  </div>
                  <button className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px]">
                    <Icon name="dotsH" size={14} />
                  </button>
                </div>
                <div className="border-t border-line mt-3 pt-3 flex items-center gap-2">
                  {s.claimed ? (
                    <>
                      <Avatar name={s.claimed} size={22} active />
                      <span className="text-[12px] text-ink-2">{s.claimed}</span>
                      <Pill tone="success" className="ml-auto text-[10px]">On shift</Pill>
                    </>
                  ) : (
                    <>
                      <span
                        className="w-[22px] h-[22px] rounded-full inline-flex items-center justify-center text-ink-4 flex-none"
                        style={{ border: '1.5px dashed var(--line-2)' }}
                      >
                        <Icon name="user" size={12} />
                      </span>
                      <span className="text-[12px] text-ink-3">Unclaimed</span>
                    </>
                  )}
                </div>
              </Card>
            ))}
            {/* Add tile */}
            <button
              className="p-[14px] rounded-[12px] bg-transparent cursor-pointer text-ink-3 flex items-center justify-center gap-2 text-[13px] font-medium min-h-[110px]"
              style={{ border: '1.5px dashed var(--line-2)' }}
            >
              <Icon name="plus" size={14} />
              Add seat to {dept.name}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────
   #13  TimeslotsView
───────────────────────────────────────────────── */

export function TimeslotsView() {
  const columns: DataGridColumn[] = [
    { key: 'swatch',   label: '',         width: '44px' },
    { key: 'name',     label: 'Name',     width: '2fr' },
    { key: 'duration', label: 'Duration', width: '1fr' },
    { key: 'usedBy',   label: 'Used by',  width: '1.4fr' },
    { key: 'default',  label: 'Default',  width: '1fr' },
    { key: 'actions',  label: '',         width: '100px' },
  ];

  const rows: DataGridRow[] = TIMESLOT_ROWS.map(r => ({
    key: r.id,
    swatch: (
      <span
        className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-white flex-none"
        style={{ background: r.color }}
      >
        <Icon name="clock" size={11} />
      </span>
    ),
    name:     <span className="text-[13.5px] font-medium">{r.name}</span>,
    duration: <span className="mono tnum text-[13px]">{r.duration} min</span>,
    usedBy: (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex">
          {Array.from({ length: Math.min(r.usedBy, 4) }).map((_, i) => (
            <span
              key={i}
              className={cn('inline-flex rounded-full', i > 0 && '-ml-[6px]')}
              style={{ boxShadow: '0 0 0 2px var(--surface)' }}
            >
              <Avatar
                name={(['A', 'B', 'C', 'D'][i] ?? 'X') + ' Person'}
                size={20}
              />
            </span>
          ))}
        </span>
        <span className="text-[12px] text-ink-3">
          {r.usedBy} org user{r.usedBy !== 1 ? 's' : ''}
        </span>
      </span>
    ),
    default: r.isDefault
      ? <Pill tone="teal">Org default</Pill>
      : <span className="text-ink-4 text-[12px]">—</span>,
    actions: (
      <div className="flex gap-1">
        <button className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2">
          <Icon name="pencil" size={14} />
        </button>
        <button className="border-0 bg-transparent cursor-pointer text-ink-3 p-[6px] rounded-[6px] hover:bg-surface-2">
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
        right={<Button variant="primary" icon="plus">Add timeslot type</Button>}
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        <Card style={{ padding: 0 }}>
          <DataGrid columns={columns} rows={rows} />
        </Card>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────
   #14  ClientLinksView
───────────────────────────────────────────────── */

type LinkScope = 'Whole org' | 'Department' | 'Specific seat';

interface ClientLinksViewProps {
  onOpenClientPortal?: () => void;
}

export function ClientLinksView({ onOpenClientPortal }: ClientLinksViewProps = {}) {
  const [showModal, setShowModal] = useState(false);
  const [scope, setScope] = useState<LinkScope>('Whole org');
  const scopeOptions: LinkScope[] = ['Whole org', 'Department', 'Specific seat'];

  return (
    <>
      <TopBar
        title="Client portal links"
        subtitle="QR codes and shareable URLs for joining your queue."
        right={
          <Button variant="primary" icon="plus" onClick={() => setShowModal(true)}>
            Generate new link
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {LINKS.map(l => (
            <Card key={l.id} hover style={{ padding: 14 }}>
              <div className="flex items-center gap-3">
                <QRPlaceholder size={72} seed={l.url} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium">{l.name}</div>
                  <div
                    className="mono text-[11px] text-ink-3 mt-[2px] leading-[1.4] break-all"
                  >
                    {l.url}
                  </div>
                  <Pill tone="neutral" className="mt-2">{l.scope}</Pill>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-line flex items-center gap-[6px]">
                <span className="tnum text-[13px] font-medium">{l.scans.toLocaleString()}</span>
                <span className="text-[11.5px] text-ink-3">scans</span>
                <span className="text-[11.5px] text-ink-4 ml-1">· {l.created}</span>
                <span className="flex-1" />
                <Button variant="ghost" size="sm" icon="copy">Copy</Button>
                <Button variant="ghost" size="sm" icon="download">QR</Button>
                <Button variant="secondary" size="sm" iconRight="arrowR" onClick={onOpenClientPortal}>
                  Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Generate a new link"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" icon="link" onClick={() => setShowModal(false)}>
              Generate link
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[14px]">
          <Field label="Link name" hint="Where will you post this?">
            <TextInput defaultValue="Side entrance QR" />
          </Field>
          <Field label="Scope">
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {scopeOptions.map(o => (
                <button
                  key={o}
                  onClick={() => setScope(o)}
                  className={cn(
                    'px-3 py-[10px] rounded-[8px] cursor-pointer text-left text-[12.5px] font-medium',
                    'border transition-[background,border-color,color] duration-100',
                    scope === o
                      ? 'bg-teal-tint border-teal text-teal-ink'
                      : 'bg-surface border-line-2 text-ink hover:bg-surface-2',
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </Field>
          {scope === 'Department' && (
            <Field label="Department">
              <SelectInput
                defaultValue="General Practice"
                options={['General Practice', 'Dental', 'Pediatrics']}
              />
            </Field>
          )}
          {scope === 'Specific seat' && (
            <Field label="Seat">
              <SelectInput
                defaultValue="Triage desk"
                options={['Triage desk', 'Consultation room 1', 'Dental chair A']}
              />
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}

/* ─────────────────────────────────────────────────
   #15  AnalyticsView + chart primitives
───────────────────────────────────────────────── */

function LineChart({ data, height = 160 }: { data: number[]; height?: number }) {
  const W = 800;
  const H = height;
  const pad = { l: 30, r: 12, t: 8, b: 24 };
  const maxVal = Math.max(...data) * 1.15;
  const minVal = 0;

  const sx = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const sy = (v: number) => pad.t + (1 - (v - minVal) / (maxVal - minVal)) * (H - pad.t - pad.b);

  // 7-day rolling average
  const avg = data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - 6), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
  const avgPath  = avg.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
  const area     = `${linePath} L${sx(data.length - 1)},${H - pad.b} L${sx(0)},${H - pad.b} Z`;
  const yTicks   = [0, 0.5, 1].map(p => p * maxVal);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="qfLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--teal)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines + y-labels */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)}
            stroke="var(--line)" strokeDasharray="2,3"
          />
          <text
            x={pad.l - 6} y={sy(v) + 3}
            fontSize="10" fill="var(--ink-4)"
            textAnchor="end" fontFamily="var(--font-mono)"
          >
            {Math.round(v)}
          </text>
        </g>
      ))}
      {/* Area fill */}
      <path d={area} fill="url(#qfLineFill)" />
      {/* Main line */}
      <path d={linePath} stroke="var(--teal)" strokeWidth="1.75" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* 7-day avg dashed */}
      <path d={avgPath} stroke="var(--ink-3)" strokeWidth="1.25" fill="none" strokeDasharray="4,3" />
      {/* X-axis labels */}
      {([0, 7, 14, 21, 29] as number[]).map(i => (
        <text
          key={i}
          x={sx(i)} y={H - 8}
          fontSize="10" fill="var(--ink-4)"
          textAnchor="middle" fontFamily="var(--font-mono)"
        >
          {`-${29 - i}d`}
        </text>
      ))}
    </svg>
  );
}

type BarTone = 'teal' | 'coral' | 'amber';

function Bar({ value, max, tone = 'teal' }: { value: number; max: number; tone?: BarTone }) {
  const colorMap: Record<BarTone, string> = {
    teal:  'var(--teal)',
    coral: 'var(--coral)',
    amber: 'var(--amber)',
  };
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: colorMap[tone] }}
      />
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex gap-3">
      {items.map(it => (
        <span key={it.label} className="inline-flex items-center gap-[5px] text-[11.5px] text-ink-3">
          <span
            style={{
              width: 12,
              height: 0,
              borderTop: `2px ${it.dashed ? 'dashed' : 'solid'} ${it.color}`,
              display: 'inline-block',
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function AnalyticsView() {
  const seatUtilColumns: DataGridColumn[] = [
    { key: 'name', label: 'Seat', width: '1.4fr' },
    { key: 'bar',  label: '',     width: '1.6fr' },
    { key: 'val',  label: '',     width: '70px' },
  ];

  const seatUtilRows: DataGridRow[] = SEAT_UTIL.map(s => ({
    key:  s.name,
    name: <span className="text-[12.5px]">{s.name}</span>,
    bar:  <Bar value={s.util} max={100} tone={s.util < 30 ? 'coral' : s.util > 85 ? 'amber' : 'teal'} />,
    val:  <span className="tnum text-[12.5px] font-medium text-right block">{s.util}%</span>,
  }));

  return (
    <>
      <TopBar
        title="Analytics"
        subtitle="The last 30 days"
        right={
          <div className="flex gap-2">
            <SelectInput
              defaultValue="Last 30 days"
              options={['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'This year']}
            />
            <Button variant="secondary" icon="download">Export</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Kpi label="Bookings"        value="2,831" sub="+18% vs prev"         hint="30d" />
          <Kpi label="Avg wait"        value="24"    sub="min"                   hint="30d" />
          <Kpi label="Seat utilization" value="62"   sub="%"                     hint="avg across seats" />
          <Kpi label="No-show rate"    value="6.2"   sub="%"  hint="↓ 1.1pp"    tone="teal" />
        </div>

        {/* Bookings per day chart */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div className="flex items-baseline gap-[10px] mb-[14px]">
            <h3 className="m-0 text-[14px] font-semibold tracking-[-0.005em]">Bookings per day</h3>
            <span className="text-[12px] text-ink-3">Last 30 days</span>
            <span className="flex-1" />
            <Legend
              items={[
                { label: 'Bookings', color: 'var(--teal)' },
                { label: '7-day avg', color: 'var(--ink-3)', dashed: true },
              ]}
            />
          </div>
          <LineChart data={BOOKINGS_30D} height={180} />
        </Card>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1.1fr 1.4fr' }}>
          {/* Avg wait by department */}
          <Card style={{ padding: 18 }}>
            <h3 className="m-0 mb-[14px] text-[14px] font-semibold">Avg wait by department</h3>
            <div className="flex flex-col gap-3">
              {WAIT_BY_DEPT.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12.5px] text-ink-2">{d.name}</span>
                    <span className="mono tnum text-[12.5px] font-medium">{d.min} min</span>
                  </div>
                  <Bar value={d.min} max={40} />
                </div>
              ))}
            </div>
          </Card>

          {/* Seat utilization table */}
          <Card style={{ padding: 0 }}>
            <div className="px-[18px] py-[14px] border-b border-line flex items-center gap-[10px]">
              <h3 className="m-0 text-[14px] font-semibold">Seat utilization</h3>
              <span className="text-[12px] text-ink-3">% of available hours with an active session</span>
            </div>
            <DataGrid columns={seatUtilColumns} rows={seatUtilRows} />
          </Card>
        </div>
      </div>
    </>
  );
}
