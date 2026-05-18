import { type ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';

interface TopBarProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  breadcrumb?: string[];
}

export function TopBar({ title, subtitle, right, breadcrumb }: TopBarProps) {
  return (
    <header className="flex items-center px-6 py-[14px] border-b border-line bg-surface gap-4 flex-none">
      <div className="flex-1 min-w-0">
        {breadcrumb && (
          <div className="flex items-center gap-1 text-[11.5px] text-ink-3 mb-0.5">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <Icon name="chevronR" size={10} />}
                <span className={i === breadcrumb.length - 1 ? 'text-ink-2' : 'text-ink-3'}>
                  {b}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="m-0 text-[18px] font-semibold text-ink tracking-[-0.02em]">{title}</h1>
        {subtitle && (
          <div className="text-[12.5px] text-ink-3 mt-0.5">{subtitle}</div>
        )}
      </div>
      {right}
    </header>
  );
}
