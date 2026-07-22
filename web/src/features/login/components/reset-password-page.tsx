import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Link } from 'react-router-dom';
import type { ResetPasswordPageViewModel } from '../types';

interface ResetPasswordPageProps {
  model: ResetPasswordPageViewModel;
}

export function ResetPasswordPage({ model }: ResetPasswordPageProps) {
  return (
    <main className="app-shell app-shell--centered">
      <Card className="auth-card">
        <CardHeader>
          <p className="ui-card__kicker">Recuperação</p>
          <CardTitle>Definir nova senha</CardTitle>
          <CardDescription>
            Use a nova senha e finalize a troca da sua credencial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="stack" onSubmit={model.handleSubmit}>
            <div className="stack stack--tight">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={model.newPassword}
                onChange={(event) => model.setNewPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="stack stack--tight">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={model.confirmPassword}
                onChange={(event) => model.setConfirmPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>

            {model.errorMessage ? (
              <div className="ui-feedback ui-feedback--error">{model.errorMessage}</div>
            ) : null}

            {model.statusMessage ? (
              <div className="ui-feedback ui-feedback--success">{model.statusMessage}</div>
            ) : null}

            <Button
              type="submit"
              fullWidth
              disabled={model.isSubmitting || model.token.length === 0}
            >
              {model.isSubmitting ? 'Salvando...' : 'Redefinir senha'}
            </Button>

            <Link className="ui-inline-link" to="/login">
              Voltar ao login
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
