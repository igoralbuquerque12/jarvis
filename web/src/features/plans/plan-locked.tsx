import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/empty-state';
import { IconArrowRight } from '../../components/ui/icons';

/** Shown in place of a feature the profile's plan does not include. */
export function PlanLocked({ feature }: { feature: string }) {
  return (
    <EmptyState
      title="Fora do seu plano"
      action={
        <Link to="/planos" className="btn btn--subtle btn--sm">
          Ver planos <IconArrowRight />
        </Link>
      }
    >
      {feature} não está incluído no seu plano atual.
    </EmptyState>
  );
}
