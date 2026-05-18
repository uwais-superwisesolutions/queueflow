import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: number | string;
}

export function Card({ hover, padding = 16, className, style, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'bg-surface border border-line rounded-[12px] shadow-sm',
        'transition-[border-color,box-shadow] duration-150',
        hover && 'hover:border-line-2 hover:shadow-md cursor-pointer',
        className,
      )}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}

export function Divider({ vertical, className }: { vertical?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'bg-line flex-none',
        vertical ? 'w-px self-stretch' : 'h-px w-full',
        className,
      )}
    />
  );
}
