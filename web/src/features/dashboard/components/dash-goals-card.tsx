import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { IconArrowRight, IconTarget } from '../../../components/ui/icons';
import { Spinner } from '../../../components/ui/spinner';
import { useMyGoals } from '../../../hooks/use-my-goals';
import { GoalCard } from '../../finance/components/goal-card';

const VISIBLE = 3;

/** Read-only preview of the first few goals. */
export function DashGoalsCard() {
  const { goals, loading } = useMyGoals();
  const active = goals.filter((goal) => goal.currentAmount < goal.targetAmount);
  const visible = active.slice(0, VISIBLE);
  const rest = active.length - visible.length;

  return (
    <Card>
      <CardHeader
        title="Metas"
        subtitle={
          active.length > 0
            ? `${active.length} em andamento`
            : 'Objetivos de economia'
        }
        aside={
          <Link to="/financas/metas" className="btn btn--ghost btn--sm">
            Ver todas <IconArrowRight />
          </Link>
        }
      />

      {loading ? (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={<IconTarget />} title="Nenhuma meta em andamento">
          Crie uma meta em Finanças ou peça ao Jarvis no WhatsApp.
        </EmptyState>
      ) : (
        <div className="stack stack--tight">
          {visible.map((goal) => (
            <GoalCard key={goal.id} goal={goal} compact />
          ))}
          {rest > 0 ? (
            <Link to="/financas/metas" className="btn btn--subtle btn--sm">
              Mais {rest} {rest > 1 ? 'metas' : 'meta'}
            </Link>
          ) : null}
        </div>
      )}
    </Card>
  );
}
