import { useCallback, useEffect, useState } from 'react';
import { getMyAssets } from '../services/finance.service';
import type { Asset } from '../types/api';

export function useMyAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  // Key of the last request that settled; loading is derived from it so the
  // effect never sets state synchronously.
  const [settledKey, setSettledKey] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    getMyAssets()
      .then((data) => {
        if (active) {
          setAssets(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar os investimentos.',
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
  return { assets, loading, error, reload };
}
