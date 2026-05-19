import type { ReactNode } from 'react';
import { Icon, Pill, SkeletonBox, SkeletonLine } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { IconName, Tone } from '@/types';

// ─────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────
export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (id: string) => void;
  items: TabItem[];
}) {
  return (
    <div className="flex gap-[2px] bg-surface-2 p-[3px] rounded-[8px] border border-line">
      {items.map((it) => {
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

// ─────────────────────────────────────────────────
// DataGrid
// ─────────────────────────────────────────────────
export interface DataGridColumn {
  key: string;
  label: string;
  width: string;
}

export interface DataGridRow {
  key: string | number;
  [col: string]: ReactNode | string | number;
}

export function DataGrid({ columns, rows }: { columns: DataGridColumn[]; rows: DataGridRow[] }) {
  const gridTemplate = columns.map((c) => c.width).join(' ');
  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
        className="px-4 py-[10px] border-b border-line bg-surface-2 text-[11px] text-ink-3 font-semibold uppercase tracking-[0.05em]"
      >
        {columns.map((c) => (
          <div key={c.key}>{c.label}</div>
        ))}
      </div>
      <div>
        {rows.map((r, i) => (
          <div
            key={r.key}
            style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
            className={cn(
              'px-4 py-3 items-center transition-[background] duration-100 hover:bg-surface-2',
              i < rows.length - 1 ? 'border-b border-line' : '',
            )}
          >
            {columns.map((c) => (
              <div key={c.key} className="min-w-0">
                {r[c.key] as ReactNode}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────
export function EmptyState({
  icon = 'users',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12 px-6 text-center text-ink-3">
      <span className="w-12 h-12 rounded-[12px] bg-surface-2 text-ink-3 inline-flex items-center justify-center mb-[14px]">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="m-0 mb-[6px] text-[15px] font-medium text-ink">{title}</h3>
      <p className="m-0 text-[13px] text-ink-3 max-w-[320px] mx-auto">{body}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────
export type MemberStatus = 'active' | 'owner' | 'invited' | 'suspended' | 'accepted';

const STATUS_MAP: Record<MemberStatus, { tone: Tone; dot?: boolean; label: string }> = {
  active:    { tone: 'success', dot: true,  label: 'Active' },
  owner:     { tone: 'teal',    dot: true,  label: 'Owner' },
  accepted:  { tone: 'success', dot: false, label: 'Accepted' },
  invited:   { tone: 'amber',   dot: false, label: 'Invited' },
  suspended: { tone: 'coral',   dot: false, label: 'Suspended' },
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const m = STATUS_MAP[status] ?? { tone: 'neutral' as Tone, label: status };
  return (
    <Pill tone={m.tone} dot={m.dot}>
      {m.label}
    </Pill>
  );
}

// ─────────────────────────────────────────────────
// SectionError — inline alert at the top of a section
// ─────────────────────────────────────────────────
export function SectionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-[10px] px-3.5 py-[10px] rounded-[10px] border mb-4"
      style={{
        background: 'var(--coral-tint)',
        borderColor: 'color-mix(in oklab, var(--coral) 30%, transparent)',
      }}
      role="alert"
    >
      <Icon name="alert" size={14} className="text-coral" />
      <span className="text-[12.5px] text-ink">{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Skeletons — shape-matched placeholders for loading states.
// ─────────────────────────────────────────────────

/** Skeleton mirroring a <DataGrid> row layout. Pass an explicit grid template. */
export function TableSkeleton({
  rows = 6,
  gridTemplate,
}: {
  rows?: number;
  /** Same string you'd pass to DataGrid's grid-template-columns. */
  gridTemplate: string;
}) {
  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
        className="px-4 py-[10px] border-b border-line bg-surface-2"
      >
        {gridTemplate.split(' ').map((_, i) => (
          <SkeletonLine key={i} w={56} h={9} />
        ))}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
            className={cn(
              'px-4 py-3 items-center',
              i < rows - 1 ? 'border-b border-line' : '',
            )}
          >
            {gridTemplate.split(' ').map((_, j) => (
              <div key={j} className="min-w-0">
                {j === 0 ? (
                  <span className="flex items-center gap-[10px]">
                    <SkeletonBox w={28} h={28} circle />
                    <span>
                      <SkeletonLine w={120} h={12} />
                      <SkeletonLine w={170} h={10} className="mt-1.5" />
                    </span>
                  </span>
                ) : (
                  <SkeletonLine w={`${50 + ((i + j) % 4) * 12}%`} h={12} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for icon + 2-line list rows (e.g. exceptions, public holidays). */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
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
          <SkeletonBox w={32} h={32} />
          <div className="flex-1 min-w-0">
            <SkeletonLine w={`${40 + (i % 3) * 12}%`} h={12} />
            <SkeletonLine w={`${30 + (i % 2) * 14}%`} h={10} className="mt-1.5" />
          </div>
          <SkeletonBox w={28} h={28} />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for form sections — N label-and-input pairs. */
export function FormSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <SkeletonLine w={88} h={10} />
          <SkeletonBox w="100%" h={38} className="mt-2" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for the recurring-schedule day rows. */
export function ScheduleSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'grid items-start gap-3 px-3 py-3',
            i < rows - 1 && 'border-b border-line',
          )}
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
  );
}

/** Skeleton for the seats card grid (department's seats). */
export function SeatGridSkeleton({ tiles = 4 }: { tiles?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
    >
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="bg-surface border border-line rounded-[12px] p-[14px]">
          <div className="flex items-center gap-[10px]">
            <SkeletonBox w={32} h={32} />
            <div className="flex-1 min-w-0">
              <SkeletonLine w={`${55 + (i % 3) * 10}%`} h={13} />
              <SkeletonLine w={`${40 + (i % 2) * 18}%`} h={10} className="mt-1.5" />
            </div>
          </div>
          <div className="border-t border-line mt-3 pt-3">
            <SkeletonLine w={84} h={18} />
          </div>
        </div>
      ))}
    </div>
  );
}
