import type { RecurringTransaction } from '../../../types/api';
import { Amount } from './amount';

interface RecurringRowProps {
  item: RecurringTransaction;
  onDelete?: (id: string) => void;
}

const FREQ_LABELS: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      width={16}
      height={16}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export function RecurringRow({ item, onDelete }: RecurringRowProps) {
  return (
    <li className="tx-row">
      <div className="tx-row__type-dot" data-type={item.type} />
      <div className="tx-row__body">
        <span className="tx-row__description">{item.description}</span>
        <span className="tx-row__meta">
          {FREQ_LABELS[item.frequency] ?? item.frequency}
          {item.dayOfMonth != null && ` · dia ${item.dayOfMonth}`}
          {item.category && ` · ${item.category.name}`}
        </span>
      </div>
      <Amount
        value={item.type === 'credit' ? item.amount : -item.amount}
        currency={item.currency}
        colored
        className="tx-row__amount"
      />
      {onDelete && (
        <div className="tx-row__actions">
          <button
            type="button"
            className="tx-row__action-btn tx-row__action-btn--danger"
            title="Excluir recorrência"
            onClick={() => onDelete(item.id)}
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </li>
  );
}
