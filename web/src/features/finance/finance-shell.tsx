import type { ReactNode } from 'react';
import { FinanceNav } from './components/finance-nav';
import { PrivacyProvider } from './context/privacy-context';

export function FinanceShell({ children }: { children: ReactNode }) {
  return (
    <PrivacyProvider>
      <FinanceNav />
      {children}
    </PrivacyProvider>
  );
}
