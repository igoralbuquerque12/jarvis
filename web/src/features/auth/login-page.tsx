import type { FormEvent } from 'react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Field, TextInput } from '../../components/ui/field';
import { Spinner } from '../../components/ui/spinner';
import { JarvisMark } from '../../components/ui/wordmark';
import { authClient } from '../../lib/auth-client';
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from './auth.service';
import { AuthLayout } from './components/auth-layout';

type Mode = 'signIn' | 'signUp' | 'forgot';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (isPending) {
    return <Spinner page />;
  }

  if (session) {
    return <Navigate replace to="/dashboard" />;
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
        navigate('/dashboard', { replace: true });
      } else if (mode === 'signUp') {
        await signUpWithEmail(name.trim(), email, password);
        navigate('/dashboard', { replace: true });
      } else {
        await requestPasswordReset(email);
        setNotice(
          'Se o e-mail existir, você receberá um link para redefinir a senha.',
        );
      }
    } catch (submitError) {
      setError(errorMessage(submitError, 'Algo deu errado. Tente novamente.'));
    } finally {
      setSubmitting(false);
    }
  }

  const cardHead =
    mode === 'signIn'
      ? {
          title: 'Bem-vindo de volta',
          subtitle: 'Entre para acompanhar seus lembretes e eventos.',
        }
      : mode === 'signUp'
        ? {
            title: 'Criar sua conta',
            subtitle: 'Leva menos de um minuto para começar.',
          }
        : {
            title: 'Recuperar acesso',
            subtitle: 'Informe seu e-mail e enviaremos um link de redefinição.',
          };

  return (
    <AuthLayout>
      <Card>
        <div className="auth__card-head">
          <JarvisMark className="lockup__icon" />
          <div>
            <h2>{cardHead.title}</h2>
            <p>{cardHead.subtitle}</p>
          </div>
        </div>

        {mode !== 'forgot' ? (
          <div className="auth__switch" role="tablist" aria-label="Acesso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signIn'}
              className="auth__switch-btn"
              onClick={() => switchMode('signIn')}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signUp'}
              className="auth__switch-btn"
              onClick={() => switchMode('signUp')}
            >
              Criar conta
            </button>
          </div>
        ) : null}

        <form onSubmit={(event) => void handleSubmit(event)}>
          {mode === 'signUp' ? (
            <Field label="Nome">
              {(id) => (
                <TextInput
                  id={id}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como o Jarvis deve te chamar"
                  autoComplete="name"
                  required
                />
              )}
            </Field>
          ) : null}

          <Field label="E-mail">
            {(id) => (
              <TextInput
                id={id}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
              />
            )}
          </Field>

          {mode !== 'forgot' ? (
            <Field
              label="Senha"
              hint={mode === 'signUp' ? 'Mínimo de 8 caracteres.' : undefined}
            >
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete={
                    mode === 'signUp' ? 'new-password' : 'current-password'
                  }
                  minLength={8}
                  required
                />
              )}
            </Field>
          ) : null}

          <div className="auth__actions">
            {error ? <Alert variant="error">{error}</Alert> : null}
            {notice ? <Alert variant="success">{notice}</Alert> : null}

            <Button type="submit" block disabled={submitting}>
              {submitting
                ? 'Aguarde…'
                : mode === 'signIn'
                  ? 'Entrar'
                  : mode === 'signUp'
                    ? 'Criar conta'
                    : 'Enviar link'}
            </Button>

            <div className="auth__link-row">
              {mode === 'forgot' ? (
                <a
                  href="/login"
                  onClick={(event) => {
                    event.preventDefault();
                    switchMode('signIn');
                  }}
                >
                  Voltar para o login
                </a>
              ) : (
                <a
                  href="/login"
                  onClick={(event) => {
                    event.preventDefault();
                    switchMode('forgot');
                  }}
                >
                  Esqueci minha senha
                </a>
              )}
            </div>
          </div>
        </form>
      </Card>
    </AuthLayout>
  );
}
