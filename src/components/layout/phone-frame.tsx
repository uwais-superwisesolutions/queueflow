import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className="min-h-screen bg-surface-2 flex items-center justify-center p-8">
      <div
        className={cn(
          'relative bg-surface rounded-[40px] overflow-hidden flex flex-col',
          'shadow-[0_32px_64px_rgba(20,18,12,.18),0_0_0_1px_rgba(20,18,12,.08)]',
          className,
        )}
        style={{ width: 392, height: 800 }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 flex-none">
          <span className="text-[12px] font-semibold text-ink">9:41</span>
          <div className="w-[80px] h-[26px] bg-ink rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex items-center gap-1.5">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="3" width="3" height="9" rx="1" fill="currentColor" opacity="0.3" />
              <rect x="4.5" y="2" width="3" height="10" rx="1" fill="currentColor" opacity="0.5" />
              <rect x="9" y="0" width="3" height="12" rx="1" fill="currentColor" opacity="0.7" />
              <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="currentColor" />
            </svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
              <path d="M7.5 2.5C9.8 2.5 11.8 3.5 13.2 5.1L14.5 3.8C12.7 1.9 10.2.8 7.5.8S2.3 1.9.5 3.8L1.8 5.1C3.2 3.5 5.2 2.5 7.5 2.5z" fill="currentColor" />
              <path d="M7.5 5.5c1.5 0 2.8.6 3.8 1.6L12.7 5.7C11.3 4.3 9.5 3.5 7.5 3.5S3.7 4.3 2.3 5.7L3.7 7.1C4.7 6.1 6 5.5 7.5 5.5z" fill="currentColor" opacity="0.7" />
              <circle cx="7.5" cy="10" r="1.5" fill="currentColor" />
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-2.5 border border-ink rounded-[3px] relative">
                <div className="absolute inset-[1px] right-[3px] bg-ink rounded-sm" />
                <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[2px] h-1 bg-ink rounded-r-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-auto qf-scroll">{children}</div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2 pt-1 flex-none">
          <div className="w-[120px] h-[5px] bg-ink/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
