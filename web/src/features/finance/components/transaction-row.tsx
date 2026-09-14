import { IconButton } from '../../../components/ui/button';
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconEdit,
  IconTrash,
} from '../../../components/ui/icons';
import { formatISODate } from '../../../lib/dates';
import type { Transaction } from '../../../types/api';
import { Amount } from './amount';

interface TransactionRowProps {
  tx: Transaction;
  /** Show the date in the meta line (lists that are not grouped by day). */
  showDate?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

export function TransactionRow({
  tx,
  showDate = false,
  onDelete,
  onEdit,
}: TransactionRowProps) {
  const isCredit = tx.type === 'credit';
  const meta = [
    showDate ? formatISODate(tx.date) : null,
    tx.category?.name ?? 'Sem categoria',
    tx.account && !tx.account.isDefault ? tx.account.name : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="tx-row">
      <span className="tx-row__icon" data-type={tx.type} aria-hidden="true">
        {tx.category?.icon ? (
          tx.category.icon
        ) : isCredit ? (
          <IconArrowDownLeft />
        ) : (
          <IconArrowUpRight />
        )}
      </span>
      <div className="tx-row__body">
        <span className="tx-row__description" title={tx.notes || undefined}>
          {tx.description}
        </span>
        <span className="tx-row__meta">{meta}</span>
      </div>
      <Amount
        value={isCredit ? tx.amount : -tx.amount}
        currency={tx.currency}
        colored
        className="tx-row__amount"
      />
      {onEdit || onDelete ? (
        <div className="tx-row__actions">
          {onEdit ? (
            <IconButton label="Editar" onClick={() => onEdit(tx)}>
              <IconEdit />
            </IconButton>
          ) : null}
          {onDelete ? (
            <IconButton label="Excluir" danger onClick={() => onDelete(tx.id)}>
              <IconTrash />
            </IconButton>
          ) : null}
        </div>
      ) : (
        <span />
      )}
    </li>
  );
}
