import type { ReactNode } from 'react';
import { useMyProfile } from '../../hooks/use-my-profile';
import { PlanLocked } from '../plans/plan-locked';
import { FinanceNav } from './components/finance-nav';

/** Finance section frame: tabs on top, pages stack below with a fixed gap. */
export function FinanceShell({ children }: { children: ReactNode }) {
  const { profile } = useMyProfile();
  const locked =
    profile !== null && !profile.subscription.features.fullFinanceManagement;

  return (
    <div className="page">
      <FinanceNav />
      {locked ? <PlanLocked feature="A gestão financeira" /> : children}
    </div>
  );
}
