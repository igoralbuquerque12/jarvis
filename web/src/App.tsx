import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';
import { RequireAuth } from './components/layout/require-auth';
import { LoginPage } from './features/auth/login-page';
import { ResetPasswordPage } from './features/auth/reset-password-page';
import { DashboardPage } from './features/dashboard/dashboard-page';
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
      <Route path="/home" element={<Navigate replace to="/dashboard" />} />
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}
