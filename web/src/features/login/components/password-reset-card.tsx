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
import type { LoginPageViewModel } from '../types';

interface PasswordResetCardProps {
  model: LoginPageViewModel;
}

export function PasswordResetCard({ model }: PasswordResetCardProps) {
  return (
    <Card>
      <CardHeader>
        <p className="ui-card__kicker">Recuperação</p>
        <CardTitle>Redefinir senha</CardTitle>
        <CardDescription>
          Enviaremos um link para o e-mail informado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="stack" onSubmit={model.handlePasswordResetRequest}>
          <div className="stack stack--tight">
            <Label htmlFor="reset-email">E-mail</Label>
            <Input
              id="reset-email"
              name="resetEmail"
              autoComplete="email"
              inputMode="email"
              value={model.resetEmail}
              onChange={(event) => model.setResetEmail(event.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>

          <Button
            type="submit"
            variant="outline"
            fullWidth
            disabled={model.isResetting || model.resetEmail.trim().length === 0}
          >
            {model.isResetting ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
