import { useCallback, useEffect, useState } from 'react';
import { getMyRecurring } from '../services/finance.service';
import type { RecurringTransaction } from '../types/api';

export function useMyRecurring() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  // Key of the last request that settled; loading is derived from it so the
  // effect never sets state synchronously.
  const [settledKey, setSettledKey] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getMyRecurring()
      .then((data) => {
        if (active) {
          setRecurring(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar as recorrências.',
          );
        }
      })
      .finally(() => {
        if (active) setSettledKey(version);
      });

    return () => {
      active = false;
    };
  }, [version]);

  const loading = settledKey !== version;
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { recurring, loading, error, reload };
}
