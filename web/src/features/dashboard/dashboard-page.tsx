import { Alert } from '../../components/ui/alert';
import { Spinner } from '../../components/ui/spinner';
import { useMyEvents } from '../../hooks/use-my-events';
import { useMyProfile } from '../../hooks/use-my-profile';
import { EventsCard } from './components/events-card';
import { SubscriptionCard } from './components/subscription-card';
import { WhatsappCard } from './components/whatsapp-card';

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

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">Painel</span>
        <h2>Fala, {profile.name.split(' ')[0]}!</h2>
        <p>
          Acompanhe seus próximos eventos e a conexão do Jarvis com o seu
          WhatsApp.
        </p>
        <span className="sunset-bar" aria-hidden="true" />
      </div>

      <div className="dash-grid">
        <EventsCard
          events={events}
          loading={eventsLoading}
          error={eventsError}
          timezone={profile.timezone}
          onChanged={reloadEvents}
        />
        <div className="dash-grid__aside">
          <WhatsappCard profile={profile} />
          <SubscriptionCard profile={profile} />
        </div>
      </div>
    </>
  );
}
