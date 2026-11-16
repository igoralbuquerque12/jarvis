import { useEffect, useState } from 'react';
import { getMyDatabaseInformation } from '../services/database-information.service';
import type { DatabaseInformation } from '../types/api';

/** How often the list is refreshed while a base is still being indexed. */
const INDEXING_POLL_MS = 3000;

function isIndexing(item: DatabaseInformation) {
  return item.indexStatus === 'PENDING' || item.indexStatus === 'PROCESSING';
}

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

  // Indexing runs in background on the server: poll until every base settles.
  const indexing = items.some(isIndexing);

  useEffect(() => {
    if (!indexing) {
      return;
    }

    const timer = window.setTimeout(() => {
      getMyDatabaseInformation()
        .then(setItems)
        .catch(() => undefined);
    }, INDEXING_POLL_MS);

    return () => window.clearTimeout(timer);
  }, [indexing, items]);

  return { items, setItems, loading, error };
}
