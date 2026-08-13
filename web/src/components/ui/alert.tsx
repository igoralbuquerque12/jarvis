import type { ReactNode } from 'react';

interface AlertProps {
  variant: 'error' | 'success';
  children: ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  return (
    <div role="alert" className={`alert alert--${variant}`}>
      {children}
    </div>
  );
}
