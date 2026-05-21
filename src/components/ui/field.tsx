import { type LabelHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './icon';
import type { IconName } from '@/types';

interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, children, className, ...rest }: FieldProps) {
  return (
    // min-w-0 is critical when this <label> is itself a grid item (e.g. the
    // 1fr/1fr name row on the sign-up form). Without it, the grid track
    // expands to the input's intrinsic min-content width and the cell
    // overflows its half of the row.
    <label className={cn('flex flex-col gap-1.5 min-w-0', className)} {...rest}>
      {label && (
        <span className="text-[12.5px] text-ink-2 font-medium">{label}</span>
      )}
      {children}
      {error ? (
        <span className="text-xs text-coral-2">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
  error?: boolean;
  wrapClassName?: string;
}

export function TextInput({ icon, error, wrapClassName, className, ...rest }: TextInputProps) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 bg-surface border rounded-[8px] px-[10px] h-[38px]',
        // min-w-0 lets this shrink below the <input>'s default intrinsic
        // width when placed in a narrow grid cell (e.g. the 1fr/1fr name row
        // on the sign-up form). Without it the input overflows the cell.
        'min-w-0',
        'text-ink-3 transition-[border-color,box-shadow] duration-150',
        'focus-within:border-teal focus-within:shadow-[0_0_0_2px_var(--teal-tint)]',
        error ? 'border-coral' : 'border-line-2',
        wrapClassName,
      )}
    >
      {icon && <Icon name={icon} size={14} />}
      <input
        {...rest}
        className={cn(
          'flex-1 min-w-0 h-full border-0 bg-transparent font-[inherit] text-ink outline-none p-0',
          'placeholder:text-ink-4',
          className,
        )}
      />
    </span>
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: (string | { value: string; label: string; disabled?: boolean })[];
  wrapClassName?: string;
}

export function SelectInput({ options, wrapClassName, className, ...rest }: SelectInputProps) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center min-w-0 max-w-full bg-surface border border-line-2 rounded-[8px]',
        'pl-[10px] pr-[28px] h-[38px] text-ink',
        wrapClassName,
      )}
    >
      <select
        {...rest}
        className={cn(
          'w-full h-full min-w-0 border-0 bg-transparent font-[inherit] text-ink outline-none appearance-none',
          className,
        )}
      >
        {options.map(o =>
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        )}
      </select>
      <Icon
        name="chevronD"
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
      />
    </span>
  );
}
