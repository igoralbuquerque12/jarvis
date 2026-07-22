import type { FormEvent } from 'react';
import type { LoginMode } from './services/login.service';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified?: boolean;
}

export interface LoginSessionState {
  data: { user: SessionUser } | null;
  isPending: boolean;
  isRefetching: boolean;
  error: unknown;
  refetch: (queryParams?: { query?: Record<string, string> }) => Promise<void>;
}

export interface LoginPageViewModel {
  session: LoginSessionState;
  mode: LoginMode;
  name: string;
  email: string;
  password: string;
  resetEmail: string;
  statusMessage: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  isResetting: boolean;
  isSigningOut: boolean;
  canSubmit: boolean;
  setMode: (mode: LoginMode) => void;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setResetEmail: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleGoogleSignIn: () => Promise<void>;
  handlePasswordResetRequest: (
    event: FormEvent<HTMLFormElement>,
  ) => Promise<void>;
  handleSignOut: () => Promise<void>;
}

export interface ResetPasswordPageViewModel {
  token: string;
  newPassword: string;
  confirmPassword: string;
  statusMessage: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  setNewPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}
