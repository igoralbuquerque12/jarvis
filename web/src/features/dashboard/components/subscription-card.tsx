import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader } from '../../../components/ui/card';
import { IconArrowRight } from '../../../components/ui/icons';
import { formatCurrencyBRL } from '../../../lib/format';
import type { ProfileMe } from '../../../types/api';
import { describePlanFeatures } from '../../plans/plan-features';

export function SubscriptionCard({ profile }: { profile: ProfileMe }) {
  const { subscription } = profile;
  const memberSince = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.createdAt));

  return (
    <Card>
      <CardHeader
        title="Seu plano"
        aside={
          <>
            <Badge variant="accent">{subscription.name}</Badge>
            <Link to="/planos" className="btn btn--subtle btn--sm">
              Ver planos <IconArrowRight />
            </Link>
          </>
        }
      />
      <div className="plan-price">
        <span className="plan-price__value">
          {subscription.price === 0
            ? 'Grátis'
            : formatCurrencyBRL(subscription.price)}
        </span>
        {subscription.price > 0 ? (
          <span className="plan-price__period">/mês</span>
        ) : null}
      </div>
      <div className="plan-meta">
        {describePlanFeatures(subscription.features).map((feature) => (
          <div key={feature.key} className="plan-meta__row">
            <span>{feature.label}</span>
            <strong>{feature.included ? 'Incluso' : 'Não incluso'}</strong>
          </div>
        ))}
        <div className="plan-meta__row">
          <span>Membro desde</span>
          <strong>{memberSince}</strong>
        </div>
      </div>
    </Card>
  );
}
