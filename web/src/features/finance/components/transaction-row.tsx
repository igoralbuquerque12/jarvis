import type { Transaction } from '../../../types/api';
import { Amount } from './amount';

interface TransactionRowProps {
  tx: Transaction;
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

function formatDate(dateStr: string) {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-');
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TransactionRow({ tx, onDelete, onEdit }: TransactionRowProps) {
  const isCredit = tx.type === 'credit';

  return (
    <li className="tx-row">
      <div className="tx-row__type-dot" data-type={tx.type} />
      <div className="tx-row__body">
        <span className="tx-row__description">{tx.description}</span>
        <span className="tx-row__meta">
          {formatDate(tx.date)}
          {tx.category && (
            <>
              {' · '}
              <span className="tx-row__category">{tx.category.name}</span>
            </>
          )}
        </span>
      </div>
      <Amount
        value={isCredit ? tx.amount : -tx.amount}
        currency={tx.currency}
        colored
        className="tx-row__amount"
      />
      <div className="tx-row__actions">
        {onEdit && (
          <button
            type="button"
            className="tx-row__action-btn"
            title="Editar"
            onClick={() => onEdit(tx)}
          >
            <EditIcon />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="tx-row__action-btn tx-row__action-btn--danger"
            title="Excluir"
            onClick={() => onDelete(tx.id)}
          >
            <TrashIcon />
          </button>
        )}
      </div>
    </li>
  );
}
