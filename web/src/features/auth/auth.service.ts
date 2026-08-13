import { authClient } from '../../lib/auth-client';

export interface AuthResult {
  error?: { message?: string } | null;
}

function assertSuccess(result: AuthResult, fallback: string) {
  if (result.error) {
    throw new Error(result.error.message?.trim() || fallback);
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await authClient.signIn.email({ email, password });
  assertSuccess(result, 'Não foi possível entrar. Confira e-mail e senha.');
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const result = await authClient.signUp.email({ name, email, password });
  assertSuccess(result, 'Não foi possível criar a conta.');
}

export async function requestPasswordReset(email: string) {
  const result = await authClient.requestPasswordReset({
    email,
    redirectTo: `${window.location.origin}/reset-password`,
  });
  assertSuccess(result, 'Não foi possível solicitar a redefinição de senha.');
}

export async function resetPassword(token: string, newPassword: string) {
  const result = await authClient.resetPassword({ token, newPassword });
  assertSuccess(result, 'Não foi possível redefinir a senha.');
}
