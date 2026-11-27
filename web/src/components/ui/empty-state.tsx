import type { ReactNode } from 'react';
import { JarvisPersona } from './jarvis-persona';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

/** Nothing here yet: Jarvis's face, a title, an optional line and action. */
export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <JarvisPersona variant="face" />
      <strong className="empty__title">{title}</strong>
      {children ? <p className="empty__body">{children}</p> : null}
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
