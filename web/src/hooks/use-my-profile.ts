import { useCallback, useEffect, useState } from 'react';
import { getMyProfile } from '../services/profile.service';
import type { ProfileMe } from '../types/api';

export function useMyProfile() {
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((data) => {
        if (active) {
          setProfile(data);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Não foi possível carregar o seu perfil.',
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

  return { profile, setProfile, loading, error, reload };
}
