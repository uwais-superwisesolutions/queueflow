import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';
import { QFLogo } from './qf-logo';
import type { SidebarNavItem } from '@/types';

// The org identity pill below the logo used to render a chevron + "2 locations"
// subtitle, hinting at a dropdown / multi-tenant switcher. Neither exists in
// Phase 1 (one org per user, no location concept on the backend), so it's
// rendered as a static label.

interface SidebarProps {
  items: SidebarNavItem[];
  active?: string;
  onSelect?: (id: string) => void;
  footer?: ReactNode;
  mobileFooter?: ReactNode;
  orgName?: string;
}

export function Sidebar({
  items,
  active,
  onSelect,
  footer,
  mobileFooter,
  orgName = 'Bryanston Family Practice',
}: SidebarProps) {
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const mobileItems = items.filter((it) => !it.heading && it.id);

  return (
    <>
      <div className="md:hidden bg-surface border-b border-line flex-none">
        <div className="px-4 py-3 flex items-center gap-3">
          <QFLogo size={18} />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-medium text-ink truncate">{orgName}</div>
          </div>
          {(mobileFooter ?? footer) && (
            <div className="w-[178px] max-w-[45vw] flex-none">{mobileFooter ?? footer}</div>
          )}
        </div>
        <nav
          className="px-3 pb-3 flex gap-2 overflow-x-auto qf-scroll"
          aria-label="Primary navigation"
        >
          {mobileItems.map((it) => {
            const sel = active === it.id;
            return (
              <button
                key={it.id}
                onClick={() => onSelect?.(it.id!)}
                className={cn(
                  'flex-none inline-flex items-center gap-2 px-3 py-2 rounded-[8px] border',
                  'text-[12.5px] font-medium whitespace-nowrap transition-colors',
                  sel
                    ? 'bg-teal-tint text-teal-ink border-teal'
                    : 'bg-surface text-ink-2 border-line hover:bg-surface-2',
                )}
              >
                {it.icon && <Icon name={it.icon} size={14} />}
                <span>{it.label}</span>
                {it.count != null && (
                  <span className="tnum text-[10.5px] text-ink-3 bg-surface border border-line rounded-[4px] px-[5px] py-px">
                    {it.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <aside
        // No explicit height — the parent layout uses min-h-screen, so default
        // flex `align-items: stretch` makes the aside match the row's height.
        // Using `h-full` here previously resolved against an `auto` parent and
        // collapsed the sidebar to its content height.
        className="hidden md:flex w-[232px] flex-none bg-surface border-r border-line flex-col self-stretch"
      >
        <div className="p-4 pb-3">
          <QFLogo size={18} />
          <div className="mt-[10px] px-[10px] py-2 bg-surface-2 rounded-lg flex items-center gap-2 border border-line">
            <div
              className="w-[22px] h-[22px] rounded-[6px] bg-teal text-white flex items-center justify-center text-[11px] font-semibold flex-none"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-ink truncate">{orgName}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-1 flex flex-col gap-px overflow-auto qf-scroll">
          {items.map((it, idx) => {
            if (it.heading) {
              return (
                <div
                  key={`heading-${idx}`}
                  className="text-[10.5px] text-ink-4 uppercase tracking-[0.06em] font-semibold px-[10px] pt-3 pb-1"
                >
                  {it.heading}
                </div>
              );
            }

            if (!it.id) return null;
            const sel = active === it.id;

            return (
              <button
                key={it.id}
                onClick={() => onSelect?.(it.id!)}
                className={cn(
                  'relative flex items-center gap-[10px] px-[10px] py-[7px] border-0',
                  'text-[13px] rounded-[6px] cursor-pointer text-left',
                  'transition-colors duration-100',
                  sel
                    ? 'bg-surface-2 text-ink font-medium'
                    : 'bg-transparent text-ink-2 font-normal hover:bg-surface-2',
                )}
              >
                {sel && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-teal rounded-[2px]" />
                )}
                {it.icon && (
                  <Icon
                    name={it.icon}
                    size={15}
                    className={sel ? 'text-teal' : 'text-ink-3'}
                  />
                )}
                <span className="flex-1">{it.label}</span>
                {it.count != null && (
                  <span className="tnum text-[10.5px] text-ink-3 bg-surface-2 border border-line rounded-[4px] px-[5px] py-px min-w-[18px] text-center">
                    {it.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {footer && (
          <div className="px-3 pb-[14px] pt-2 border-t border-line">{footer}</div>
        )}
      </aside>
    </>
  );
}
