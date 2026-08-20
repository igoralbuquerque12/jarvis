import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';
import { RequireAuth } from './components/layout/require-auth';
import { LoginPage } from './features/auth/login-page';
import { ResetPasswordPage } from './features/auth/reset-password-page';
import { DashboardPage } from './features/dashboard/dashboard-page';
import { FinanceShell } from './features/finance/finance-shell';
import { FinanceGoalsPage } from './features/finance/pages/finance-goals-page';
import { FinanceInvestmentsPage } from './features/finance/pages/finance-investments-page';
import { FinanceOverviewPage } from './features/finance/pages/finance-overview-page';
import { FinanceRecurringPage } from './features/finance/pages/finance-recurring-page';
import { FinanceSettingsPage } from './features/finance/pages/finance-settings-page';
import { FinanceTransactionsPage } from './features/finance/pages/finance-transactions-page';
import { PlansPage } from './features/plans/plans-page';
import { ProfilePage } from './features/profile/profile-page';

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedPage>
            <DashboardPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/planos"
        element={
          <ProtectedPage>
            <PlansPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedPage>
            <ProfilePage />
          </ProtectedPage>
        }
      />
      {/* Finance routes */}
      <Route
        path="/financas"
        element={
          <ProtectedPage>
            <FinanceShell>
              <FinanceOverviewPage />
            </FinanceShell>
          </ProtectedPage>
        }
      />
      <Route
        path="/financas/transacoes"
        element={
          <ProtectedPage>
            <FinanceShell>
              <FinanceTransactionsPage />
            </FinanceShell>
          </ProtectedPage>
        }
      />
      <Route
        path="/financas/recorrencias"
        element={
          <ProtectedPage>
            <FinanceShell>
              <FinanceRecurringPage />
            </FinanceShell>
          </ProtectedPage>
        }
      />
      <Route
        path="/financas/metas"
        element={
          <ProtectedPage>
            <FinanceShell>
              <FinanceGoalsPage />
            </FinanceShell>
          </ProtectedPage>
        }
      />
      <Route
        path="/financas/investimentos"
        element={
          <ProtectedPage>
            <FinanceShell>
              <FinanceInvestmentsPage />
            </FinanceShell>
          </ProtectedPage>
        }
      />
      <Route
        path="/financas/configuracoes"
        element={
          <ProtectedPage>
            <FinanceShell>
              <FinanceSettingsPage />
            </FinanceShell>
          </ProtectedPage>
        }
      />
      <Route path="/home" element={<Navigate replace to="/dashboard" />} />
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}

