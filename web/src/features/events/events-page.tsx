import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button, IconButton } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';
import {
  IconBell,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
} from '../../components/ui/icons';
import { PageHeader } from '../../components/ui/page-header';
import { Segmented } from '../../components/ui/segmented';
import { Spinner } from '../../components/ui/spinner';
import { useMyEventPage } from '../../hooks/use-my-event-page';
import { useMyProfile } from '../../hooks/use-my-profile';
import { describeEventDay, eventDayKey } from '../../lib/format';
import { cancelMyEventSeries } from '../../services/events.service';
import type {
  EventListTab,
  EventSeriesType,
  UpcomingEvent,
} from '../../types/api';
import { PlanLocked } from '../plans/plan-locked';
import { EventFormModal } from './components/event-form-modal';
import { EventRow } from './components/event-row';

type TypeFilter = 'all' | EventSeriesType;
type StatusFilter = 'all' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

interface DayGroup {
  key: string;
  items: UpcomingEvent[];
}

function groupByDay(items: UpcomingEvent[], timezone: string): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const key = eventDayKey(item.scheduledAt, timezone);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, items: [item] });
    }
  }
  return groups;
}

function EventsView({
  timezone,
  creating,
  onCloseCreate,
}: {
  timezone: string;
  creating: boolean;
  onCloseCreate: () => void;
}) {
  const [tab, setTab] = useState<EventListTab>('upcoming');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UpcomingEvent | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error, reload } = useMyEventPage({
    tab,
    q: query || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: tab === 'past' && statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const groups = useMemo(
    () => groupByDay(data.items, timezone),
    [data.items, timezone],
  );
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const filtered =
    query !== '' || typeFilter !== 'all' || (tab === 'past' && statusFilter !== 'all');

  async function handleCancel(event: UpcomingEvent) {
    const confirmed = window.confirm(
      event.series.type === 'RECURRENCE'
        ? 'Cancelar este lembrete recorrente? Todas as próximas ocorrências serão canceladas.'
        : 'Cancelar este lembrete?',
    );
    if (!confirmed) return;

    setActionError(null);
    try {
      await cancelMyEventSeries(event.series.id);
      reload();
    } catch (cancelError) {
      setActionError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Não foi possível cancelar o lembrete.',
      );
    }
  }

  return (
    <>
      <div className="toolbar">
        <Segmented<EventListTab>
          label="Período"
          value={tab}
          onChange={(next) => {
            setTab(next);
            setPage(1);
          }}
          options={[
            {
              value: 'upcoming',
              label: `Próximos · ${data.counts.upcoming}`,
            },
            { value: 'past', label: `Passados · ${data.counts.past}` },
          ]}
        />
        <span className="toolbar__spacer" />
        <label className="search">
          <IconSearch />
          <input
            className="input"
            placeholder="Buscar no texto"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Segmented<TypeFilter>
          label="Tipo"
          value={typeFilter}
          onChange={(next) => {
            setTypeFilter(next);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'UNIQUE', label: 'Únicos' },
            { value: 'RECURRENCE', label: 'Recorrentes' },
          ]}
        />
        {tab === 'past' ? (
          <Segmented<StatusFilter>
            label="Situação"
            value={statusFilter}
            onChange={(next) => {
              setStatusFilter(next);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'COMPLETED', label: 'Enviados' },
              { value: 'FAILED', label: 'Falharam' },
              { value: 'CANCELLED', label: 'Cancelados' },
            ]}
          />
        ) : null}
      </div>

      {actionError ? <Alert variant="error">{actionError}</Alert> : null}

      <Card flush>
        {loading ? (
          <div className="spinner-wrap">
            <Spinner />
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <Alert variant="error">{error}</Alert>
          </div>
        ) : data.items.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState
              icon={<IconBell />}
              title={
                filtered
                  ? 'Nada encontrado'
                  : tab === 'upcoming'
                    ? 'Nada agendado'
                    : 'Nenhum lembrete passado'
              }
            >
              {filtered
                ? 'Tente outra busca ou limpe os filtros.'
                : tab === 'upcoming'
                  ? 'Crie um lembrete aqui ou peça ao Jarvis no WhatsApp, como «me lembra amanhã às 9h de pagar o boleto».'
                  : 'Os lembretes já enviados, cancelados ou que falharam aparecem aqui.'}
            </EmptyState>
          </div>
        ) : (
          <div className="tx-groups">
            {groups.map((group) => (
              <section key={group.key} className="tx-group">
                <header className="tx-group__head">
                  <span>{describeEventDay(group.key, timezone)}</span>
                  <Badge variant="neutral">{group.items.length}</Badge>
                </header>
                <ul className="tx-list">
                  {group.items.map((item) => (
                    <EventRow
                      key={item.id}
                      event={item}
                      timezone={timezone}
                      onEdit={setEditing}
                      onCancel={(event) => void handleCancel(event)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <footer className="pagination">
            <span>
              Página {page} de {totalPages} · {data.total} lembretes
            </span>
            <div className="pagination__controls">
              <IconButton
                label="Página anterior"
                outline
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <IconChevronLeft />
              </IconButton>
              <IconButton
                label="Próxima página"
                outline
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                <IconChevronRight />
              </IconButton>
            </div>
          </footer>
        ) : null}
      </Card>

      {creating ? (
        <EventFormModal
          timezone={timezone}
          onSaved={reload}
          onClose={onCloseCreate}
        />
      ) : null}

      {editing ? (
        <EventFormModal
          initial={editing}
          timezone={timezone}
          onSaved={reload}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

export function EventsPage() {
  const { profile, loading, error } = useMyProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creatingLocal, setCreatingLocal] = useState(false);
  const creating = creatingLocal || searchParams.get('novo') === '1';

  function closeCreate() {
    setCreatingLocal(false);
    if (searchParams.has('novo')) {
      setSearchParams({}, { replace: true });
    }
  }

  if (loading) {
    return <Spinner page />;
  }

  if (error || !profile) {
    return (
      <Alert variant="error">
        {error ?? 'Não foi possível carregar os seus lembretes.'}
      </Alert>
    );
  }

  const locked = !profile.subscription.features.eventsManagement;

  return (
    <div className="page">
      <PageHeader
        title="Lembretes"
        description="Tudo o que o Jarvis vai te avisar no WhatsApp, e o que já foi enviado."
        actions={
          locked ? undefined : (
            <Button onClick={() => setCreatingLocal(true)}>
              <IconPlus />
              Novo lembrete
            </Button>
          )
        }
      />

      {locked ? (
        <Card>
          <PlanLocked feature="A gestão de lembretes" />
        </Card>
      ) : (
        <EventsView
          timezone={profile.timezone}
          creating={creating}
          onCloseCreate={closeCreate}
        />
      )}
    </div>
  );
}
