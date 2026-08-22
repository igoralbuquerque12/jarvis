import { z } from 'zod';

export const SecuroSetupStatusSchema = z.object({
  has_users: z.boolean(),
});

export const SecuroTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export const SecuroUserSchema = z.object({
  id: z.string(),
  email: z.string(),
});

export const SecuroWorkspaceListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
);

export const SecuroAccountListSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().nullish(),
    currency: z.string().nullish(),
  }),
);

export const SecuroCreatedAccountSchema = z.object({
  id: z.string(),
});

export type SecuroTokenResponse = z.infer<typeof SecuroTokenResponseSchema>;
