import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Remove padding so lists/tables can bleed to the edges. */
  flush?: boolean;
}

export function Card({ className, flush = false, ...props }: CardProps) {
  return (
    <section
      className={['card', flush ? 'card--flush' : null, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
}

export function CardHeader({ title, subtitle, aside }: CardHeaderProps) {
  return (
    <header className="card__header">
      <div>
        <h3 className="card__title">{title}</h3>
        {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
      </div>
      {aside ? <div className="card__aside">{aside}</div> : null}
    </header>
  );
}
