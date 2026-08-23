import { Link } from 'react-router-dom';
import { Spinner } from '../../../components/ui/spinner';
import { useMyGoals } from '../../../hooks/use-my-goals';
import { GoalCard } from '../../finance/components/goal-card';
import { PrivacyProvider } from '../../finance/context/privacy-context';

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function GoalsContent() {
  const { goals, loading } = useMyGoals();
  const visibleGoals = goals.slice(0, 3);

  return (
    <div className="card dash-goals-card">
      <div className="card__header">
        <div>
          <span className="eyebrow">Metas</span>
          <h3 className="card__title" style={{ marginTop: 4 }}>
            Minhas metas
          </h3>
        </div>
        <Link to="/financas/metas" className="btn btn--ghost btn--sm">
          Ver todas <ArrowIcon />
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : visibleGoals.length === 0 ? (
        <div className="event-empty">
          <strong>Nenhuma meta criada</strong>
          Crie sua primeira meta em{' '}
          <Link to="/financas/metas">Financas - Metas</Link> ou peca ao Jarvis
          no WhatsApp.
        </div>
      ) : (
        <div className="dash-goals-list">
          {visibleGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
          {goals.length > 3 && (
            <Link to="/financas/metas" className="dash-goals-more">
              +{goals.length - 3} meta{goals.length - 3 > 1 ? 's' : ''} - ver todas
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** Card de metas (read-only) para o painel principal */
export function DashGoalsCard() {
  return (
    <PrivacyProvider>
      <GoalsContent />
    </PrivacyProvider>
  );
}
