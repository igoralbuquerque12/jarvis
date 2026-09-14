import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  tone?: 'danger' | 'success';
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  block?: boolean;
  className?: string;
}

/** Exclusive choice between a few options (filters, type toggles). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  block = false,
  className,
}: SegmentedProps<T>) {
  const hasTone = options.some((option) => option.tone);
  const classes = [
    'segmented',
    block ? 'segmented--block' : null,
    hasTone ? 'segmented--tone' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          className="segmented__btn"
          aria-selected={value === option.value}
          data-tone={option.tone}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
