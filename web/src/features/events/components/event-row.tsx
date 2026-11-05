import { Badge } from '../../../components/ui/badge';
import { IconButton } from '../../../components/ui/button';
import { IconEdit, IconTrash } from '../../../components/ui/icons';
import { describeRecurrence, formatEventInstant } from '../../../lib/format';
import type { EventExecutionStatus, UpcomingEvent } from '../../../types/api';

type BadgeVariant = 'accent' | 'success' | 'neutral' | 'danger';

const STATUS_BADGE: Record<
  Exclude<EventExecutionStatus, 'PENDING'>,
  { label: string; variant: BadgeVariant }
> = {
  PROCESSING: { label: 'Enviando', variant: 'accent' },
  COMPLETED: { label: 'Enviado', variant: 'success' },
  FAILED: { label: 'Falhou', variant: 'danger' },
  CANCELLED: { label: 'Cancelado', variant: 'neutral' },
};

interface EventRowProps {
  event: UpcomingEvent;
  timezone: string;
  onEdit: (event: UpcomingEvent) => void;
  onCancel: (event: UpcomingEvent) => void;
}

export function EventRow({ event, timezone, onEdit, onCancel }: EventRowProps) {
  const instant = formatEventInstant(event.scheduledAt, timezone);
  const isPending = event.status === 'PENDING';
  // The scheduler ticks every 10 minutes, so a pending reminder can briefly be
  // past due before it is picked up.
  const overdue = isPending && new Date(event.scheduledAt) < new Date();
  const badge = event.status === 'PENDING' ? null : STATUS_BADGE[event.status];

  return (
    <li className={isPending ? 'ev-row' : 'ev-row ev-row--done'}>
      <span className="ev-row__time mono" title={instant.full}>
        {instant.time}
      </span>
      <div className="ev-row__body">
        <p className="ev-row__content">{event.content}</p>
        <div className="ev-row__meta">
          <Badge
            variant={event.series.type === 'RECURRENCE' ? 'accent' : 'neutral'}
          >
            {describeRecurrence(event.series)}
          </Badge>
          {badge ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
          {overdue ? <Badge variant="accent">Aguardando envio</Badge> : null}
        </div>
        {event.status === 'FAILED' && event.observabilitys ? (
          <p className="ev-row__failure">{event.observabilitys}</p>
        ) : null}
      </div>
      {isPending ? (
        <div className="ev-row__actions">
          <IconButton label="Editar lembrete" onClick={() => onEdit(event)}>
            <IconEdit />
          </IconButton>
          <IconButton
            label="Cancelar lembrete"
            danger
            onClick={() => onCancel(event)}
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
