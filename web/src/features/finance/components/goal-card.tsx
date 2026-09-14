import { IconButton } from '../../../components/ui/button';
import { IconPlus, IconTarget, IconTrash } from '../../../components/ui/icons';
import { formatISODate } from '../../../lib/dates';
import type { Goal } from '../../../types/api';
import { Amount } from './amount';

interface GoalCardProps {
  goal: Goal;
  compact?: boolean;
  onDelete?: (id: string) => void;
  onUpdateAmount?: (goal: Goal) => void;
}

export function GoalCard({
  goal,
  compact = false,
  onDelete,
  onUpdateAmount,
}: GoalCardProps) {
  const progress = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100,
  );
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const done = remaining === 0;

  const className = [
    'goal-card',
    compact ? 'goal-card--compact' : null,
    done ? 'goal-card--done' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <div className="goal-card__header">
        <span className="goal-card__icon" aria-hidden="true">
          {goal.icon ? goal.icon : <IconTarget />}
        </span>
        <div className="goal-card__info">
          <span className="goal-card__name">{goal.name}</span>
          <span className="goal-card__date muted">
            {done
              ? 'Concluída'
              : goal.targetDate
                ? `até ${formatISODate(goal.targetDate, { day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'Sem prazo'}
          </span>
        </div>
        {onUpdateAmount || onDelete ? (
          <div className="goal-card__actions">
            {onUpdateAmount ? (
              <IconButton
                label="Atualizar valor guardado"
                outline
                onClick={() => onUpdateAmount(goal)}
              >
                <IconPlus />
              </IconButton>
            ) : null}
            {onDelete ? (
              <IconButton
                label="Excluir meta"
                danger
                onClick={() => onDelete(goal.id)}
              >
                <IconTrash />
              </IconButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="goal-bar">
        <div
          className="goal-bar__fill"
          style={{
            width: `${progress}%`,
            backgroundColor: done ? undefined : goal.color,
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

      {!compact && remaining > 0 ? (
        <p className="goal-card__remaining muted">
          Faltam <Amount value={remaining} currency={goal.currency} />
        </p>
      ) : null}
    </div>
  );
}
