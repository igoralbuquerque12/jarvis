import { useCallback, useEffect, useState } from 'react';
import { getMyUpcomingEvents } from '../services/events.service';
import type { UpcomingEvent } from '../types/api';

export function useMyEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    getMyUpcomingEvents()
      .then((data) => {
        if (active) {
          setEvents(data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar os seus eventos.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return { events, loading, error, reload };
}
