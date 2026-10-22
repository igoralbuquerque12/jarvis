import { useCallback, useEffect, useState } from 'react';
import { getMyHealthCheckConfigs } from '../services/health-check.service';
import type { HealthCheckConfig } from '../types/api';

export function useMyHealthChecks() {
  const [configs, setConfigs] = useState<HealthCheckConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    getMyHealthCheckConfigs()
      .then((data) => {
        if (active) {
          setConfigs(data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar as configurações de Health Check.',
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

  return { configs, setConfigs, loading, error, reload };
}

