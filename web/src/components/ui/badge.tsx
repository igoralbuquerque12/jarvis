import type { ReactNode } from 'react';

type BadgeVariant = 'accent' | 'success' | 'neutral' | 'danger';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}
