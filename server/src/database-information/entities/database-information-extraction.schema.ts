import { z } from 'zod';

// No length keywords here: they are enforced by the prompt and trimmed in the
// service, since OpenAI's strict mode may reject some JSON Schema keywords.
export const databaseInformationExtractionSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type DatabaseInformationExtraction = z.infer<
  typeof databaseInformationExtractionSchema
>;
