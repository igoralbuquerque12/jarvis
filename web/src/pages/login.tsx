import { LoginPage } from '../features/login/components/login-page';
import { useLoginPage } from '../features/login/hooks/use-login-page';

export function LoginRoute() {
  const model = useLoginPage();

  return <LoginPage model={model} />;
}
