import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { IconCheck, IconLayers } from '../../components/ui/icons';
import { PageHeader } from '../../components/ui/page-header';
import { Spinner } from '../../components/ui/spinner';
import { useMyProfile } from '../../hooks/use-my-profile';
import { formatCurrencyBRL } from '../../lib/format';
import { getPlans } from '../../services/subscriptions.service';
import type { Plan } from '../../types/api';

function planFeatures(plan: Plan): string[] {
  return [
    `Até ${plan.limit} mensagens por mês`,
    'Lembretes únicos e recorrentes',
    'Controle de gastos, contas fixas e metas',
    'Carteira de investimentos',
    'Categorização automática por regras',
    'Tudo direto no WhatsApp',
  ];
}

export function PlansPage() {
  const { profile } = useMyProfile();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getPlans()
      .then((data) => {
        if (active) {
          setPlans(data);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar os planos.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Planos"
        title="Escolha seu ritmo"
        description="Todos os planos incluem o Jarvis completo no WhatsApp. O que muda é o volume de mensagens por mês. A troca de plano estará disponível em breve."
      />

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : !plans ? (
        <Spinner page />
      ) : plans.length === 0 ? (
        <EmptyState icon={<IconLayers />} title="Nenhum plano disponível">
          Volte em breve. Estamos preparando as opções.
        </EmptyState>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => {
            const isCurrent = plan.id === profile?.subscription.id;

            return (
              <section
                key={plan.id}
                className={
                  isCurrent ? 'plan-card plan-card--current' : 'plan-card'
                }
              >
                <header className="plan-card__head">
                  <h3 className="card__title">{plan.name}</h3>
                  {isCurrent ? <Badge variant="accent">Seu plano</Badge> : null}
                </header>
                <div className="plan-price">
                  <span className="plan-price__value">
                    {plan.price === 0 ? 'Grátis' : formatCurrencyBRL(plan.price)}
                  </span>
                  {plan.price > 0 ? (
                    <span className="plan-price__period">/mês</span>
                  ) : null}
                </div>
                <ul className="plan-features">
                  {planFeatures(plan).map((feature) => (
                    <li key={feature}>
                      <IconCheck />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="plan-card__cta">
                  {isCurrent ? (
                    <Button variant="ghost" block disabled>
                      Plano atual
                    </Button>
                  ) : (
                    <Button block disabled title="Troca de plano em breve">
                      Em breve
                    </Button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
