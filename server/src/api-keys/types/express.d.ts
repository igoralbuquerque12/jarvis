import type { Profile } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    /** Profile resolved by `ApiKeyGuard`. Present only on key-protected routes. */
    apiKeyProfile?: Profile;
  }
}
