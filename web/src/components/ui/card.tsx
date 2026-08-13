import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={['card', className].filter(Boolean).join(' ')}
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
      {aside}
    </header>
  );
}
