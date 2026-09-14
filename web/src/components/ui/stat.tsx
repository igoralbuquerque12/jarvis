import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface StatProps {
  label: string;
  icon?: ReactNode;
  value: ReactNode;
  foot?: ReactNode;
  tone?: 'success' | 'danger' | 'accent';
  /** Render the value as body text (e.g. an event title) instead of a figure. */
  text?: boolean;
  to?: string;
}

/** KPI tile. Use inside a `.stats` grid. */
export function Stat({ label, icon, value, foot, tone, text, to }: StatProps) {
  const className = ['stat', tone ? `stat--${tone}` : null, to ? 'stat--link' : null]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className="stat__label">
        {icon}
        {label}
      </span>
      <span className={text ? 'stat__value stat__value--text' : 'stat__value'}>
        {value}
      </span>
      {foot ? <span className="stat__foot">{foot}</span> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
