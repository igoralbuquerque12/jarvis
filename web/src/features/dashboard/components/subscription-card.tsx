import { Badge } from '../../../components/ui/badge';
import { Card, CardHeader } from '../../../components/ui/card';
import { formatCurrencyBRL } from '../../../lib/format';
import type { ProfileMe } from '../../../types/api';

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
        aside={<Badge variant="accent">{subscription.name}</Badge>}
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
        <div className="plan-meta__row">
          <span>Limite do plano</span>
          <strong>{subscription.limit} mensagens</strong>
        </div>
        <div className="plan-meta__row">
          <span>Membro desde</span>
          <strong>{memberSince}</strong>
        </div>
      </div>
    </Card>
  );
}
