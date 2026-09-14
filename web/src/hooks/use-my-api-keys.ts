import { useCallback, useEffect, useState } from 'react';
import { getMyApiKeys } from '../services/api-keys.service';
import type { ApiKey } from '../types/api';

export function useMyApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    getMyApiKeys()
      .then((data) => {
        if (active) {
          setApiKeys(data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar as suas chaves.',
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

  return { apiKeys, setApiKeys, loading, error, reload };
}
