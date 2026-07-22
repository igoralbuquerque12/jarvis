import { createAuthClient } from 'better-auth/react';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000';

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl.replace(/\/$/, '')}/api/auth`,
});
