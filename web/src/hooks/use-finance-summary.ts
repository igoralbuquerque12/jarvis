import { useEffect, useState } from 'react';
import { getMyTransactions } from '../services/finance.service';
import type { TransactionSummary } from '../types/api';

/** Returns the income/expense/net summary for the current calendar month. */
export function useFinanceSummary() {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    getMyTransactions({ from, to, limit: 1 })
      .then((page) => {
        if (active) {
          setSummary(page.summary);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Erro ao carregar resumo.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { summary, loading, error };
}
