import { useEffect, useRef, useState } from 'react';
import { Avatar, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { IconName, MemberRole } from '@/types';

interface ProfileMenuItem {
  id: string;
  label: string;
  icon: IconName;
  tone?: 'default' | 'danger';
  onSelect: () => void;
}

interface ProfileMenuProps {
  fullName: string;
  role: MemberRole | null;
  email?: string | null;
  /** Action items shown in the dropdown. */
  items: ProfileMenuItem[];
  /**
   * Direction the dropdown opens. Default `'up'` suits sidebar-footer usage;
   * pass `'down'` when the trigger sits at the top of the page so the menu
   * doesn't clip above the viewport.
   */
  direction?: 'up' | 'down';
}

function roleLine(role: MemberRole | null): string {
  if (role === 'super_user') return 'Owner · Super user';
  if (role === 'org_user') return 'Org user';
  return 'Guest';
}

export function ProfileMenu({ fullName, role, email, items, direction = 'up' }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const display = fullName?.trim() ? fullName : (email ?? 'Account');

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 w-full border-0 bg-transparent px-1 py-1.5 cursor-pointer rounded-[6px] text-ink-2 text-left hover:bg-surface-2"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={display} size={26} active />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-ink truncate">{display}</div>
          <div className="text-[11px] text-ink-3 truncate">{roleLine(role)}</div>
        </div>
        <Icon name="dotsH" size={14} className="text-ink-3 flex-none" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute left-0 right-0',
            direction === 'up'
              ? 'bottom-[calc(100%+6px)]'
              : 'top-[calc(100%+6px)]',
            'bg-surface border border-line rounded-[10px] shadow-lg overflow-hidden z-50',
          )}
        >
          <div className="px-3 py-2.5 border-b border-line">
            <div className="text-[12.5px] font-medium text-ink truncate">{display}</div>
            {email && (
              <div className="text-[11px] text-ink-3 truncate">{email}</div>
            )}
          </div>
          <ul className="p-1 m-0 list-none">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                  className={cn(
                    'w-full text-left flex items-center gap-2 px-2.5 py-2 border-0 cursor-pointer rounded-[6px]',
                    'text-[12.5px] bg-transparent hover:bg-surface-2',
                    it.tone === 'danger' ? 'text-coral' : 'text-ink',
                  )}
                >
                  <Icon name={it.icon} size={13} className={it.tone === 'danger' ? 'text-coral' : 'text-ink-3'} />
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
