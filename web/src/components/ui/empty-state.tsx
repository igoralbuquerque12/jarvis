import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      {icon ? <div className="empty__icon">{icon}</div> : null}
      <strong className="empty__title">{title}</strong>
      {children ? <p className="empty__body">{children}</p> : null}
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
