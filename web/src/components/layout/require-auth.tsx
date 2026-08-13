import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { Spinner } from '../ui/spinner';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Spinner page />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  return children;
}
