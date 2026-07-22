import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ResetPasswordPageViewModel } from '../types';
import { resetPassword } from '../services/login.service';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Algo deu errado. Tente novamente.';
}

export function useResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!token) {
      setErrorMessage('O link de recuperação está inválido ou expirado.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, newPassword);
      setStatusMessage('Senha redefinida com sucesso. Você já pode voltar ao login.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    token,
    newPassword,
    confirmPassword,
    statusMessage,
    errorMessage,
    isSubmitting,
    setNewPassword,
    setConfirmPassword,
    handleSubmit,
  } satisfies ResetPasswordPageViewModel;
}
