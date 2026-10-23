import { useCallback, useEffect, useState } from 'react';
import type { FindEventsParams } from '../services/events.service';
import { getMyEventPage } from '../services/events.service';
import type { EventPage } from '../types/api';

const EMPTY_PAGE: EventPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 25,
  counts: { upcoming: 0, past: 0 },
};

export function useMyEventPage(params: FindEventsParams = {}) {
  const [data, setData] = useState<EventPage>(EMPTY_PAGE);
  // Key of the last request that settled; loading is derived from it so the
  // effect never sets state synchronously.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const paramsKey = JSON.stringify(params);
  const requestKey = `${paramsKey}:${version}`;

  useEffect(() => {
    let active = true;
    getMyEventPage(JSON.parse(paramsKey) as FindEventsParams)
      .then((page) => {
        if (active) {
          setData(page);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar os lembretes.',
          );
        }
      })
      .finally(() => {
        if (active) setSettledKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [paramsKey, requestKey]);

  const loading = settledKey !== requestKey;
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { data, loading, error, reload };
}
