import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Field, TextInput } from '../../components/ui/field';
import { resetPassword } from './auth.service';
import { AuthLayout } from './components/auth-layout';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await resetPassword(token ?? '', password);
      setDone(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : 'Não foi possível redefinir a senha.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card>
        <div className="auth__card-head">
          <h2>Nova senha</h2>
          <p>Escolha uma nova senha para a sua conta.</p>
        </div>

        {!token ? (
          <Alert variant="error">
            Link inválido ou expirado. Solicite uma nova redefinição na tela de{' '}
            <Link to="/login">login</Link>.
          </Alert>
        ) : done ? (
          <div className="auth__actions">
            <Alert variant="success">
              Senha redefinida com sucesso. Você já pode entrar.
            </Alert>
            <Link to="/login" className="btn btn--primary btn--block">
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              )}
            </Field>
            <Field label="Confirmar senha">
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              )}
            </Field>

            <div className="auth__actions">
              {error ? <Alert variant="error">{error}</Alert> : null}
              <Button type="submit" block disabled={submitting}>
                {submitting ? 'Aguarde…' : 'Redefinir senha'}
              </Button>
              <div className="auth__link-row">
                <Link to="/login">Voltar para o login</Link>
              </div>
            </div>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
}
