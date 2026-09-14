import type { ReactNode } from 'react';
import { FinanceNav } from './components/finance-nav';

/** Finance section frame: tabs on top, pages stack below with a fixed gap. */
export function FinanceShell({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <FinanceNav />
      {children}
    </div>
  );
}
