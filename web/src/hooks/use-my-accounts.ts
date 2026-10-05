import { useCallback, useEffect, useState } from 'react';
import { getMyAccounts } from '../services/finance.service';
import type { FinanceAccount } from '../types/api';

export function useMyAccounts() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  // Key of the last request that settled; loading is derived from it so the
  // effect never sets state synchronously.
  const [settledKey, setSettledKey] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getMyAccounts()
      .then((data) => {
        if (active) {
          setAccounts(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar as contas.',
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
  return { accounts, loading, error, reload };
}
