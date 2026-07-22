import { authClient } from '../../../lib/auth-client';

export type LoginMode = 'signIn' | 'signUp';

export interface EmailPasswordValues {
  name: string;
  email: string;
  password: string;
}

function getAppHomeUrl() {
  return `${window.location.origin}/home`;
}

function getResetPasswordUrl() {
  return `${window.location.origin}/reset-password`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    const message = (error as { message?: string }).message?.trim();
    if (message) {
      return message;
    }
  }

  return fallback;
}

function assertAuthSuccess(response: unknown, fallback: string) {
  if (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    (response as { error?: unknown }).error
  ) {
    throw new Error(
      getErrorMessage(
        (response as { error?: unknown }).error,
        fallback,
      ),
    );
  }
}

export async function submitEmailPasswordAuth(
  mode: LoginMode,
  values: EmailPasswordValues,
) {
  const response = await (mode === 'signUp'
    ? authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      })
    : authClient.signIn.email({
        email: values.email,
        password: values.password,
      }));

  assertAuthSuccess(
    response,
    mode === 'signUp'
      ? 'Não foi possível criar a conta.'
      : 'Não foi possível entrar.',
  );
}

export async function signInWithGoogle() {
  const response = await authClient.signIn.social({
    provider: 'google',
    callbackURL: getAppHomeUrl(),
  });

  assertAuthSuccess(response, 'Falha no login com Google.');
}

export async function requestPasswordReset(email: string) {
  const response = await authClient.requestPasswordReset({
    email,
    redirectTo: getResetPasswordUrl(),
  });

  assertAuthSuccess(response, 'Não foi possível solicitar a redefinição de senha.');
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await authClient.resetPassword({
    token,
    newPassword,
  });

  assertAuthSuccess(response, 'Não foi possível redefinir a senha.');
}

export async function signOut() {
  const response = await authClient.signOut();

  assertAuthSuccess(response, 'Não foi possível sair.');
}
