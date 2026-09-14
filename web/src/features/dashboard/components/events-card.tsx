import { useState } from 'react';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { IconButton } from '../../../components/ui/button';
import { Card, CardHeader } from '../../../components/ui/card';
import { EmptyState } from '../../../components/ui/empty-state';
import { IconBell, IconTrash } from '../../../components/ui/icons';
import { Spinner } from '../../../components/ui/spinner';
import { describeRecurrence, formatEventInstant } from '../../../lib/format';
import { cancelMyEventSeries } from '../../../services/events.service';
import type { UpcomingEvent } from '../../../types/api';

interface EventsCardProps {
  events: UpcomingEvent[];
  loading: boolean;
  error: string | null;
  timezone: string;
  onChanged: () => void;
}

function EventItem({
  event,
  timezone,
  onChanged,
}: {
  event: UpcomingEvent;
  timezone: string;
  onChanged: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const instant = formatEventInstant(event.scheduledAt, timezone);

  async function handleCancel() {
    const confirmed = window.confirm(
      event.series.type === 'RECURRENCE'
        ? 'Cancelar este lembrete recorrente? Todas as próximas ocorrências serão canceladas.'
        : 'Cancelar este lembrete?',
    );
    if (!confirmed) {
      return;
    }

    setCancelling(true);
    setCancelError(null);
    try {
      await cancelMyEventSeries(event.series.id);
      onChanged();
    } catch (error) {
      setCancelError(
        error instanceof Error
          ? error.message
          : 'Não foi possível cancelar o lembrete.',
      );
      setCancelling(false);
    }
  }

  return (
    <li className="event-item">
      <div className="event-item__date" title={instant.full}>
        <div className="event-item__day">{instant.day}</div>
        <div className="event-item__month">{instant.month}</div>
      </div>
      <div className="event-item__body">
        <p className="event-item__content">{event.content}</p>
        <div className="event-item__meta">
          <span className="mono">
            {instant.weekday} · {instant.time}
          </span>
          <Badge
            variant={event.series.type === 'RECURRENCE' ? 'accent' : 'neutral'}
          >
            {describeRecurrence(event.series)}
          </Badge>
          {event.status === 'PROCESSING' ? (
            <Badge variant="success">Enviando</Badge>
          ) : null}
        </div>
        {cancelError ? (
          <div style={{ marginTop: 8 }}>
            <Alert variant="error">{cancelError}</Alert>
          </div>
        ) : null}
      </div>
      <IconButton
        label="Cancelar lembrete"
        danger
        onClick={() => void handleCancel()}
        disabled={cancelling}
      >
        <IconTrash />
      </IconButton>
    </li>
  );
}

export function EventsCard({
  events,
  loading,
  error,
  timezone,
  onChanged,
}: EventsCardProps) {
  return (
    <Card>
      <CardHeader
        title="Próximos lembretes"
        subtitle="O que o Jarvis vai te enviar no WhatsApp."
        aside={
          events.length > 0 ? (
            <Badge variant="accent">{events.length}</Badge>
          ) : undefined
        }
      />

      {loading ? (
        <div className="spinner-wrap">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : events.length === 0 ? (
        <EmptyState icon={<IconBell />} title="Nada agendado">
          Peça ao Jarvis no WhatsApp. Por exemplo: «me lembra amanhã às 9h de
          pagar o boleto».
        </EmptyState>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              timezone={timezone}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
