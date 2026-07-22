import { ResetPasswordPage } from '../features/login/components/reset-password-page';
import { useResetPasswordPage } from '../features/login/hooks/use-reset-password-page';

export function ResetPasswordRoute() {
  const model = useResetPasswordPage();

  return <ResetPasswordPage model={model} />;
}
