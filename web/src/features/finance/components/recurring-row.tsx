import { IconButton } from '../../../components/ui/button';
import { IconRepeat, IconTrash } from '../../../components/ui/icons';
import { formatISODate } from '../../../lib/dates';
import type { RecurringTransaction } from '../../../types/api';
import { FREQUENCY_LABELS } from '../frequency';
import { Amount } from './amount';

interface RecurringRowProps {
  item: RecurringTransaction;
  onDelete?: (id: string) => void;
}

export function RecurringRow({ item, onDelete }: RecurringRowProps) {
  const meta = [
    FREQUENCY_LABELS[item.frequency] ?? item.frequency,
    item.dayOfMonth != null ? `dia ${item.dayOfMonth}` : null,
    item.category?.name ?? null,
    item.nextDueDate ? `próxima em ${formatISODate(item.nextDueDate)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="tx-row">
      <span className="tx-row__icon" data-type={item.type} aria-hidden="true">
        {item.category?.icon ? item.category.icon : <IconRepeat />}
      </span>
      <div className="tx-row__body">
        <span className="tx-row__description">{item.description}</span>
        <span className="tx-row__meta">{meta}</span>
      </div>
      <Amount
        value={item.type === 'credit' ? item.amount : -item.amount}
        currency={item.currency}
        colored
        className="tx-row__amount"
      />
      {onDelete ? (
        <div className="tx-row__actions">
          <IconButton
            label="Excluir conta fixa"
            danger
            onClick={() => onDelete(item.id)}
          >
            <IconTrash />
          </IconButton>
        </div>
      ) : (
        <span />
      )}
    </li>
  );
}
