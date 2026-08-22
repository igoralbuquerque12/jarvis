import { useCallback, useEffect, useState } from 'react';
import type { FindTransactionsParams } from '../services/finance.service';
import { getMyTransactions } from '../services/finance.service';
import type { TransactionPage } from '../types/api';

const EMPTY_PAGE: TransactionPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  summary: { income: 0, expense: 0, net: 0 },
};

export function useMyTransactions(params: FindTransactionsParams = {}) {
  const [data, setData] = useState<TransactionPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Serialize params so the effect dependency is stable
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getMyTransactions(JSON.parse(paramsKey) as FindTransactionsParams)
      .then((page) => {
        if (active) {
          setData(page);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar as transações.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, loading, error, reload };
}
