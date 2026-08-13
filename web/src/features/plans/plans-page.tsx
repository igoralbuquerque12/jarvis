import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { useMyProfile } from '../../hooks/use-my-profile';
import { formatCurrencyBRL } from '../../lib/format';
import { getPlans } from '../../services/subscriptions.service';
import type { Plan } from '../../types/api';

function planFeatures(plan: Plan): string[] {
  return [
    `Até ${plan.limit} mensagens por mês`,
    'Lembretes únicos e recorrentes',
    'Conexão direta com o WhatsApp',
    'Contexto pessoal para a IA',
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
    <>
      <div className="page-head">
        <span className="eyebrow">Planos</span>
        <h2>Escolha seu ritmo</h2>
        <p>
          Todos os planos incluem o Jarvis completo no WhatsApp — o que muda é
          o volume de mensagens. A troca de plano estará disponível em breve.
        </p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : !plans ? (
        <Spinner page />
      ) : plans.length === 0 ? (
        <div className="event-empty">
          <strong>Nenhum plano disponível</strong>
          Volte em breve — estamos preparando as opções.
        </div>
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
                  {isCurrent ? <Badge variant="accent">Atual</Badge> : null}
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
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="plan-card__cta">
                  {isCurrent ? (
                    <Button variant="ghost" block disabled>
                      Seu plano atual
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
    </>
  );
}
