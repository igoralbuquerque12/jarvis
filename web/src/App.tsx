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
import { FinanceSettingsPage } from './features/finance/pages/finance-settings-page';
import { FinanceTransactionsPage } from './features/finance/pages/finance-transactions-page';
import { PlansPage } from './features/plans/plans-page';
import { ProfilePage } from './features/profile/profile-page';
import { ApiDocsPage } from './features/settings/pages/api-docs-page';
import { ApiKeysPage } from './features/settings/pages/api-keys-page';
import { SettingsShell } from './features/settings/settings-shell';

function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

function FinancePage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage>
      <FinanceShell>{children}</FinanceShell>
    </ProtectedPage>
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
      {/* Settings routes */}
      <Route
        path="/configuracoes"
        element={<Navigate replace to="/configuracoes/api" />}
      />
      <Route
        path="/configuracoes/api"
        element={
          <ProtectedPage>
            <SettingsShell>
              <ApiKeysPage />
            </SettingsShell>
          </ProtectedPage>
        }
      />
      <Route
        path="/configuracoes/documentacao"
        element={
          <ProtectedPage>
            <SettingsShell>
              <ApiDocsPage />
            </SettingsShell>
          </ProtectedPage>
        }
      />
      {/* Finance routes */}
      <Route
        path="/financas"
        element={
          <FinancePage>
            <FinanceOverviewPage />
          </FinancePage>
        }
      />
      <Route
        path="/financas/transacoes"
        element={
          <FinancePage>
            <FinanceTransactionsPage view="ledger" />
          </FinancePage>
        }
      />
      <Route
        path="/financas/recorrencias"
        element={
          <FinancePage>
            <FinanceTransactionsPage view="recurring" />
          </FinancePage>
        }
      />
      <Route
        path="/financas/metas"
        element={
          <FinancePage>
            <FinanceGoalsPage />
          </FinancePage>
        }
      />
      <Route
        path="/financas/investimentos"
        element={
          <FinancePage>
            <FinanceInvestmentsPage />
          </FinancePage>
        }
      />
      <Route
        path="/financas/configuracoes"
        element={
          <FinancePage>
            <FinanceSettingsPage />
          </FinancePage>
        }
      />
      <Route path="/home" element={<Navigate replace to="/dashboard" />} />
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}
