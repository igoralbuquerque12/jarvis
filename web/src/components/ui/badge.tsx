import type { ReactNode } from 'react';

/** `plain` drops the status dot: for taxonomy labels, not states. */
type BadgeVariant = 'accent' | 'success' | 'neutral' | 'danger' | 'plain';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

/** Numbers like `3` or `2/5` render as a compact count instead of a status label. */
function isCount(children: ReactNode): boolean {
  if (typeof children === 'number') return true;
  if (typeof children === 'string') return /^\d+(\/\d+)?$/.test(children);
  if (Array.isArray(children)) {
    return (
      children.length > 0 &&
      children.every((part) => typeof part === 'number' || part === '/')
    );
  }
  return false;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const classes = ['badge', `badge--${variant}`, isCount(children) ? 'badge--count' : null]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
