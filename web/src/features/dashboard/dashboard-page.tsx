import { Link } from 'react-router-dom';
import { Alert } from '../../components/ui/alert';
import { IconPlus } from '../../components/ui/icons';
import { PageHeader } from '../../components/ui/page-header';
import { Spinner } from '../../components/ui/spinner';
import { useMyEvents } from '../../hooks/use-my-events';
import { useMyProfile } from '../../hooks/use-my-profile';
import { timeOfDayGreeting } from '../../lib/dates';
import { DashChartCard } from './components/dash-chart-card';
import { DashGoalsCard } from './components/dash-goals-card';
import { DashKpis } from './components/dash-kpis';
import { EventsCard } from './components/events-card';
import { SubscriptionCard } from './components/subscription-card';
import { WhatsappCard } from './components/whatsapp-card';

function todayLabel() {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function DashboardPage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useMyProfile();
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    reload: reloadEvents,
  } = useMyEvents();

  if (profileLoading) {
    return <Spinner page />;
  }

  if (profileError || !profile) {
    return (
      <Alert variant="error">
        {profileError ?? 'Não foi possível carregar o seu painel.'}
      </Alert>
    );
  }

  const firstName = profile.name.split(' ')[0];

  return (
    <div className="page">
      <PageHeader
        eyebrow={todayLabel()}
        title={`${timeOfDayGreeting()}, ${firstName}`}
        description="Seus lembretes, o mês financeiro e as metas em andamento."
        actions={
          <>
            <Link
              to={profile.whatsappLinked ? '/perfil' : '#conectar'}
              className={
                profile.whatsappLinked
                  ? 'status-pill status-pill--on'
                  : 'status-pill status-pill--off'
              }
            >
              <span className="status-pill__dot" aria-hidden="true" />
              {profile.whatsappLinked
                ? 'WhatsApp conectado'
                : 'WhatsApp pendente'}
            </Link>
            <Link
              to="/financas/transacoes?nova=1"
              className="btn btn--primary"
            >
              <IconPlus />
              Nova transação
            </Link>
          </>
        }
      />

      <DashKpis events={events} timezone={profile.timezone} />

      {!profile.whatsappLinked ? <WhatsappCard profile={profile} /> : null}

      <div className="cols">
        <div className="stack">
          <EventsCard
            events={events}
            loading={eventsLoading}
            error={eventsError}
            timezone={profile.timezone}
            onChanged={reloadEvents}
          />
          <DashChartCard />
        </div>
        <div className="stack">
          <DashGoalsCard />
          <SubscriptionCard profile={profile} />
        </div>
      </div>
    </div>
  );
}
