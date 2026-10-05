import { useCallback, useEffect, useState } from 'react';
import { getMyRules } from '../services/finance.service';
import type { Rule } from '../types/api';

export function useMyRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  // Key of the last request that settled; loading is derived from it so the
  // effect never sets state synchronously.
  const [settledKey, setSettledKey] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getMyRules()
      .then((data) => {
        if (active) {
          setRules(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar as regras.',
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
  return { rules, loading, error, reload };
}
