import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import type { LoginPageViewModel } from '../types';

interface SessionCardProps {
  model: LoginPageViewModel;
}

export function SessionCard({ model }: SessionCardProps) {
  const session = model.session.data;

  return (
    <Card>
      <CardHeader>
        <p className="ui-card__kicker">Sessão</p>
        <CardTitle>Estado atual</CardTitle>
        <CardDescription>Consulta rápida do usuário autenticado.</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        {session ? (
          <>
            <div className="ui-session-pill">
              <strong>{session.user.name}</strong>
              <span>{session.user.email}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={model.handleSignOut}
              disabled={model.isSigningOut}
            >
              {model.isSigningOut ? 'Saindo...' : 'Logout'}
            </Button>
          </>
        ) : (
          <p className="ui-muted">
            Nenhuma sessão ativa no momento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
