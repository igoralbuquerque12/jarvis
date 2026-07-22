import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../../../lib/auth-client';
import type { LoginPageViewModel } from '../types';
import {
  requestPasswordReset,
  signInWithGoogle,
  signOut,
  submitEmailPasswordAuth,
  type LoginMode,
} from '../services/login.service';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Algo deu errado. Tente novamente.';
}

export function useLoginPage() {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const [mode, setMode] = useState<LoginMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (session.data) {
      navigate('/home', { replace: true });
    }
  }, [navigate, session.data]);

  function handleEmailChange(value: string) {
    setEmail(value);

    if (!resetEmail) {
      setResetEmail(value);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      await submitEmailPasswordAuth(mode, {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setStatusMessage(
        mode === 'signUp'
          ? 'Conta criada com sucesso. Você já pode entrar.'
          : 'Login realizado com sucesso.',
      );
      navigate('/home', { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handlePasswordResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsResetting(true);

    try {
      await requestPasswordReset(resetEmail.trim());
      setStatusMessage(
        'Se existir uma conta com este e-mail, você receberá as instruções de recuperação.',
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsResetting(false);
    }
  }

  async function handleSignOut() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSigningOut(true);

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSigningOut(false);
    }
  }

  const canSubmit =
    mode === 'signIn'
      ? email.trim().length > 0 && password.length > 0
      : name.trim().length > 0 && email.trim().length > 0 && password.length > 0;

  return {
    session,
    mode,
    name,
    email,
    password,
    resetEmail,
    statusMessage,
    errorMessage,
    isSubmitting,
    isResetting,
    isSigningOut,
    canSubmit,
    setMode,
    setName,
    setEmail: handleEmailChange,
    setPassword,
    setResetEmail,
    handleSubmit,
    handleGoogleSignIn,
    handlePasswordResetRequest,
    handleSignOut,
  } satisfies LoginPageViewModel;
}
