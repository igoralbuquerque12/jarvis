import type { Goal } from '../../../types/api';
import { Amount } from './amount';

interface GoalCardProps {
  goal: Goal;
  onDelete?: (id: string) => void;
  onUpdateAmount?: (goal: Goal) => void;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

export function GoalCard({ goal, onDelete, onUpdateAmount }: GoalCardProps) {
  const progress = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100,
  );
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <div className="goal-card">
      <div className="goal-card__header">
        {goal.icon && <span className="goal-card__icon">{goal.icon}</span>}
        <div className="goal-card__info">
          <span className="goal-card__name">{goal.name}</span>
          {goal.targetDate && (
            <span className="goal-card__date muted">
              até {formatDate(goal.targetDate)}
            </span>
          )}
        </div>
        <div className="goal-card__actions">
          {onUpdateAmount && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => onUpdateAmount(goal)}
            >
              + Valor
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => onDelete(goal.id)}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="goal-bar">
        <div
          className="goal-bar__fill"
          style={{
            width: `${progress}%`,
            backgroundColor: goal.color ?? 'var(--accent)',
          }}
        />
      </div>

      <div className="goal-card__amounts">
        <span>
          <Amount value={goal.currentAmount} currency={goal.currency} />
          <span className="muted"> de </span>
          <Amount value={goal.targetAmount} currency={goal.currency} />
        </span>
        <span className="goal-card__progress">{progress}%</span>
      </div>

      {remaining > 0 && (
        <p className="goal-card__remaining muted">
          Faltam <Amount value={remaining} currency={goal.currency} />
        </p>
      )}
    </div>
  );
}
