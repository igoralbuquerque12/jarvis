import { useEffect, useState } from 'react';
import { getMyDatabaseInformation } from '../services/database-information.service';
import type { DatabaseInformation } from '../types/api';

export function useMyDatabaseInformation() {
  const [items, setItems] = useState<DatabaseInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyDatabaseInformation()
      .then((data) => {
        if (active) {
          setItems(data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar as suas bases de dados.',
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
  }, []);

  return { items, setItems, loading, error };
}
